import React, { useMemo, useState, useEffect } from 'react';
import { api } from '../../api/api';
import TitleCard from '../Cards/TitleCard';
import LessonCard from '../Cards/LessonCard';

// PRNG + river helpers
function mulberry32(a){return function(){let t=(a+=0x6D2B79F5);t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
function genRiverPoints({count,seed,width=260,top=40,gap=130,margin=24,stepMax=42,pull=0.12}){
  const rng=mulberry32(seed);const cx=width/2;const left=margin;const right=width-margin;
  const pts=[];let x=cx+(rng()-0.5)*30;
  for(let i=0;i<count;i++){const y=top+i*gap;const step=(rng()*2-1)*stepMax;x+=step+(cx-x)*pull;x=Math.max(left,Math.min(right,x));pts.push({x,y});}
  return pts;
}
function smoothPath(points,tension=1){
  if(!points.length) return ''; if(points.length===1) return `M ${points[0].x},${points[0].y}`;
  let d=`M ${points[0].x},${points[0].y}`;
  for(let i=0;i<points.length-1;i++){
    const p0=points[i-1]||points[i], p1=points[i], p2=points[i+1], p3=points[i+2]||p2;
    const c1x=p1.x+((p2.x-p0.x)/6)*tension, c1y=p1.y+((p2.y-p0.y)/6)*tension;
    const c2x=p2.x-((p3.x-p1.x)/6)*tension, c2y=p2.y-((p3.y-p1.y)/6)*tension;
    d+=` C ${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
  } return d;
}

const DEBUG = import.meta.env.DEV || localStorage.getItem('debug_api') === '1';

export default function Learn() {
  // State
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [current, setCurrent] = useState(0);

  // abbr hiện tại (StatsBar sẽ set localStorage('learn') = abbr)
  const [abbr, setAbbr] = useState(() => {
    const a = (localStorage.getItem('learn') || '').split('-')[0].toLowerCase();
    return a || '';
  });

  // bắt thay đổi abbr từ StatsBar (storage / visibilitychange / custom event)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'learn') {
        const v = (e.newValue || '').split('-')[0].toLowerCase();
        if (v && v !== abbr) setAbbr(v);
      }
    };
    const onVisible = () => {
      const v = (localStorage.getItem('learn') || '').split('-')[0].toLowerCase();
      if (v && v !== abbr) setAbbr(v);
    };
    const onCustom = (e) => {
      const v = (e?.detail?.abbr || '').split('-')[0].toLowerCase();
      if (v && v !== abbr) setAbbr(v);
    };
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('learn:changed', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('learn:changed', onCustom);
    };
  }, [abbr]);

  // Load topics theo /topics/by-language/?language_abbr=<abbr>
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr('');

      try {
        // guard: chưa đăng nhập thì thôi (tránh 401 → redirect)
        const access = localStorage.getItem('access');
        if (!access) {
          setTopics([]);
          setLoading(false);
          if (DEBUG) console.info('[Learn] no access token → skip fetch');
          return;
        }

        // nếu chưa có abbr, thử lấy từ enrollments/me (bản đầu tiên) để tự set
        let effectiveAbbr = abbr;
        if (!effectiveAbbr) {
          const me = await api.Enrollments.me();
          const items = Array.isArray(me) ? me : (me?.results || []);
          const first = items[0];
          if (first) {
            effectiveAbbr = (first?.language?.abbreviation || first?.language?.code || '').toLowerCase();
            if (effectiveAbbr) {
              localStorage.setItem('learn', effectiveAbbr);
              setAbbr(effectiveAbbr);
            }
          }
        }

        if (!effectiveAbbr) {
          setTopics([]);
          setLoading(false);
          if (DEBUG) console.warn('[Learn] no abbr to load topics');
          return;
        }

        const params = { language_abbr: effectiveAbbr, page_size: 200 };
        DEBUG && console.groupCollapsed('%c[Learn] GET /api/topics/by-language/', 'color:#22c55e;font-weight:700');
        DEBUG && console.log('Params:', params);

        const res = await api.Topics.byLanguage(params, { signal: controller.signal });
        const raw = Array.isArray(res?.results) ? res.results : (Array.isArray(res) ? res : []);
        // BE đã order_by("order","id"), nhưng ta vẫn sort ổn định dự phòng
        const items = [...(raw || [])].sort((a,b) => (a.order - b.order) || (a.id - b.id));

        if (!cancelled) {
          setTopics(items);
          setCurrent(0);
        }

        if (DEBUG) {
          const count = items.length;
          console.log('abbr:', effectiveAbbr, '| Count:', count);
          if (count) {
            console.table(items.map(({ id, order, title, language }) => ({
              id, order, abbr: language?.abbreviation || language?.code, title
            })));
          }
          console.groupEnd();
        }
      } catch (e) {
        if (!cancelled) setErr(e?.message || 'Failed to load topics');
        if (DEBUG) {
          console.group('%c[Learn] /topics/by-language ERROR', 'color:#ef4444;font-weight:700');
          console.error(e);
          const resp = e?.response;
          if (resp) {
            console.log('Status:', resp.status);
            console.log('Data  :', resp.data);
            console.log('Headers:', resp.headers);
          } else if (e?.request) {
            console.log('Request (no response):', e.request);
          }
          console.groupEnd();
        }
      } finally {
        !cancelled && setLoading(false);
      }
    })();

    return () => { cancelled = true; controller.abort(); };
  }, [abbr]);

  // River + nodes
  const [seed, setSeed] = useState(() => Math.floor(Math.random()*1e9));
  const count = Math.max(topics.length, 1);
  const svgH  = 40 + (count - 1) * 130 + 220;
  const pts   = useMemo(() => genRiverPoints({ count, seed }), [count, seed]);
  const riverD= useMemo(() => smoothPath(pts, 0.9), [pts]);
  const selectedTopic = topics[current] || null;

  // debug current
  useEffect(() => {
    if (!DEBUG || !selectedTopic) return;
    console.log('[Learn] Current topic:', {
      idx: current, id: selectedTopic.id, order: selectedTopic.order,
      title: selectedTopic.title, lang: selectedTopic.language
    });
  }, [current, selectedTopic]);

  return (
    <div className="relative p-8 w-full max-w-[1100px] mx-auto min-h-[calc(100vh-0px)]">
      <TitleCard
        topic={selectedTopic}
        sectionPrefix="PHẦN 3"
        floating
        offset="top-2 md:top-3"
        center
        onBack={() => console.log('Back')}
        onHelp={() => console.log('Help')}
        cta={
          <button
            onClick={() => setSeed(Math.floor(Math.random()*1e9))}
            className="grid h-14 w-14 place-items-center rounded-full bg-fuchsia-600 text-white shadow-[0_8px_0_0_rgba(0,0,0,.1)]
                       hover:translate-y-[1px] active:translate-y-[2px]"
            aria-label="Học vượt (xáo vị trí đường)"
          >
            ⏩
          </button>
        }
      />

      {loading && <div className="mt-4 text-slate-500 text-sm">Đang tải bài học…</div>}
      {err && (
        <div className="mt-4 text-sm rounded-lg border border-rose-200 bg-rose-50 text-rose-600 p-3">
          Lỗi: {err}
        </div>
      )}

      {/* River + nodes */}
      <div className="relative mx-auto mt-4 w-[260px] pb-24">
        <svg className="block w-full" style={{ height: svgH }} viewBox={`0 0 260 ${svgH}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="river" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#cfe9ff" />
              <stop offset="100%" stopColor="#eaf6ff" />
            </linearGradient>
          </defs>
          <path d={riverD} fill="none" stroke="url(#river)" strokeWidth="12" strokeLinecap="round" />
        </svg>

        <LessonCard topicId={selectedTopic?.id} />
      </div>
    </div>
  );
}
