import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../api/api";

const KEY = "session.user.v1";

const setCachedTokens = ({ access, refresh }) => {
  try {
    if (access) localStorage.setItem("access", access);
    if (refresh) localStorage.setItem("refresh", refresh);
  } catch (e) {
    console.warn("[sessionSlice] setCachedTokens failed:", e);
  }
};

const clearCachedTokens = () => {
  try {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
  } catch (e) {
    console.warn("[sessionSlice] logout localStorage cleanup failed:", e);
  }
};

const getCachedUser = () => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
const setCachedUser = (u) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(u));
  } catch (e) {
    console.warn("[sessionSlice] setCachedUser failed:", e);
  }
};
const clearCachedUser = () => {
  try {
    localStorage.removeItem(KEY);
  } catch (e) {
    console.warn("[sessionSlice] clearCachedUser failed:", e);
  }
};

export const hydrateFromCache = createAsyncThunk(
  "session/hydrateFromCache",
  async () => {
    const user = getCachedUser();
    const hasTokens =
      typeof window !== "undefined" &&
      (localStorage.getItem("access") || localStorage.getItem("refresh"));
    // Chỉ hydrate nếu vẫn còn token
    return { user: hasTokens ? user : null, fromCache: hasTokens && !!user };
  }
);

export const fetchMeSafe = createAsyncThunk(
  "session/fetchMeSafe",
  async (_, thunkAPI) => {
    try {
      const user = await api.Users.me();
      setCachedUser(user);
      return { user, fromCache: false, offline: false };
    } catch (err) {
      const cached = getCachedUser();
      const isNetworkError = !err?.response;
      const is401 = err?.response?.status === 401;
      if (cached && !is401) {
        return thunkAPI.fulfillWithValue({
          user: cached,
          fromCache: true,
          offline: true,
          error: isNetworkError ? "network" : err?.message || "error",
        });
      }
      if (is401) {
        clearCachedUser();
        clearCachedTokens();
        return thunkAPI.rejectWithValue({ code: "unauthorized" });
      }
      return thunkAPI.rejectWithValue({
        code: isNetworkError ? "offline" : "error",
        message: err?.message || "Failed to load user",
      });
    }
  }
);

const initialState = {
  user: null,
  status: "idle", // idle | loading | refreshing | authenticated | offline | anony
  fromCache: false,
  offline: false,
  error: null,
  lastSync: null,
};

const slice = createSlice({
  name: "session",
  initialState,
  reducers: {
    loginSuccess(state, action) {
      const { user, tokens } = action.payload;
      state.user = user;
      state.status = "authenticated";
      state.fromCache = false;
      state.offline = false;
      state.error = null;
      state.lastSync = Date.now();

      // Đồng bộ ra localStorage
      setCachedUser(user);
      setCachedTokens(tokens);
    },
    logout(state) {
      state.user = null;
      state.status = "anonymous";
      state.fromCache = false;
      state.offline = false;
      state.error = null;
      state.lastSync = null;
      clearCachedUser();
      clearCachedTokens();
    },
  },  
  extraReducers: (b) => {
    b.addCase(hydrateFromCache.fulfilled, (s, a) => {
      if (a.payload.user) {
        s.user = a.payload.user;
        s.fromCache = true;
        s.status = "authenticated";
      } else {
        s.user = null;
        s.fromCache = false;
        s.status = "anonymous";
      }
    });
    b.addCase(fetchMeSafe.pending, (s) => {
      s.status = s.user ? "refreshing" : "loading";
      s.error = null;
    });
    b.addCase(fetchMeSafe.fulfilled, (s, a) => {
      s.user = a.payload.user;
      s.fromCache = !!a.payload.fromCache;
      s.offline = !!a.payload.offline;
      s.status = "authenticated";
      s.lastSync = Date.now();
      s.error = null;
    });
    b.addCase(fetchMeSafe.rejected, (s, a) => {
      const code = a.payload?.code || a.payload;
      if (code === "offline") {
        s.status = "offline";
        s.offline = true;
      } else if (code === "unauthorized") {
        s.status = "anonymous";
        s.user = null;
        s.offline = false;
      } else {
        // lỗi khác → không authed nhưng cũng không coi là offline
        s.status = "idle";
        s.offline = false;
      }
      s.error = a.payload?.message || a.error?.message || String(code || "");
    });
  },
});

export const { logout, loginSuccess } = slice.actions;
export default slice.reducer;


export const selectSession = (s) => s.session;
export const selectIsBusy = (s) =>
  s.session.status === "loading" || s.session.status === "refreshing";
export const selectIsAuthed = (s) => !!s.session.user;