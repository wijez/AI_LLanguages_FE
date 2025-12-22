import { useEffect } from "react";
import InfoCard from "../Cards/InfoCard";
import { fetchMeSafe } from "../../store/sessionSlice";
import { selectUserView } from "../../store/selectors";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import Spinner from "../Spinner";

const TZ = "Asia/Ho_Chi_Minh";
function fmt(iso) {
  if (!iso) return "Never";
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: TZ,
  });
  const time = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: TZ,
  });
  return `${date} at ${time}`;
}

export default function Info() {
  const dispatch = useDispatch();

  // View đã chuẩn hoá để hiển thị
  const userView = useSelector(selectUserView, shallowEqual);

  // Trạng thái session gốc để gate & refetch
  const { sessionUser, offline, status, lastSync } = useSelector(
    (s) => ({
      sessionUser: s.session.user,
      offline: s.session.offline,
      status: s.session.status,
      lastSync: s.session.lastSync,
    }),
    shallowEqual
  );

  // Luôn đảm bảo có /me ngay khi vào Info (hoặc khi data đã cũ)
  useEffect(() => {
    const STALE_MS = 5 * 60 * 1000; // 5 phút
    if (!sessionUser) {
      dispatch(fetchMeSafe());
      return;
    }
    if (!offline && (!lastSync || Date.now() - lastSync > STALE_MS)) {
      dispatch(fetchMeSafe());
    }
  }, [dispatch, sessionUser, lastSync, offline]);

  // Khi offline thì polling nhẹ để đồng bộ lại khi có mạng
  useEffect(() => {
    if (!offline) return;
    const id = setInterval(() => dispatch(fetchMeSafe()), 15000);
    return () => clearInterval(id);
  }, [offline, dispatch]);

  const isBusy = status === "loading" || status === "refreshing";

  // Nếu chưa có sessionUser HOẶC đang busy → hiển thị Spinner (không để khung rỗng phải F5)
  if (!sessionUser || isBusy || !userView) {
    return <Spinner />;
  }

  // Chuẩn hoá thêm vài field tiện display (fallback nếu view thiếu)
  const normalized = {
    ...userView,
    role:
      (sessionUser?.is_superuser && "Super Admin") ||
      (sessionUser?.is_staff && "Admin") ||
      "User",
    _fmt: {
      date_joined: fmt(userView.date_joined || sessionUser?.date_joined),
      last_active: fmt(userView.last_active || sessionUser?.last_active),
      last_login: fmt(userView.last_login || sessionUser?.last_login),
    },
  };

  return <InfoCard className="p-0" user={normalized} />;
}
