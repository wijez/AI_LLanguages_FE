import React from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import Spinner from "./Spinner";
const selectSession = (s) => s.session;

/**
 * mode:
 * - "guest"  : chỉ cho khách (public-only, ví dụ /login, /signup). Nếu đã login -> đá sang /learn
 * - "user"   : yêu cầu đăng nhập
 * - "admin"  : yêu cầu đăng nhập + có quyền admin (is_staff || is_superuser)
 * - "public" : ai cũng vào được (hiếm khi cần wrap)
 */
export default function RouteGuard({ mode = "public" }) {
  const { user, status } = useSelector(selectSession);
  const location = useLocation();

  // Chỉ coi "loading" là đang tải. 
  const isBusy = status === "loading" || status === "refreshing";
  if(isBusy) return <Spinner />
  

  switch (mode) {
    case "guest": {
      // Public-only: nếu đã login thì chuyển sang /learn
      if (user) return <Navigate to="/learn" replace />;
      return <Outlet />;
    }
    case "user": {
      // Cần đăng nhập
      if (!user)
        return <Navigate to="/login" state={{ from: location }} replace />;
      return <Outlet />;
    }
    case "admin": {
      if (!user)
        return <Navigate to="/login" state={{ from: location }} replace />;
      const isAuthorized = user.is_staff || user.is_superuser;
      if (!isAuthorized) return <Navigate to="/forbidden" replace />;
      return <Outlet />;
    }
    default:
      // "public"
      return <Outlet />;
  }
}
