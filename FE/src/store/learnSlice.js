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
  // Ưu tiên: giá trị hiện có → localStorage('learn') → Enrollments.me()
  let abbr = (currentAbbr || '').toLowerCase() || readAbbr();
  if (abbr) return abbr;

  // Chưa có → lấy từ enrollment đầu tiên
  const me = await api.Enrollments.me();
  const arr = Array.isArray(me) ? me : (me?.results || []);
  const first = arr[0];
  abbr = (first?.language?.abbreviation || first?.language?.code || '').toLowerCase();
  if (!abbr) {
    // Không có enrollment nào
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

/**
 * fetchTopicsSafe:
 * - Lấy abbr theo ưu tiên: arg.abbr → state.learn.abbr → localStorage → Enrollments.me()
 * - Gọi /topics/by-language?language_abbr=<abbr>
 * - Offline fallback: nếu mạng lỗi và có cache → fulfill (offline)
 * - 401 → rejectWithValue({ code:'unauthenticated', message:'...' })
 * - 403 → rejectWithValue({ code:'not_enrolled', message:'...' })
 */
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
      const isNetworkError = !response; // axios: không có response => offline/server down
      const cached = abbr ? getCachedTopics(abbr) : null;

      // Phân loại lỗi rõ ràng cho UI
      if (status === 401) {
        return thunkAPI.rejectWithValue({ code: 'unauthenticated', message: 'Bạn chưa đăng nhập.' });
      }
      if (status === 403) {
        return thunkAPI.rejectWithValue({ code: 'not_enrolled', message: 'Bạn chưa đăng ký ngôn ngữ này.' });
      }

      if (isNetworkError && cached && cached.length) {
        // Fulfill thay vì reject để UI hoạt động bình thường ở chế độ offline
        return thunkAPI.fulfillWithValue({
          abbr,
          items: cached,
          fromCache: true,
          offline: true,
          error: 'network',
        });
      }

      // Không có cache hoặc lỗi khác
      const msg =
        isNetworkError ? 'offline' : (err?.message || response?.data?.detail || 'Failed to load topics');
      return thunkAPI.rejectWithValue({ code: isNetworkError ? 'offline' : 'error', message: msg });
    }
  }
);

export const startLessonSession = createAsyncThunk(
  'learn/startLessonSession',
  async ({ lessonId }, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const abbr = state.learn.abbr || readAbbr();

      const me = await api.Enrollments.me();
      const items = Array.isArray(me) ? me : (me?.results || []);
      const en =
        items.find((x) =>
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

// ----------------- Slice -----------------
const initialState = {
  abbr: '',
  topicsByAbbr: {}, // abbr -> { items: [], lastSync: number|null, fromCache: boolean }
  status: 'idle',   // idle | loading | refreshing | ready | offline
  error: null,      // string (message)
  errorCode: null,  // 'unauthenticated' | 'not_enrolled' | 'offline' | 'error' | null
  offline: false,
  lastSync: null,
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
    // optional: clear lỗi thủ công nếu cần
    clearLearnError(state) {
      state.error = null;
      state.errorCode = null;
    },
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
      s.errorCode = null;
    });

    b.addCase(fetchTopicsSafe.fulfilled, (s, a) => {
      const { abbr, items, fromCache, offline } = a.payload;
      s.abbr = abbr || s.abbr;
      s.topicsByAbbr[abbr] = { items, lastSync: Date.now(), fromCache: !!fromCache };
      s.status = offline ? 'offline' : 'ready';
      s.offline = !!offline;
      s.error = null;
      s.errorCode = null;
      s.lastSync = Date.now();
    });

    b.addCase(fetchTopicsSafe.rejected, (s, a) => {
      const code = a.payload?.code || a.error?.code || null;
      const message = a.payload?.message || a.error?.message || 'Offline';

      if (code === 'offline') {
        s.status = 'offline';
        s.offline = true;
      } else {
        // với 401/403 hoặc lỗi khác: coi như không offline
        s.status = s.status === 'loading' ? 'idle' : s.status; // giữ nguyên nếu đang ready
        s.offline = false;
      }
      s.error = message;
      s.errorCode = code;
    });
  }
});

export const { setAbbr, clearLearnError } = learn.actions;
export default learn.reducer;
