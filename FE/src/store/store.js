import { configureStore } from '@reduxjs/toolkit';
import session from './sessionSlice';
import learn from './learnSlice';
import enrollments, { selectSelectedAbbr } from './enrollmentsSlice';


export const store = configureStore({
reducer: { session, learn, enrollments },
}); 
export const typeRootState = null;

if (typeof window !== "undefined") {
  const LS_KEY = "learn";
  // Hydrate từ localStorage khi bắt đầu
  try {
    const abbr = localStorage.getItem(LS_KEY);
    if (abbr) {
      store.dispatch({ type: "enrollments/setSelectedByAbbr", payload: abbr });
    }
  } catch (e) {
    console.warn('[store] localStorage hydration failed:', e);
  }

  // Lắng nghe thay đổi và lưu lại
  let prev = null;
  store.subscribe(() => {
    const next = selectSelectedAbbr(store.getState());
    if (next !== prev) {
      prev = next;
      try {
        if (next) localStorage.setItem(LS_KEY, next);
        else localStorage.removeItem(LS_KEY);
        // phát sự kiện để các chỗ khác (nếu cần) bám theo
        window.dispatchEvent(new CustomEvent("learn:changed", { detail: { abbr: next } }));
      } catch (e) {
        console.warn('[store] localStorage update failed:', e);
      }
    }
  });
}