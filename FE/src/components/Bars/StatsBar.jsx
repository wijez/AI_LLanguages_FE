import React from 'react';
import { Flag, Flame, Gem, Trophy, ChevronDown } from 'lucide-react';
import { api } from '../../api/api';
import LangFlag from '../LangFlag.jsx';

const DEBUG =
  (import.meta.env && import.meta.env.DEV) ||
  (import.meta.env && import.meta.env.VITE_DEBUG_API === '1') ||
  (typeof window !== 'undefined' && localStorage.getItem('debug_api') === '1');

export default function StatsBar({ languageCode, className = '' }) {
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState('');
  const [enrollments, setEnrollments] = React.useState([]);
  const [selected, setSelected] = React.useState(null);      // enrollment đang chọn
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef(null);
  const nf = React.useMemo(() => new Intl.NumberFormat(), []);

  // Helpers
  const getAbbr = (e) => e?.language?.abbreviation || e?.language?.code || '';
  const sinceLabel = (iso) => {
    if (!iso) return '';
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (d <= 0) return 'Practiced today';
    if (d === 1) return 'Practiced yesterday';
    return `Practiced ${d} days ago`;
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function onDocClick(ev) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(ev.target)) setMenuOpen(false);
    }
    function onEsc(ev) { if (ev.key === 'Escape') setMenuOpen(false); }
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  // Load /enrollments/me/ and choose initial selection
  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setErr('');

        const access = typeof window !== 'undefined' ? localStorage.getItem('access') : null;
        if (!access) {
          if (!cancelled) {
            setEnrollments([]);
            setSelected(null);
            setLoading(false);
          }
          if (DEBUG) console.info('[StatsBar] No access token → skip fetch');
          return;
        }

        if (DEBUG) console.groupCollapsed('%c[StatsBar] GET /enrollments/me/', 'color:#3b82f6;font-weight:700');
        const t0 = performance.now();
        const list = await api.Enrollments.me(); // ✅ dùng /enrollments/me/
        const t1 = performance.now();

        const items = Array.isArray(list) ? list : (list?.results || []);
        if (DEBUG) {
          console.log('items:', items);
          console.log(`took: ${(t1 - t0).toFixed(1)} ms`);
          console.groupEnd();
        }

        if (cancelled) return;

        setEnrollments(items);

        // pick initial selection
        const prefFromProp = languageCode && String(languageCode).split('-')[0];
        const prefFromLS = typeof window !== 'undefined'
          ? (localStorage.getItem('learn') || '').split('-')[0] || null
          : null;
        const pref = (prefFromProp || prefFromLS || '').toLowerCase();

        let chosen = items[0] || null;
        if (pref) {
          const byAbbr = items.find(
            (e) => getAbbr(e)?.toLowerCase() === pref
          );
          if (byAbbr) chosen = byAbbr;
        }

        setSelected(chosen);
      } catch (e) {
        const msg = e?.response?.data?.detail || e?.message || 'Failed to load enrollments';
        if (!cancelled) {
          setErr(msg);
          setEnrollments([]);
          setSelected(null);
        }
        if (DEBUG) {
          console.group('%c[StatsBar ERROR]', 'color:#ef4444;font-weight:700');
          console.error(e);
          console.log('Message:', msg);
          console.groupEnd();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [languageCode]);

  // When user picks another language from dropdown
  const handlePick = (e) => {
    setSelected(e);
    setMenuOpen(false);
    const abbr = getAbbr(e);
    if (abbr && typeof window !== 'undefined') {
      localStorage.setItem('learn', abbr);
    }
    if (DEBUG) console.info('[StatsBar] pick language:', abbr, e?.language?.name);
  };

  const level         = selected?.level ?? 0;
  const streak        = selected?.streak_days ?? 0;
  const totalXP       = selected?.total_xp ?? 0;
  const lastPracticed = selected?.last_practiced || selected?.created_at || null;

  if (DEBUG) {
    console.groupCollapsed('%c[StatsBar] Render', 'color:#10b981;font-weight:700');
    console.log('loading:', loading, '| error:', err);
    console.log('selected abbr:', getAbbr(selected), '| level:', level, '| streak:', streak, '| xp:', totalXP);
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
          <LangFlag code={selected?.language?.code} className="text-red-500" size={20} />
          <span className="font-bold text-gray-700">
            {loading
              ? '—'
              : (selected?.language?.abbreviation || selected?.language?.code || '—').toUpperCase()}
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
                      ${isActive ? 'bg-sky-50' : 'hover:bg-gray-50'}
                    `}
                  >
                    {/* Flag icon nếu có component sẵn */}
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
        <span className="font-bold text-gray-700">{loading ? '—' : nf.format(streak)}</span>
      </div>

      {/* XP */}
      <div className="flex items-center gap-2" title="Total XP">
        <Gem className="text-blue-500" size={20} />
        <span className="font-bold text-gray-700">{loading ? '—' : nf.format(totalXP)}</span>
      </div>

      {/* Trophy */}
      <div title={loading ? '' : sinceLabel(lastPracticed)}>
        <Trophy className="text-purple-500" size={24} />
      </div>

      {!loading && err && <span className="ml-2 text-xs text-rose-600" title={err}>!</span>}
    </div>
  );
}
