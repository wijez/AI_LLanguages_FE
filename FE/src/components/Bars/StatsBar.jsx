import React from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { Flame, Gem, Trophy, ChevronDown } from "lucide-react";
import LangFlag from "../LangFlag.jsx";

import {
  fetchEnrollments,
  clearEnrollments,
  setSelectedByAbbr,
  selectEnrollmentsState,
  selectEnrollments,
  selectSelectedEnrollment,
  selectSelectedAbbr,
} from "../../store/enrollmentsSlice";

const DEBUG =
  (import.meta.env && import.meta.env.DEV) ||
  (import.meta.env && import.meta.env.VITE_DEBUG_API === "1") ||
  (typeof window !== "undefined" && localStorage.getItem("debug_api") === "1");

const getAbbr = (e) => e?.language?.abbreviation || e?.language?.code || "";

function StatsBar({ languageCode, className = "" }) {
  const dispatch = useDispatch();
  // const renderRef = React.useRef(0);
  // console.count(`[StatsBar] render #${++renderRef.current}`);
  // Redux state
  const { status, error, lastFetchedAt } = useSelector(selectEnrollmentsState);
  const enrollments = useSelector(selectEnrollments, shallowEqual);
  const selected = useSelector(selectSelectedEnrollment);
  const selectedAbbr = useSelector(selectSelectedAbbr);

  // Local UI state
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef(null);
  const nf = React.useMemo(() => new Intl.NumberFormat(), []);

  const loading = status === "loading";
  const err = status === "failed" ? error : "";

  // Helpers
  const sinceLabel = (iso) => {
    if (!iso) return "";
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (d <= 0) return "Practiced today";
    if (d === 1) return "Practiced yesterday";
    return `Practiced ${d} days ago`;
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function onDocClick(ev) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(ev.target)) setMenuOpen(false);
    }
    function onEsc(ev) { if (ev.key === "Escape") setMenuOpen(false); }
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  // Fetch enrollments (nếu có token); TTL + chống double-dispatch trong StrictMode
  const didFetchRef = React.useRef(false);
  React.useEffect(() => {
    const access = typeof window !== "undefined" ? localStorage.getItem("access") : null;
    if (!access) {
      dispatch(clearEnrollments());
      if (DEBUG) console.info("[StatsBar] No access token → clear enrollments");
      return;
    }
    const fresh = lastFetchedAt && (Date.now() - lastFetchedAt < 60_000); // TTL 60s
    if ((status === "succeeded" && fresh) || didFetchRef.current) return;
    didFetchRef.current = true;
    dispatch(fetchEnrollments());
  }, [dispatch, status, lastFetchedAt]);

  // Chọn enrollment ban đầu dựa trên prop languageCode hoặc localStorage
  React.useEffect(() => {
    if (!enrollments || enrollments.length === 0) return;
    if (selected) return;

    const prefFromProp = languageCode && String(languageCode).split("-")[0];
    const prefFromLS =
      typeof window !== "undefined"
        ? (localStorage.getItem("learn") || "").split("-")[0] || null
        : null;
    const pref = (prefFromProp || prefFromLS || "").toLowerCase();

    if (pref) {
      const found = enrollments.find((e) => getAbbr(e)?.toLowerCase() === pref);
      if (found) {
        if (pref !== selectedAbbr) dispatch(setSelectedByAbbr(pref));
        return;
      }
    }
    const fallback = getAbbr(enrollments[0])?.toLowerCase() || null;
    if (fallback && fallback !== selectedAbbr) dispatch(setSelectedByAbbr(fallback));
  }, [dispatch, enrollments, selected, languageCode, selectedAbbr]);

  // Đồng bộ nếu nơi khác phát learn:changed
  React.useEffect(() => {
    function onChanged(ev) {
      const abbr = ev?.detail?.abbr?.toLowerCase();
      if (abbr && abbr !== selectedAbbr) dispatch(setSelectedByAbbr(abbr));
    }
    window.addEventListener("learn:changed", onChanged);
    return () => window.removeEventListener("learn:changed", onChanged);
  }, [dispatch, selectedAbbr]);

  // Khi user chọn từ dropdown
  const handlePick = (e) => {
    setMenuOpen(false);
    const abbr = getAbbr(e)?.toLowerCase();
    if (abbr && abbr !== selectedAbbr) dispatch(setSelectedByAbbr(abbr));
    if (DEBUG) console.info("[StatsBar] pick language:", abbr, e?.language?.name);
  };

  const level         = selected?.level ?? 0;
  const streak        = selected?.streak_days ?? 0;
  const totalXP       = selected?.total_xp ?? 0;
  const lastPracticed = selected?.last_practiced || selected?.created_at || null;

  if (DEBUG) {
    console.groupCollapsed("%c[StatsBar] Render", "color:#10b981;font-weight:700");
    console.log("status:", status, "| error:", err);
    console.log("selected abbr:", getAbbr(selected), "| level:", level, "| streak:", streak, "| xp:", totalXP);
    console.groupEnd();
  }

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {/* Flag + Dropdown */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="
            flex items-center gap-2
            rounded-lg px-2 py-1
            hover:bg-gray-50 active:bg-gray-100
            transition
          "
          title="Change language"
        >
          <LangFlag code={selected?.language?.code || getAbbr(selected)} className="text-red-500" size={20} />
          <span className="font-bold text-gray-700">
            {loading ? "—" : (getAbbr(selected) || "—").toUpperCase()}
          </span>
          <ChevronDown size={16} className="text-gray-500" />
        </button>

        {/* MENU */}
        {menuOpen && (
          <div
            className="
              absolute z-20 mt-2 w-56
              rounded-xl border border-gray-200 bg-white shadow-lg
              overflow-hidden
            "
          >
            <div className="max-h-64 overflow-y-auto">
              {enrollments.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-500">No enrollments</div>
              )}
              {enrollments.map((e) => {
                const abbr = getAbbr(e);
                const name = e?.language?.name || abbr?.toUpperCase();
                const isActive = getAbbr(selected) === abbr;
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => handlePick(e)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 text-left
                      ${isActive ? "bg-sky-50" : "hover:bg-gray-50"}
                    `}
                  >
                    <div className="w-6 h-6 grid place-items-center rounded-md bg-gray-50 border border-gray-100">
                      <LangFlag code={abbr} size={18} />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-700">{name}</div>
                      <div className="text-xs text-gray-500">
                        LV {e.level ?? 0} • XP {nf.format(e.total_xp ?? 0)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Streak */}
      <div className="flex items-center gap-2" title="Streak (days)">
        <Flame className="text-orange-500" size={20} />
        <span className="font-bold text-gray-700">{loading ? "—" : nf.format(streak)}</span>
      </div>

      {/* XP */}
      <div className="flex items-center gap-2" title="Total XP">
        <Gem className="text-blue-500" size={20} />
        <span className="font-bold text-gray-700">{loading ? "—" : nf.format(totalXP)}</span>
      </div>

      {/* Trophy */}
      <div title={loading ? "" : sinceLabel(lastPracticed)}>
        <Trophy className="text-purple-500" size={24} />
      </div>

      {!loading && err && <span className="ml-2 text-xs text-rose-600" title={err}>!</span>}
    </div>
  );
}

export default React.memo(StatsBar);
