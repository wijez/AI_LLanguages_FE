// FE/src/pages/Friend.jsx (hoặc tương đương)
import React from "react";
import { Mail } from "lucide-react";
import { api } from "../../api/api";

export default function Friend() {
  const [email, setEmail] = React.useState("");
  const [me, setMe] = React.useState(null);

  const [loadingSearch, setLoadingSearch] = React.useState(false);
  const [searchError, setSearchError] = React.useState("");
  const [results, setResults] = React.useState([]);

  const [sendingIds, setSendingIds] = React.useState([]); // user ids đang gửi lời mời
  const [sentStatus, setSentStatus] = React.useState({}); // { [userId]: "pending" | "accepted" | "error:..." }
  const [globalError, setGlobalError] = React.useState("");

  // Map từ userId -> trạng thái quan hệ từ backend: "accepted" | "pending_sent" | "pending_received"
  const [friendMap, setFriendMap] = React.useState({});
  // Danh sách lời mời đang gửi tới mình
  const [incomingInvites, setIncomingInvites] = React.useState([]);
  // Toggle mở/đóng hộp thư
  const [showInvites, setShowInvites] = React.useState(false);

  const [acceptingIds, setAcceptingIds] = React.useState([]); // friendIds đang accept
  const [decliningIds, setDecliningIds] = React.useState([]); // friendIds đang decline

  // Lấy thông tin user hiện tại
  React.useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const u = await api.Users.me({}, { ttl: 30000 });
        if (!cancel) setMe(u);
      } catch (e) {
        console.warn("Failed to load me():", e);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  // Sau khi có me -> load /friends/ để biết quan hệ và lời mời
  React.useEffect(() => {
    if (!me?.id) return;
    let cancel = false;

    (async () => {
      try {
        const res = await api.Friends.list({ page_size: 200 }, { ttl: 0 });
        const items = Array.isArray(res?.results)
          ? res.results
          : Array.isArray(res)
          ? res
          : [];

        const map = {};
        const invites = [];
        const myId = me.id;

        items.forEach((fr) => {
          // Hỗ trợ cả dạng object và dạng id
          const fromId =
            typeof fr.from_user === "object" ? fr.from_user?.id : fr.from_user;
          const toId =
            typeof fr.to_user === "object" ? fr.to_user?.id : fr.to_user;

          let otherId = null;
          let status = null;

          if (fromId === myId && toId) {
            otherId = toId;
            status = fr.accepted ? "accepted" : "pending_sent";
          } else if (toId === myId && fromId) {
            otherId = fromId;
            status = fr.accepted ? "accepted" : "pending_received";
          }

          // Lời mời tới mình (to_user = me, accepted = False)
          if (toId === myId && !fr.accepted) {
            invites.push(fr);
          }

          if (!otherId || !status) return;

          const prev = map[otherId];
          if (!prev || prev !== "accepted") {
            map[otherId] = status;
          }
        });

        if (!cancel) {
          setFriendMap(map);
          setIncomingInvites(invites);
        }
      } catch (e) {
        console.warn("Failed to load friends:", e);
      }
    })();

    return () => {
      cancel = true;
    };
  }, [me?.id]);

  // Hàm tính độ "relevance" giữa user và query (score càng nhỏ càng tốt)
  const computeRelevance = (u, qLower) => {
    const email = (u.email || "").toLowerCase();
    const username = (u.username || "").toLowerCase();

    let priority = 5;

    if (email === qLower || username === qLower) {
      priority = 0; // trùng exact
    } else if (email.startsWith(qLower)) {
      priority = 1;
    } else if (username.startsWith(qLower)) {
      priority = 2;
    } else if (email.includes(qLower)) {
      priority = 3;
    } else if (username.includes(qLower)) {
      priority = 4;
    }

    const lenDiff = Math.min(
      Math.abs(email.length - qLower.length),
      Math.abs(username.length - qLower.length),
      50
    );

    return priority * 100 + lenDiff;
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    const q = email.trim();
    if (!q) {
      setSearchError("Nhập email để tìm kiếm.");
      setResults([]);
      return;
    }
    const qLower = q.toLowerCase();

    setSearchError("");
    setGlobalError("");
    setLoadingSearch(true);

    try {
      // search gần đúng theo email/username
      const res = await api.Users.list(
        { search: q, page_size: 10 },
        { ttl: 0 }
      );
      const items = Array.isArray(res?.results)
        ? res.results
        : Array.isArray(res)
        ? res
        : [];

      // 1) chỉ lấy user thường (không is_staff, không is_superuser)
      let normalUsers = items.filter(
        (u) => !u.is_staff && !u.is_superuser
      );

      // 2) sort theo độ gần đúng (relevance)
      normalUsers = normalUsers.sort(
        (a, b) => computeRelevance(a, qLower) - computeRelevance(b, qLower)
      );

      // 3) tối đa 10 user
      const limited = normalUsers.slice(0, 10);

      setResults(limited);

      if (!limited.length) {
        setSearchError("Không tìm thấy người dùng thường nào phù hợp.");
      }
    } catch (e) {
      console.error("Search users failed:", e);
      setSearchError(e?.message || "Lỗi khi tìm kiếm người dùng.");
      setResults([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleAddFriend = async (user) => {
    if (!user?.id) return;
    if (me && me.id === user.id) {
      setGlobalError("Bạn không thể kết bạn với chính mình.");
      return;
    }

    // Nếu backend đã báo pending/accepted thì không gửi nữa
    const relation = friendMap[user.id];
    if (
      relation === "accepted" ||
      relation === "pending_sent" ||
      relation === "pending_received"
    ) {
      setGlobalError("Quan hệ bạn bè đã tồn tại hoặc đang chờ xác nhận.");
      return;
    }

    setGlobalError("");
    setSentStatus((prev) => ({ ...prev, [user.id]: undefined }));
    setSendingIds((prev) => [...prev, user.id]);

    try {
      const created = await api.Friends.create({ to_user: user.id });

      // Cập nhật local state: map userId -> trạng thái
      const relStatus = created.accepted ? "accepted" : "pending_sent";
      setFriendMap((prev) => ({
        ...prev,
        [user.id]: relStatus,
      }));

      setSentStatus((prev) => ({ ...prev, [user.id]: "pending" }));
    } catch (e) {
      console.error("Add friend failed:", e);
      const detail =
        e?.response?.data?.detail ||
        e?.message ||
        "Không thể gửi lời mời kết bạn.";
      setSentStatus((prev) => ({ ...prev, [user.id]: "error:" + detail }));
      setGlobalError(detail);
    } finally {
      setSendingIds((prev) => prev.filter((id) => id !== user.id));
    }
  };

  const isSending = (userId) => sendingIds.includes(userId);

  const handleAcceptInvite = async (fr) => {
    setAcceptingIds((prev) => [...prev, fr.id]);
    try {
      const updated = await api.Friends.accept(fr.id);

      const fromId =
        typeof updated.from_user === "object"
          ? updated.from_user?.id
          : updated.from_user;
      const toId =
        typeof updated.to_user === "object"
          ? updated.to_user?.id
          : updated.to_user;

      const myId = me?.id;
      const otherId = fromId === myId ? toId : fromId;

      if (otherId) {
        setFriendMap((prev) => ({
          ...prev,
          [otherId]: "accepted",
        }));
      }

      // bỏ khỏi danh sách lời mời
      setIncomingInvites((prev) => prev.filter((x) => x.id !== fr.id));
      setGlobalError("");
    } catch (e) {
      console.error("Accept friend failed:", e);
      const detail =
        e?.response?.data?.detail || e?.message || "Không thể chấp nhận lời mời.";
      setGlobalError(detail);
    } finally {
      setAcceptingIds((prev) => prev.filter((id) => id !== fr.id));
    }
  };

  const handleDeclineInvite = async (fr) => {
    setDecliningIds((prev) => [...prev, fr.id]);
    try {
      await api.Friends.cancel(fr.id);
      const fromId =
        typeof fr.from_user === "object" ? fr.from_user?.id : fr.from_user;

      // Xoá khỏi danh sách lời mời
      setIncomingInvites((prev) => prev.filter((x) => x.id !== fr.id));

      // Xoá relation trong friendMap nếu có
      if (fromId) {
        setFriendMap((prev) => {
          const clone = { ...prev };
          delete clone[fromId];
          return clone;
        });
      }

      setGlobalError("");
    } catch (e) {
      console.error("Decline friend failed:", e);
      const detail =
        e?.response?.data?.detail || e?.message || "Không thể từ chối lời mời.";
      setGlobalError(detail);
    } finally {
      setDecliningIds((prev) => prev.filter((id) => id !== fr.id));
    }
  };

  const renderUserItem = (u) => {
    const userId = u.id;

    const serverRelation = friendMap[userId]; // "accepted" | "pending_sent" | "pending_received" | undefined
    let status = sentStatus[userId];

    if (!status && serverRelation) {
      if (serverRelation === "accepted") status = "accepted";
      else status = "pending";
    }

    const you = me && me.id === userId;

    return (
      <div
        key={userId}
        className="mb-2 flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500 text-white font-semibold">
            {(u.username || u.email || "?")[0]?.toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">
                {u.username || "(no username)"}
              </span>
              {you && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                  Bạn
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500">{u.email || "—"}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status?.startsWith("error:") && (
            <TooltipBadge
              label="Lỗi"
              tooltip={status.slice("error:".length)}
              className="border border-red-300 bg-red-50 text-xs text-red-700"
            />
          )}

          {status === "accepted" && (
            <span className="rounded-full border border-green-300 bg-green-50 px-3 py-1 text-xs text-green-700">
              Đã là bạn
            </span>
          )}

          {status === "pending" && (
            <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs text-amber-700">
              Đang chờ xác nhận
            </span>
          )}

          {!you && status !== "pending" && status !== "accepted" && (
            <button
              type="button"
              className={`inline-flex items-center rounded-full bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-700 ${
                isSending(userId) ? "opacity-70 cursor-not-allowed" : ""
              }`}
              disabled={isSending(userId)}
              onClick={() => handleAddFriend(u)}
            >
              {isSending(userId) ? "Đang gửi..." : "Kết bạn"}
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderInviteItem = (fr) => {
    const from = fr.from_user || {};
    const name = from.username || from.email || "Người dùng";
    const email = from.email || "";
    const isAccepting = acceptingIds.includes(fr.id);
    const isDeclining = decliningIds.includes(fr.id);

    return (
      <div
        key={fr.id}
        className="mb-2 flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white font-semibold">
            {(name[0] || "?").toUpperCase()}
          </div>
          <div>
            <div className="font-semibold">{name}</div>
            <div className="text-sm text-gray-500">{email}</div>
            <div className="mt-0.5 text-xs text-gray-400">
              Đã gửi lời mời kết bạn cho bạn
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-70"
            onClick={() => handleDeclineInvite(fr)}
            disabled={isDeclining || isAccepting}
          >
            {isDeclining ? "Đang từ chối..." : "Từ chối"}
          </button>
          <button
            type="button"
            className="inline-flex items-center rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
            onClick={() => handleAcceptInvite(fr)}
            disabled={isAccepting || isDeclining}
          >
            {isAccepting ? "Đang chấp nhận..." : "Chấp nhận"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto mt-8 max-w-3xl px-4">
      {/* Header + icon hòm thư */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">
          Tìm bạn bè
        </h1>

        <button
          type="button"
          onClick={() => setShowInvites((s) => !s)}
          className={`relative inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm ${
            showInvites
              ? "border-sky-500 bg-sky-50 text-sky-700"
              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          <Mail className="mr-1.5 h-4 w-4" />
          Lời mời
          {incomingInvites.length > 0 && (
            <span className="ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-semibold text-white">
              {incomingInvites.length}
            </span>
          )}
        </button>
      </div>

      {/* Panel lời mời kết bạn */}
      {showInvites && (
        <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
          <p className="mb-2 text-sm font-semibold text-gray-700">
            Lời mời kết bạn
          </p>
          {incomingInvites.length === 0 && (
            <p className="text-sm text-gray-500">
              Hiện tại bạn không có lời mời kết bạn nào.
            </p>
          )}
          {incomingInvites.map(renderInviteItem)}
        </div>
      )}

      {/* Khung tìm kiếm */}
      <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <div className="relative flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
                />
              </svg>
            </span>
            <input
              type="text"
              className="w-full rounded-full border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none ring-sky-100 focus:border-sky-400 focus:ring-2"
              placeholder="Nhập email người bạn muốn kết bạn..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={loadingSearch}
          >
            {loadingSearch && (
              <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {loadingSearch ? "Đang tìm..." : "Tìm kiếm"}
          </button>
        </form>

        {searchError && (
          <p className="mt-2 text-sm text-red-600">{searchError}</p>
        )}

        {globalError && !searchError && (
          <p className="mt-2 text-sm text-red-600">{globalError}</p>
        )}
      </div>

      {/* Kết quả tìm kiếm */}
      {loadingSearch && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-500" />
          <span>Đang tìm kiếm...</span>
        </div>
      )}

      {!loadingSearch && results.length > 0 && (
        <div>
          {results.map(renderUserItem)}
        </div>
      )}

      {!loadingSearch && !results.length && !searchError && (
        <p className="text-sm text-gray-500">
          Nhập email và bấm &quot;Tìm kiếm&quot; để bắt đầu tìm bạn bè.
        </p>
      )}
    </div>
  );
}

// Badge đơn giản có tooltip (title) cho lỗi
function TooltipBadge({ label, tooltip, className = "" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs ${className}`}
      title={tooltip}
    >
      {label}
    </span>
  );
}
