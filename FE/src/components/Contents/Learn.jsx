import React, { useMemo, useState } from 'react';
import { useRive } from '@rive-app/react-canvas';
import CampfireRive from '../../assets/rive/campfire.riv';
import TitleCard from '../Cards/TitleCard';

// PRNG
function mulberry32(a){return function(){let t=(a+=0x6D2B79F5);t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
// random river points
function genRiverPoints({count,seed,width=260,top=40,gap=130,margin=24,stepMax=42,pull=0.12}){
  const rng=mulberry32(seed);const cx=width/2;const left=margin;const right=width-margin;
  const pts=[];let x=cx+(rng()-0.5)*30;
  for(let i=0;i<count;i++){const y=top+i*gap;const step=(rng()*2-1)*stepMax;x+=step+(cx-x)*pull;x=Math.max(left,Math.min(right,x));pts.push({x,y});}
  return pts;
}
// smooth Catmull-Rom -> Cubic
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

export default function Learn() {
  const { RiveComponent } = useRive({ src: CampfireRive, autoplay: true, stateMachines: 'Main' });

  const NODE_SIZE = 94;
  const nodes = useMemo(() => [
    { type:'active', icon:'★' },
    { type:'locked', icon:'📖' },
    { type:'locked', icon:'⭐' },
    { type:'locked', icon:'🏋️' },
  ], []);

  const [seed, setSeed] = useState(() => Math.floor(Math.random()*1e9));
  const svgH  = 40 + (nodes.length - 1) * 130 + 220; // +220 để có khoảng dưới thoáng
  const pts   = useMemo(() => genRiverPoints({ count: nodes.length, seed }), [nodes.length, seed]);
  const riverD= useMemo(() => smoothPath(pts, 0.9), [pts]);

  return (
    // ✅ phủ toàn b
    // ộ main, không bị max-width chặn
    <div className="relative p-8 w-full max-w-[1100px] mx-auto min-h-[calc(100vh-0px)] ">
      {/* CTA: sticky theo main, luôn ở giữa & trên icon */}

        <TitleCard
          section="PHẦN 3, CỬA 1"
          title="Nói chuyện giữ gìn sức khỏe và vóc dáng"
          onBack={() => console.log('Back')}
          onHelp={() => console.log('Help')}
        />
        <button
          onClick={() => setSeed(Math.floor(Math.random()*1e9))}
          className="mt-2 grid h-14 w-14 place-items-center rounded-full bg-fuchsia-600 text-white shadow-[0_8px_0_0_rgba(0,0,0,.1)]
                     hover:translate-y-[1px] active:translate-y-[2px]"
        >
          ⏩
        </button>
      {/* </div> */}

      {/* 🌊 track 260px ở GIỮA vùng Main, cuộn theo main */}
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

        {/* các icon */}
        {pts.map((p, i) => {
          const n = nodes[i];
          const isActive = n.type === 'active';
          return (
            <div key={i} className="absolute z-10" style={{ left: p.x - NODE_SIZE/2, top: p.y - NODE_SIZE/2 }}>
              <div className={[
                'relative grid h-[94px] w-[94px] place-items-center rounded-full bg-white',
                isActive ? 'border-4 border-sky-500 shadow-[0_10px_0_0_#c7eaff]' :
                           'border-4 border-slate-300 text-slate-400 shadow-[0_10px_0_0_#e9eef5]',
              ].join(' ')}>
                {isActive ? (
                  <>
                    <div className="absolute -inset-1 rounded-full bg-[conic-gradient(theme(colors.sky.500)_270deg,theme(colors.sky.100)_0)] animate-[spin_3.2s_linear_infinite]" />
                    <div className="relative grid h-[82px] w-[82px] place-items-center rounded-full text-[34px] text-white shadow-sm bg-[radial-gradient(circle_at_50%_45%,#69d2ff_0_48%,#1cb0f6_49%_100%)]">{n.icon}</div>
                  </>
                ) : (
                  <span className="translate-y-[-2px] text-[34px]">{n.icon}</span>
                )}
              </div>
            </div>
          );
        })}

        {/* rương cuối */}
        {pts[pts.length-1] && (
          <div
            className="absolute z-10 h-[74px] w-[96px] rounded-2xl border-4 border-slate-300 bg-[linear-gradient(180deg,#d9dee6_0%,#f3f6f9_100%)] shadow-[0_6px_0_0_#e6ebf2]"
            style={{ left: pts[pts.length-1].x - 48, top: pts[pts.length-1].y + 90 }}
          >
            <div className="absolute left-1/2 top-1/2 h-6 w-11 -translate-x-1/2 -translate-y-1/2 rounded-md bg-[#bfc8d5] shadow-[inset_0_0_0_3px_#e8edf5] animate-blink" />
          </div>
        )}
      </div>

      {/* Rive bên phải (không ảnh hưởng tâm & cuộn) */}
      <div className="hidden md:block absolute right-4 top-28">
        <div className="h-[340px] w-[340px]">
          <RiveComponent />
        </div>
      </div>
    </div>
  );
}