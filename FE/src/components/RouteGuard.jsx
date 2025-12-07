import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import Spinner from "./Spinner";
const selectSession = (s) => s.session;

/**
 * mode:
 * - "guest"  : chỉ cho khách (public-only, ví dụ /login, /signup). Nếu đã login -> đá sang /learn
 * - "user"   : yêu cầu đăng nhập
 * - "admin"  : yêu cầu đăng nhập + có quyền admin (is_staff || is_superuser)
 * - "public" : ai cũng vào được
 */

const LAST_PATH_KEY = "app.lastPath.v1";
const EXCLUDED_PREFIXES = [
  "/login",
  "/register",
  "/signup",
  "/verify",
  "/forbidden",
  "/admin",
];

const isExcluded = (pathname) =>
  EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p));

// Debug flag: dev luôn bật, trừ khi VITE_DEBUG_API=0; prod bật khi VITE_DEBUG_API=1 hoặc localStorage.debug_api=1
const DEBUG_LOG =
  import.meta?.env?.VITE_DEBUG_API === "1" ||
  (import.meta?.env?.DEV && import.meta?.env?.VITE_DEBUG_API !== "0") ||
  (typeof window !== "undefined" && localStorage.getItem("debug_api") === "1");

export default function RouteGuard({ mode = "public" }) {
  const { user, status } = useSelector(selectSession);
  const location = useLocation();

  const { pathname, search } = location;
  const fullPath = pathname + (search || "");

  // ALWAYS call hooks at top-level (no early return before this)
  useEffect(() => {
    // Không làm gì khi đang loading/refreshing
    if (status === "loading" || status === "refreshing") return;

    // Chỉ lưu lastPath khi đã đăng nhập, không ở guest và không thuộc excluded
    if (!user) return;
    if (mode === "guest") return;
    if (isExcluded(pathname)) return;

    try {
      localStorage.setItem(LAST_PATH_KEY, fullPath);
    } catch (e) {
      if (DEBUG_LOG) console.warn("[RouteGuard] setItem failed:", e?.name || e);
      /* no-op: Safari Private Mode / storage denied / quota exceeded */
    }
  }, [status, user, mode, pathname, fullPath]);

  const isBusy = status === "loading" || status === "refreshing";
  if (isBusy) return <Spinner />;

  const nextQS = encodeURIComponent(fullPath);

  switch (mode) {
    case "guest": {
      // Nếu đã login mà vào trang guest -> đẩy về next || lastPath || /learn
      if (user) {
        const qs = new URLSearchParams(search);
        const nextFromQuery = qs.get("next");

        let to = "/learn";
        try {
          const raw = localStorage.getItem(LAST_PATH_KEY);
          if (nextFromQuery) to = nextFromQuery;
          else if (raw && !isExcluded(raw) && raw !== "/") to = raw;
        } catch (e) {
          if (DEBUG_LOG)
            console.warn("[RouteGuard] getItem failed:", e?.name || e);
          /* no-op */
        }

        return <Navigate to={to} replace />;
      }
      return <Outlet />;
    }
    case "user": {
      // Cần đăng nhập -> kèm ?next để quay lại đúng trang sau khi login
      if (!user) return <Navigate to={`/login?next=${nextQS}`} replace />;
      return <Outlet />;
    }
    case "admin": {
      if (!user) return <Navigate to={`/login?next=${nextQS}`} replace />;
      const isAuthorized = user.is_staff || user.is_superuser;
      if (!isAuthorized) return <Navigate to="/forbidden" replace />;
      return <Outlet />;
    }
    default:
      return <Outlet />;
  }
}
