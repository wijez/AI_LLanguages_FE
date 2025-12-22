import { configureStore, combineReducers } from '@reduxjs/toolkit';
import session, { logout } from './sessionSlice'; 
import learn from './learnSlice';
import enrollments, { selectSelectedAbbr } from './enrollmentsSlice';

const appReducer = combineReducers({
  session,
  learn,
  enrollments,
});

// 3. Tạo Root Reducer để hứng sự kiện Logout
const rootReducer = (state, action) => {
  if (action.type === logout.type) {
    state = undefined;
    
    try {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      localStorage.removeItem("session.user.v1");
      // localStorage.removeItem("learn"); 
    } catch (e) {
      console.warn("Logout cleanup failed:", e);
    }
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer, 
}); 

export const typeRootState = null;

if (typeof window !== "undefined") {
  const LS_KEY = "learn";
  try {
    const abbr = localStorage.getItem(LS_KEY);
    if (abbr) {
      store.dispatch({ type: "enrollments/setSelectedByAbbr", payload: abbr });
    }
  } catch (e) {
    console.warn('[store] localStorage hydration failed:', e);
  }

  let prev = null;
  store.subscribe(() => {
    const next = selectSelectedAbbr(store.getState());
    if (next !== prev) {
      prev = next;
      try {
        if (next) localStorage.setItem(LS_KEY, next);
        else localStorage.removeItem(LS_KEY);
        window.dispatchEvent(new CustomEvent("learn:changed", { detail: { abbr: next } }));
      } catch (e) {
        console.warn('[store] localStorage update failed:', e);
      }
    }
  });
}