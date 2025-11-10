import { useEffect } from "react";
import InfoCard from "../Cards/InfoCard";
// import { api } from "../../api/api";
import { fetchMeSafe } from "../../store/sessionSlice";
import { selectUserView } from "../../store/selectors";
import { useDispatch, useSelector, shallowEqual } from "react-redux";

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
  const user = useSelector(selectUserView, shallowEqual);
  const { offline, status, lastSync } = useSelector(
    (s) => ({
      offline: s.session.offline,
      status: s.session.status,
      lastSync: s.session.lastSync,
    }),
    shallowEqual
  );

  // Chỉ fetch khi chưa có user hoặc dữ liệu đã "stale"
  useEffect(() => {
    const STALE_MS = 5 * 60 * 1000; // 5 phút
    if (!user) {
      dispatch(fetchMeSafe());
      return;
    }
    if (!offline && (!lastSync || Date.now() - lastSync > STALE_MS)) {
      dispatch(fetchMeSafe());
    }
  }, [dispatch, user, lastSync, offline]);

  useEffect(() => {
    if (!offline) return;
    const id = setInterval(() => dispatch(fetchMeSafe()), 15000);
    return () => clearInterval(id);
  }, [offline, dispatch]);

  if (
    !user &&
    (status === "loading" || status === "refreshing")
  ) {
    return <div className="text-gray-500">Loading…</div>;
  }
  if (!user) {
    return (
      <div className="text-red-600">Không thể tải hồ sơ (không có cache).</div>
    );
  }

  // Chuẩn hóa trước khi truyền xuống Card
  const normalized = {
    ...user,
    role: user.is_superuser ? "Super Admin" : user.is_staff ? "Admin" : "User",
    _fmt: {
      date_joined: fmt(user.date_joined),
      last_active: fmt(user.last_active),
      last_login: fmt(user.last_login),
    },
  };

  return <InfoCard user={normalized} />;
}
