import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../api/api";
import { logout } from "./sessionSlice";

const getAbbr = (e) => e?.language?.abbreviation || e?.language?.code || "";

export const fetchEnrollments = createAsyncThunk(
  "enrollments/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.Enrollments.me();
      return Array.isArray(res) ? res : (res?.results || []);
    } catch (e) {
      return rejectWithValue(e?.response?.data?.detail || e?.message || "Failed to load");
    }
  }
);

const initialState = {
  items: [],
  status: "idle", // idle | loading | succeeded | failed
  error: null,
  selectedAbbr: null, // "en", "ja"
  lastFetchedAt: null,
};

const enrollmentsSlice = createSlice({
  name: "enrollments",
  initialState,
  reducers: {
    setSelectedByAbbr(state, action) {
      const next = action.payload ? String(action.payload).toLowerCase() : null;
      if (state.selectedAbbr === next) return; // tránh tạo state mới khi cùng giá trị
      state.selectedAbbr = next;
    },
    clearEnrollments(state) {
      state.items = [];
      state.status = "idle";
      state.error = null;
      state.selectedAbbr = null;
      state.lastFetchedAt = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEnrollments.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchEnrollments.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload || [];
        state.lastFetchedAt = Date.now();
        if (
          state.selectedAbbr &&
          !state.items.some((e) => getAbbr(e)?.toLowerCase() === state.selectedAbbr)
        ) {
          state.selectedAbbr = null;
        }
      })
      .addCase(fetchEnrollments.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to load";
        state.items = [];
      })
      .addCase(logout, (state) => {
        state.items = [];
        state.status = "idle";
        state.error = null;
        state.selectedAbbr = null;
        state.lastFetchedAt = null;
      });
  },
});

export const { setSelectedByAbbr, clearEnrollments } = enrollmentsSlice.actions;

// Selectors
export const selectEnrollmentsState = (s) => s.enrollments;
export const selectEnrollments = (s) => s.enrollments.items;
export const selectSelectedAbbr = (s) => s.enrollments.selectedAbbr;
export const selectSelectedEnrollment = (s) => {
  const abbr = s.enrollments.selectedAbbr;
  if (!abbr) return null;
  return s.enrollments.items.find((e) => getAbbr(e)?.toLowerCase() === abbr) || null;
};

export default enrollmentsSlice.reducer;
