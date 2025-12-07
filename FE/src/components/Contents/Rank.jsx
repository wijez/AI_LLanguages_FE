import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { Trophy, Users, Loader2 } from "lucide-react";
import { api } from "../../api/api";

const clsx = (...xs) => xs.filter(Boolean).join(" ");

function buildUrl({ friendsOnly = false, limit = 50 }) {
  const params = new URLSearchParams();
  params.set("scope", "all");
  params.set("limit", String(limit));
  if (friendsOnly) params.set("friends_only", "1");
  return `/leaderboard?${params.toString()}`;
}

function wsURL() {
  const fromEnv = import.meta?.env?.VITE_API_WS;
  if (fromEnv && fromEnv.startsWith("ws")) return fromEnv;

  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  const host = import.meta?.env?.VITE_API_HOST;

  return `${proto}://${host}/ws/leaderboard/`;
}

function Medal({ rank }) {
  const base =
    "inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold shadow-md";
  if (rank === 1) return <span className={clsx(base, "bg-gradient-to-br from-yellow-400 to-amber-500")}>1</span>;
  if (rank === 2) return <span className={clsx(base, "bg-gradient-to-br from-gray-300 to-gray-400")}>2</span>;
  if (rank === 3) return <span className={clsx(base, "bg-gradient-to-br from-orange-400 to-orange-500")}>3</span>;
  return <span className={clsx(base, "bg-gradient-to-br from-zinc-600 to-zinc-700")}>{rank}</span>;
}

function Avatar({ src, alt }) {
  return (
    <img
      src={src || "https://api.dicebear.com/8.x/thumbs/svg?seed=user"}
      alt={alt || "avatar"}
      className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
    />
  );
}

function LeaderboardList({ items, emptyText = "Chưa có dữ liệu" }) {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
          <Trophy className="w-8 h-8 text-zinc-400" />
        </div>
        <p className="text-sm text-zinc-500">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {list.map((row, idx) => (
        <div
          key={`${row?.user?.id ?? "u"}-${row?.rank ?? idx}`}
          className={clsx(
            "flex items-center gap-4 p-4 rounded-xl transition-all duration-200",
            "hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
            "border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700",
            row.rank <= 3 && "bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-900/10"
          )}
        >
          <Medal rank={row.rank} />
          <Avatar src={row?.user?.avatar} alt={row?.user?.username} />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-zinc-900 dark:text-white truncate">
              {row?.user?.username || "User"}
            </div>
            {row?.period_label && (
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {row.period_label}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-zinc-900 dark:text-white">
              {row?.xp?.toLocaleString?.() || row?.xp}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">XP</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ========================= Main Page =========================
export default function Rank() {
  const [loadingGlobal, setLoadingGlobal] = useState(true);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [globalRows, setGlobalRows] = useState([]);
  const [friendRows, setFriendRows] = useState([]);
  const [activeTab, setActiveTab] = useState("global");

  const wsRef = useRef(null);
  const reconnectRef = useRef(0);
  const reconnectTimerRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const needRefetch = useRef({ global: false, friends: false });
  const didInitRef = useRef(false);

  // ---- Fetchers
  const fetchGlobal = useCallback(async () => {
    try {
      setLoadingGlobal(true);
      const r = await api.get(buildUrl({ friendsOnly: false, limit: 50 }));
      setGlobalRows(r || []);
    } catch {
      setGlobalRows([]);
    } finally {
      setLoadingGlobal(false);
    }
  }, []);

  const fetchFriends = useCallback(async () => {
    try {
      setLoadingFriends(true);
      const r = await api.get(buildUrl({ friendsOnly: true, limit: 50 }));
      setFriendRows(r || []);
    } catch {
      setFriendRows([]);
    } finally {
      setLoadingFriends(false);
    }
  }, []);

  const flushRefetch = useCallback(() => {
    const { global, friends } = needRefetch.current;
    needRefetch.current = { global: false, friends: false };
    if (global) fetchGlobal();
    if (friends) fetchFriends();
  }, [fetchGlobal, fetchFriends]);

  const scheduleRefetch = useCallback(
    (kind) => {
      needRefetch.current[kind] = true;
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(flushRefetch, 200);
    },
    [flushRefetch]
  );

  // ---- WebSocket
  const connectWS = useCallback(() => {
    try {
      const ws = new WebSocket(wsURL());
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[WS] open", ws.url);
        reconnectRef.current = 0;
      };

      ws.onmessage = (e) => {
        console.log("[WS] msg", e.data);
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === "lb_changed_all") scheduleRefetch("global");
          if (msg.type === "lb_changed_friends") scheduleRefetch("friends");
        } catch {}
      };

      ws.onerror = (err) => {
        console.warn("[WS] error", err);
        try {
          ws.close();
        } catch {}
      };

      ws.onclose = (e) => {
        console.log("[WS] close", e.code, e.reason);
        const n = reconnectRef.current;
        const delay = Math.min(1000 * Math.pow(2, n), 15000);
        reconnectRef.current = n + 1;
        reconnectTimerRef.current = setTimeout(connectWS, delay);
      };
    } catch {
      reconnectTimerRef.current = setTimeout(connectWS, 2000);
    }
  }, [scheduleRefetch]);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    fetchGlobal();
    fetchFriends();
    connectWS();

    const poll = setInterval(() => {
      fetchGlobal();
      fetchFriends();
    }, 60000);

    return () => {
      try {
        wsRef.current && wsRef.current.close();
      } catch {}
      clearTimeout(reconnectTimerRef.current);
      clearTimeout(debounceTimerRef.current);
      clearInterval(poll);
    };
  }, [fetchGlobal, fetchFriends, connectWS]);

  const isGlobal = activeTab === "global";
  const loading = isGlobal ? loadingGlobal : loadingFriends;
  const items = isGlobal ? globalRows : friendRows;
  const emptyText = isGlobal
    ? "Chưa có dữ liệu top người dùng."
    : "Chưa có dữ liệu bạn bè (cần có bạn đã accepted).";

  return (
    <div className="w-full">
      <div className="overflow-hidden bg-white shadow-xl flex flex-col min-h-[30px] md:min-h-[calc(100vh)]">
          
          {/* Header Section with Gradient */}
          <div className="relative bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500">
            <div className="h-36 bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-3 text-white">
                <Trophy className="w-8 h-8" />
                <h1 className="text-3xl font-bold tracking-tight">Bảng xếp hạng</h1>
              </div>
            </div>
          </div>

          {/* Tab Switch - Centered */}
          <div className="flex justify-center -mt-6 relative z-20 px-6">
            <div className="inline-flex items-center rounded-full bg-white dark:bg-zinc-800 p-1.5 shadow-lg border border-zinc-200 dark:border-zinc-700 ring-4 ring-white dark:ring-zinc-900">
              <button
                type="button"
                onClick={() => setActiveTab("global")}
                className={clsx(
                  "px-6 py-2.5 text-sm font-semibold rounded-full transition-all duration-200 flex items-center gap-2",
                  isGlobal
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                )}
              >
                <Trophy className="w-4 h-4" />
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("friends")}
                className={clsx(
                  "px-6 py-2.5 text-sm font-semibold rounded-full transition-all duration-200 flex items-center gap-2",
                  !isGlobal
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                )}
              >
                <Users className="w-4 h-4" />
                Bạn bè
              </button>
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 px-6 pt-8 pb-6 flex flex-col overflow-hidden">
            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center gap-2 py-8 text-zinc-500">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium">Đang tải dữ liệu...</span>
              </div>
            )}

            {/* Leaderboard List */}
            {!loading && (
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <LeaderboardList items={items} emptyText={emptyText} />
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="px-6 pb-6">
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <span>
                {isGlobal ? "Tất cả người dùng" : "Bạn bè của bạn"} • All-time
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Live updates
              </span>
            </div>
          </div>
        </div>
      </div>
  );
}