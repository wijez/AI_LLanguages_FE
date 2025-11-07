import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../api/api"; 

const KEY = "session.user.v1";
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
    console.warn('[sessionSlice] setCachedUser failed:', e);
  }
};
const clearCachedUser = () => {
  try {
    localStorage.removeItem(KEY);
  } catch (e) {
    console.warn('[sessionSlice] clearCachedUser failed:', e);
  }
};

export const hydrateFromCache = createAsyncThunk(
  "session/hydrateFromCache",
  async () => {
    const user = getCachedUser();
    return { user, fromCache: !!user };
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
      if (cached) {
        return thunkAPI.fulfillWithValue({
          user: cached,
          fromCache: true,
          offline: true,
          error: isNetworkError ? "network" : err?.message || "error",
        });
      }
      return thunkAPI.rejectWithValue(
        isNetworkError ? "offline" : err?.message || "Failed to load user"
      );
    }
  }
);

const initialState = {
  user: null,
  status: "idle", // idle | loading | refreshing | authenticated | offline
  fromCache: false,
  offline: false,
  error: null,
  lastSync: null,
};

const slice = createSlice({
  name: "session",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.status = "idle";
      state.fromCache = false;
      state.offline = false;
      state.error = null;
      state.lastSync = null;
      clearCachedUser();
      try {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
      } catch (e) {
        console.warn('[sessionSlice] logout localStorage cleanup failed:', e);
      }
    },
  },
  extraReducers: (b) => {
    b.addCase(hydrateFromCache.fulfilled, (s, a) => {
      if (a.payload.user) {
        s.user = a.payload.user;
        s.fromCache = true;
        s.status = "authenticated";
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
      s.status = "offline";
      s.offline = true;
      s.error = a.payload || a.error?.message || "Offline";
    });
  },
});

export const { logout } = slice.actions;
export default slice.reducer;
