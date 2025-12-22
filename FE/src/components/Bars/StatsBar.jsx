import React, { useEffect, useRef, useState, useMemo } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { Flame, Gem, Trophy, ChevronDown } from "lucide-react";
import LangFlag from "../LangFlag.jsx";
import { selectUserView } from "../../store/selectors.js";
import AdminDropdown from "../Dropdowns/AdminDropdown.jsx";

import {
  fetchEnrollments,
  clearEnrollments,
  setSelectedByAbbr,
  selectEnrollmentsState,
  selectEnrollments,
  selectSelectedEnrollment,
  selectSelectedAbbr,
} from "../../store/enrollmentsSlice";

const getAbbr = (e) => e?.language?.abbreviation || e?.language?.code || "";
const nf = new Intl.NumberFormat();

function StatsBar({ languageCode, className = "" }) {
  const dispatch = useDispatch();
  const user = useSelector(selectUserView);
  
  // Redux Selectors
  const { status, error, lastFetchedAt } = useSelector(selectEnrollmentsState);
  const enrollments = useSelector(selectEnrollments, shallowEqual);
  const selected = useSelector(selectSelectedEnrollment);
  const selectedAbbr = useSelector(selectSelectedAbbr);

  // Local UI State
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const loading = status === "loading";
  // 1. Tự động đóng menu khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 2. Fetch Enrollments (Data Sync)
  const didFetchRef = useRef(false);
  useEffect(() => {
    if (!user) {
      dispatch(clearEnrollments());
      return;
    }
    const fresh = lastFetchedAt && Date.now() - lastFetchedAt < 60_000;
    if ((status === "succeeded" && fresh) || didFetchRef.current) return;
    
    didFetchRef.current = true;
    dispatch(fetchEnrollments());
  }, [dispatch, user, status, lastFetchedAt]);

  // 3. Auto Select Language logic
  useEffect(() => {
    if (!enrollments?.length || selected) return;

    const prefFromProp = languageCode ? String(languageCode).split("-")[0] : null;
    const prefFromLS = typeof window !== "undefined" 
      ? (localStorage.getItem("learn") || "").split("-")[0] 
      : null;
    
    const targetAbbr = (prefFromProp || prefFromLS || "").toLowerCase();
    
    let found = null;
    if (targetAbbr) {
      found = enrollments.find((e) => getAbbr(e)?.toLowerCase() === targetAbbr);
    }
    
    // Fallback: lấy cái đầu tiên
    const finalAbbr = found ? getAbbr(found) : getAbbr(enrollments[0]);
    
    if (finalAbbr && finalAbbr.toLowerCase() !== selectedAbbr) {
      dispatch(setSelectedByAbbr(finalAbbr));
    }
  }, [dispatch, enrollments, selected, languageCode, selectedAbbr]);

  // Handlers
  const handlePick = (e) => {
    setMenuOpen(false);
    const abbr = getAbbr(e)?.toLowerCase();
    if (abbr && abbr !== selectedAbbr) {
      dispatch(setSelectedByAbbr(abbr));
    }
  };

  // Render Data
  const level = selected?.level ?? 0;
  const streak = selected?.streak_days ?? 0;
  const totalXP = selected?.total_xp ?? 0;
  const currentAbbr = getAbbr(selected);
  const lastPracticed = selected?.last_practiced || selected?.created_at || null;

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {/* LANGUAGE SELECTOR */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="
            flex items-center gap-2
            rounded-lg px-2 py-1
            hover:bg-gray-50 active:bg-gray-100
            transition select-none
          "
          title="Change language"
        >
          <LangFlag code={selected?.language?.code || currentAbbr} className="text-red-500" size={20} />
          <span className="font-bold text-gray-700">
            {loading ? "—" : (currentAbbr || "—").toUpperCase()}
          </span>
          <ChevronDown size={16} className={`text-gray-500 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
        </button>

        {/* DROPDOWN MENU */}
        {menuOpen && (
          <div className="absolute z-20 mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
            <div className="max-h-64 overflow-y-auto">
              {enrollments.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-500">No enrollments</div>
              )}
              {enrollments.map((e) => {
                const abbr = getAbbr(e);
                const name = e?.language?.name || abbr?.toUpperCase();
                const isActive = currentAbbr === abbr;
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => handlePick(e)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 text-left transition-colors
                      ${isActive ? "bg-indigo-50" : "hover:bg-gray-50"}
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

      {/* STATS */}
      <div className="flex items-center gap-4">
        {/* Streak */}
        <div className="flex items-center gap-1.5" title="Streak (days)">
          <Flame className="text-orange-500 fill-red-500" size={18} />
          <span className="font-bold text-gray-700 text-sm">
            {loading ? "—" : nf.format(streak)}
          </span>
        </div>

        {/* XP */}
        <div className="flex items-center gap-1.5" title="Total XP">
          <Gem className="text-blue-500 fill-blue-500" size={18} />
          <span className="font-bold text-gray-700 text-sm">
            {loading ? "—" : nf.format(totalXP)}
          </span>
        </div>
       
      </div>

      {/* USER DROPDOWN (Avatar) */}
      <AdminDropdown />

      {!loading && error && (
        <span className="ml-2 text-xs text-rose-600 font-bold" title={error}>!</span>
      )}
    </div>
  );
}

export default React.memo(StatsBar);