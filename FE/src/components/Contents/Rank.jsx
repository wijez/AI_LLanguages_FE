import React, { useEffect, useRef, useState } from "react";
import { Trophy, Users, Loader2 } from "lucide-react";
import { api } from "../../api/api";

// ========================= Helpers =========================
const clsx = (...xs) => xs.filter(Boolean).join(" ");

function buildUrl({ friendsOnly = false, limit = 50 }) {
  const params = new URLSearchParams();
  params.set("scope", "all");
  params.set("limit", String(limit));
  if (friendsOnly) params.set("friends_only", "1");
  return `/leaderboard?${params.toString()}`; // giữ nguyên như bạn đang dùng
}

// Ưu tiên ENV: VITE_API_WS (vd: ws://localhost:8000/ws/leaderboard/)
function wsURL() {
  const fromEnv = import.meta?.env?.VITE_API_WS;
  if (fromEnv && fromEnv.startsWith("ws")) return fromEnv;
  const proto = location.protocol === "https:" ? "wss" : "ws";
  const host = import.meta?.env?.VITE_API_HOST || "localhost:8000";
  return `${proto}://${host}/ws/leaderboard/`;
}

// Chuẩn hoá mọi kiểu data về mảng
function toRows(d) {
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.results)) return d.results;
  if (d && Array.isArray(d.data)) return d.data;
  return [];
}

// ========================= UI Bits =========================
function SectionCard({ title, icon, right, children }) {
  const Icon = icon;
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200/70 dark:border-zinc-800 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5" />
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function Medal({ rank }) {
  const base = "inline-block w-6 h-6 rounded-full text-white text-xs grid place-items-center";
  if (rank === 1) return <span className={clsx(base, "bg-amber-500")}>1</span>;
  if (rank === 2) return <span className={clsx(base, "bg-zinc-400")}>2</span>;
  if (rank === 3) return <span className={clsx(base, "bg-orange-400")}>3</span>;
  return <span className={clsx(base, "bg-zinc-700")}>{rank}</span>;
}

function Avatar({ src, alt }) {
  return (
    <img
      src={src || "https://api.dicebear.com/8.x/thumbs/svg?seed=user"}
      alt={alt || "avatar"}
      className="w-9 h-9 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
    />
  );
}

function LeaderboardList({ items, emptyText = "Chưa có dữ liệu" }) {
  const list = Array.isArray(items) ? items : []; // chốt là mảng
  if (!list.length) return <p className="text-sm text-zinc-500">{emptyText}</p>;
  return (
    <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
      {list.map((row, idx) => (
        <li key={`${row?.user?.id ?? "u"}-${row?.rank ?? idx}`} className="py-3 flex items-center gap-3">
          <Medal rank={row.rank} />
          <Avatar src={row?.user?.avatar} alt={row?.user?.username} />
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{row?.user?.username || "User"}</div>
            {row?.period_label && <div className="text-xs text-zinc-500">{row.period_label}</div>}
          </div>
          <div className="text-right">
            <div className="font-semibold">{row?.xp?.toLocaleString?.() || row?.xp} XP</div>
          </div>
        </li>
      ))}
    </ul>
  );
}

// ========================= Main Page =========================
export default function Rank() {
  const [loadingGlobal, setLoadingGlobal] = useState(true);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [globalRows, setGlobalRows] = useState([]);
  const [friendRows, setFriendRows] = useState([]);

  const wsRef = useRef(null);
  const reconnectRef = useRef(0);
  const reconnectTimerRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const needRefetch = useRef({ global: false, friends: false });

  // ---- Fetchers (không đụng API schema, chỉ chuẩn hoá data để render)
const fetchGlobal = async () => {
    try {
      setLoadingGlobal(true);
      const r = await api.get(buildUrl({ friendsOnly: false, limit: 50 }));
      setGlobalRows(r || []); // ⬅️ SỬA Ở ĐÂY (biến r đã là data)
    } catch {
      setGlobalRows([]);
    } finally {
      setLoadingGlobal(false);
    }
  };

  const fetchFriends = async () => {
    try {
      setLoadingFriends(true);
      const r = await api.get(buildUrl({ friendsOnly: true, limit: 50 }));
      setFriendRows(r || []);
    } catch {
      setFriendRows([]);
    } finally {
      setLoadingFriends(false);
    }
  };

  // Debounce nhiều tín hiệu gần nhau -> gom 1 lần refetch
  const flushRefetch = () => {
    const { global, friends } = needRefetch.current;
    needRefetch.current = { global: false, friends: false };
    if (global) fetchGlobal();
    if (friends) fetchFriends();
  };

  const scheduleRefetch = (kind) => {
    needRefetch.current[kind] = true;
    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(flushRefetch, 200);
  };

  // ---- WebSocket connect + handlers
  const connectWS = () => {
    try {
      const ws = new WebSocket(wsURL());
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectRef.current = 0;
      };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === "lb_changed_all") scheduleRefetch("global");
          if (msg.type === "lb_changed_friends") scheduleRefetch("friends");
        } catch {}
      };

      ws.onerror = () => {
        try { ws.close(); } catch {}
      };

      ws.onclose = () => {
        const n = reconnectRef.current;
        const delay = Math.min(1000 * Math.pow(2, n), 15000);
        reconnectRef.current = n + 1;
        reconnectTimerRef.current = setTimeout(connectWS, delay);
      };
    } catch {
      reconnectTimerRef.current = setTimeout(connectWS, 2000);
    }
  };

  // Mount: fetch lần đầu + mở WS + fallback polling nhẹ (mỗi 60s)
  useEffect(() => {
    fetchGlobal();
    fetchFriends();
    connectWS();

    const poll = setInterval(() => {
      fetchGlobal();
      fetchFriends();
    }, 60000);

    return () => {
      try { wsRef.current && wsRef.current.close(); } catch {}
      clearTimeout(reconnectTimerRef.current);
      clearTimeout(debounceTimerRef.current);
      clearInterval(poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Bảng xếp hạng</h1>
          <p className="text-sm text-zinc-500">Tổng XP (không phân tách theo ngôn ngữ) · realtime WS</p>
        </div>
      </div>

      {/* Debug ngắn để chắc chắn FE đang nhận dữ liệu */}
      {import.meta?.env?.DEV && (
        <pre className="text-xs text-zinc-400">
          globalRows: {globalRows?.length ?? 0} | friendRows: {friendRows?.length ?? 0}
        </pre>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard
          title="Tất cả người dùng (All-time)"
          icon={Trophy}
          right={
            loadingGlobal ? (
              <span className="inline-flex items-center gap-2 text-sm text-zinc-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang tải…
              </span>
            ) : null
          }
        >
          <LeaderboardList items={globalRows} emptyText="Chưa có dữ liệu top người dùng." />
        </SectionCard>

        <SectionCard
          title="Bạn bè (All-time)"
          icon={Users}
          right={
            loadingFriends ? (
              <span className="inline-flex items-center gap-2 text-sm text-zinc-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang tải…
              </span>
            ) : null
          }
        >
          <LeaderboardList items={friendRows} emptyText="Chưa có dữ liệu bạn bè (cần có bạn đã accepted)." />
        </SectionCard>
      </div>
    </div>
  );
}
