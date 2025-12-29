import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../api/api';

const K_ABBR = 'learn';
const K_TOPICS = (abbr) => `topics.${abbr}.v1`;

const readAbbr = () => {
  try {
    const raw = localStorage.getItem(K_ABBR) || '';
    return raw.split('-')[0].toLowerCase();
  } catch { return ''; }
};
const writeAbbr = (abbr) => { try { if (abbr) localStorage.setItem(K_ABBR, abbr); } catch (e) {
    console.warn('[learnSlice] writeAbbr failed:', e);
} };
const getCachedTopics = (abbr) => {
  try {
    const raw = localStorage.getItem(K_TOPICS(abbr));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};
const setCachedTopics = (abbr, items) => {
  try { localStorage.setItem(K_TOPICS(abbr), JSON.stringify(items || [])); } catch (e) {
    console.warn('[learnSlice] setCachedTopics failed:', e);
  }
};

// ----------------- Helpers -----------------
async function pickAbbrOrThrow(currentAbbr) {
  let abbr = (currentAbbr || '').toLowerCase() || readAbbr();
  if (abbr) return abbr;

  const me = await api.Enrollments.me();
  const arr = Array.isArray(me) ? me : (me?.results || []);
  const first = arr[0];
  abbr = (first?.language?.abbreviation || first?.language?.code || '').toLowerCase();
  if (!abbr) {
    const err = new Error('NO_LANGUAGE');
    err.code = 'no_language';
    throw err;
  }
  writeAbbr(abbr);
  return abbr;
}

function toItems(res) {
  const raw = Array.isArray(res?.results) ? res.results : (Array.isArray(res) ? res : []);
  return [...(raw || [])].sort((a, b) => (a.order - b.order) || (a.id - b.id));
}

// ----------------- Thunks -----------------
export const hydrateLearn = createAsyncThunk('learn/hydrate', async () => {
  const abbr = readAbbr();
  const cached = abbr ? getCachedTopics(abbr) : null;
  return { abbr, cached: cached || [] };
});

export const fetchTopicsSafe = createAsyncThunk(
  'learn/fetchTopicsSafe',
  async (arg, thunkAPI) => {
    const state = thunkAPI.getState();
    let abbr = (arg && arg.abbr) || state.learn.abbr || '';

    try {
      abbr = await pickAbbrOrThrow(abbr);
      const res = await api.Topics.byLanguage({ language_abbr: abbr, page_size: 200 });
      const items = toItems(res);
      setCachedTopics(abbr, items);
      return { abbr, items, fromCache: false, offline: false };
    } catch (err) {
      const response = err?.response;
      const status = response?.status;
      const isNetworkError = !response;
      const cached = abbr ? getCachedTopics(abbr) : null;

      if (status === 401) return thunkAPI.rejectWithValue({ code: 'unauthenticated', message: 'Bạn chưa đăng nhập.' });
      if (status === 403) return thunkAPI.rejectWithValue({ code: 'not_enrolled', message: 'Bạn chưa đăng ký ngôn ngữ này.' });

      if (isNetworkError && cached && cached.length) {
        return thunkAPI.fulfillWithValue({ abbr, items: cached, fromCache: true, offline: true, error: 'network' });
      }

      const msg = isNetworkError ? 'offline' : (err?.message || response?.data?.detail || 'Failed to load topics');
      return thunkAPI.rejectWithValue({ code: isNetworkError ? 'offline' : 'error', message: msg });
    }
  }
);

//Start Session - Lưu vào currentSession
export const startLessonSession = createAsyncThunk(
  'learn/startLessonSession',
  async ({ lessonId }, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const abbr = state.learn.abbr || readAbbr();
      const me = await api.Enrollments.me();
      const items = Array.isArray(me) ? me : (me?.results || []);
      const en = items.find((x) =>
          (x?.language?.abbreviation || x?.language?.code || '').toLowerCase() === (abbr || '').toLowerCase()
        ) || items[0];
      if (!en) throw new Error('No enrollment');

      const session = await api.LearningSessions.start({ lesson: lessonId, enrollment: en.id });
      return session; // { id, ... }
    } catch (e) {
      return thunkAPI.rejectWithValue(e?.message || 'Failed to start session');
    }
  }
);

export const resumeLessonSession = createAsyncThunk(
  "learn/resumeLessonSession",
  async ({ sessionId }, { rejectWithValue }) => {
    try {
      // Gọi API resume (đã update ở Backend để trả về resume_context)
      const response = await api.LearningSessions.resume(sessionId);
      return response;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || err.message || "Resume failed");
    }
  }
);

// ----------------- Slice -----------------
const initialState = {
  abbr: '',
  topicsByAbbr: {}, 
  status: 'idle',   
  error: null,      
  errorCode: null,  
  offline: false,
  lastSync: null,
  
  // Session State
  currentSession: null, 
  sessionStatus: 'idle', // idle | loading | active | error
};

const learn = createSlice({
  name: 'learn',
  initialState,
  reducers: {
    setAbbr(state, action) {
      const v = (action.payload || '').split('-')[0].toLowerCase();
      state.abbr = v;
      if (v) writeAbbr(v);
    },
    clearLearnError(state) {
      state.error = null;
      state.errorCode = null;
    },
    // Reset session khi thoát bài học
    clearCurrentSession(state) {
        state.currentSession = null;
        state.sessionStatus = 'idle';
    }
  },
  extraReducers: (b) => {
    b.addCase(hydrateLearn.fulfilled, (s, a) => {
      if (a.payload.abbr) s.abbr = a.payload.abbr;
      if (a.payload.cached?.length) {
        s.topicsByAbbr[s.abbr] = { items: a.payload.cached, lastSync: null, fromCache: true };
        s.status = 'ready';
      }
    });

    b.addCase(fetchTopicsSafe.pending, (s) => {
      s.status = s.status === 'ready' ? 'refreshing' : 'loading';
      s.error = null;
    });

    b.addCase(fetchTopicsSafe.fulfilled, (s, a) => {
      const { abbr, items, fromCache, offline } = a.payload;
      s.abbr = abbr || s.abbr;
      s.topicsByAbbr[abbr] = { items, lastSync: Date.now(), fromCache: !!fromCache };
      s.status = offline ? 'offline' : 'ready';
      s.offline = !!offline;
      s.error = null;
      s.lastSync = Date.now();
    });

    b.addCase(fetchTopicsSafe.rejected, (s, a) => {
      const code = a.payload?.code || a.error?.code || null;
      const message = a.payload?.message || a.error?.message || 'Offline';
      if (code === 'offline') {
        s.status = 'offline';
        s.offline = true;
      } else {
        s.status = s.status === 'loading' ? 'idle' : s.status;
        s.offline = false;
      }
      s.error = message;
      s.errorCode = code;
    });

    b.addCase(startLessonSession.pending, (s) => {
        s.sessionStatus = 'loading';
    });
    b.addCase(startLessonSession.fulfilled, (s, a) => {
        s.sessionStatus = 'active';
        s.currentSession = a.payload;
    });
    b.addCase(startLessonSession.rejected, (s, a) => {
        s.sessionStatus = 'error';
        s.error = a.payload || "Start session failed";
    });

    b.addCase(resumeLessonSession.pending, (s) => {
        s.sessionStatus = 'loading';
    });
    b.addCase(resumeLessonSession.fulfilled, (s, a) => {
        s.sessionStatus = 'active';
        s.currentSession = a.payload;
    });
    b.addCase(resumeLessonSession.rejected, (s, a) => {
        s.sessionStatus = 'error';
        s.error = a.payload || "Resume session failed";
    });
  }
});

export const { setAbbr, clearLearnError, clearCurrentSession } = learn.actions;
export default learn.reducer;