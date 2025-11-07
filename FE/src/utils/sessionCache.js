const KEY = "session.user.v1";
export function getCachedUser() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn('[sessionCache] getCachedUser failed:', e);
    return null;
  }
}
export function setCachedUser(user) {
  try {
    localStorage.setItem(KEY, JSON.stringify(user));
  } catch (e) {
    console.warn('[sessionCache] setCachedUser failed:', e);
  }
}
export function clearCachedUser() {
  try {
    localStorage.removeItem(KEY);
  } catch (e) {
    console.warn('[sessionCache] clearCachedUser failed:', e);
  }
}
