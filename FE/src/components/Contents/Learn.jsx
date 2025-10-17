import React, { useMemo, useState, useEffect } from 'react';
import { api } from '../../api/api';
import TitleCard from '../Cards/TitleCard';

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
  // 1) Lấy danh sách topics
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [current, setCurrent] = useState(0); // index đang chọn

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    (async () => {
      setLoading(true); setErr('');
      const params = { page_size: 200 }; // có thể thêm language, ordering...
      const t0 = performance.now();
      try {
        DEBUG && console.groupCollapsed('%c[Learn] GET /api/topics/', 'color:#22c55e;font-weight:700');
        DEBUG && console.log('Params:', params);

        const res = await api.Topics.list(params, { signal: controller.signal });
        const raw = Array.isArray(res?.results) ? res.results : (Array.isArray(res) ? res : []);
        // sort ổn định
        const items = [...(raw || [])].sort((a,b) => (a.order - b.order) || (a.id - b.id));

        if (!cancelled) setTopics(items);

        if (DEBUG) {
          const t1 = performance.now();
          console.log('Count:', items.length, '| Duration:', Math.round(t1 - t0) + 'ms');
          console.table(items.map(({ id, order, title, language }) => ({ id, order, language, title })));
          console.groupEnd();
        }
      } catch (e) {
        if (!cancelled) setErr(e?.message || 'Failed to load topics');
        if (DEBUG) {
          console.group('%c[Learn] /api/topics ERROR', 'color:#ef4444;font-weight:700');
          console.error(e);
          // axios-like error detail
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
  }, []);

  // 2) River path + nodes
  const [seed, setSeed] = useState(() => Math.floor(Math.random()*1e9));
  const count = Math.max(topics.length, 1);
  const svgH  = 40 + (count - 1) * 130 + 220;
  const pts   = useMemo(() => genRiverPoints({ count, seed }), [count, seed]);
  const riverD= useMemo(() => smoothPath(pts, 0.9), [pts]);
  const selectedTopic = topics[current] || null;

  // debug current
  useEffect(() => {
    if (!DEBUG) return;
    if (!selectedTopic) return;
    console.log('[Learn] Current topic:', { idx: current, id: selectedTopic.id, order: selectedTopic.order, title: selectedTopic.title });
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

      {/* River + nodes ở giữa */}
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

        {pts.map((p, i) => {
          const isActive = i === current;
          const icon = isActive ? '★' : (topics[i]?.golden ? '🏆' : '📖');
          return (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="absolute z-10"
              style={{ left: p.x - 47, top: p.y - 47 }} // 94/2
              title={`${topics[i]?.title || 'Bài học'} (CỬA ${topics[i]?.order ?? '?'})`}
            >
              <div className={[
                'relative grid h-[94px] w-[94px] place-items-center rounded-full bg-white',
                isActive ? 'border-4 border-sky-500 shadow-[0_10px_0_0_#c7eaff]' :
                           'border-4 border-slate-300 text-slate-400 shadow-[0_10px_0_0_#e9eef5]',
              ].join(' ')}>
                {isActive ? (
                  <>
                    <div className="absolute -inset-1 rounded-full bg-[conic-gradient(theme(colors.sky.500)_270deg,theme(colors.sky.100)_0)] animate-[spin_3.2s_linear_infinite]" />
                    <div className="relative grid h-[82px] w-[82px] place-items-center rounded-full text-[30px] text-white shadow-sm bg-[radial-gradient(circle_at_50%_45%,#69d2ff_0_48%,#1cb0f6_49%_100%)]">{icon}</div>
                  </>
                ) : (
                  <span className="translate-y-[-2px] text-[30px]">{icon}</span>
                )}
              </div>
            </button>
          );
        })}

        {/* rương cuối */}
        {pts[count-1] && (
          <div
            className="absolute z-10 h-[74px] w-[96px] rounded-2xl border-4 border-slate-300 bg-[linear-gradient(180deg,#d9dee6_0%,#f3f6f9_100%)] shadow-[0_6px_0_0_#e6ebf2]"
            style={{ left: pts[count-1].x - 48, top: pts[count-1].y + 90 }}
          >
            <div className="absolute left-1/2 top-1/2 h-6 w-11 -translate-x-1/2 -translate-y-1/2 rounded-md bg-[#bfc8d5] shadow-[inset_0_0_0_3px_#e8edf5] animate-blink" />
          </div>
        )}
      </div>
    </div>
  );
}
