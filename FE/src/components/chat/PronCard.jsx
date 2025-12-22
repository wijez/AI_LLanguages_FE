import React from "react";
import { Tag } from "../../components/chat/Tag";
import { toFixed1 } from "../../components/chat/utils";

export function PronCard({ pron }) {
  if (!pron) return null;

  const { recognized, score_overall, words = [], details = {} } = pron;
  const mis = words.filter((w) => (w.status || "").toLowerCase().includes("mis"));
  const missed = words.filter((w) => (w.status || "").toLowerCase().includes("missed"));
  const ok = words.filter((w) => (w.status || "").toLowerCase() === "ok");

  return (
    <div className="mx-10 rounded-xl border border-slate-200 bg-white shadow-sm p-3 text-xs text-slate-700">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Pronunciation feedback</div>
        <div className="text-[11px] text-slate-500">
          Score: <span className="font-semibold">{toFixed1(score_overall)}</span>
        </div>
      </div>

      <div className="mt-1 text-slate-600">
        <span className="text-[11px] uppercase">ASR</span>: {recognized || "—"}
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {mis.map((w, i) => (
          <Tag key={`mis-${i}`} color="bg-rose-100 text-rose-700">
            ✗ {w.word}
          </Tag>
        ))}
        {missed.map((w, i) => (
          <Tag key={`missed-${i}`} color="bg-amber-100 text-amber-700">
            … {w.word}
          </Tag>
        ))}
        {ok.slice(0, 6).map((w, i) => (
          <Tag key={`ok-${i}`} color="bg-emerald-100 text-emerald-700">
            ✓ {w.word}
          </Tag>
        ))}
        {ok.length > 6 && (
          <Tag color="bg-emerald-50 text-emerald-600">+{ok.length - 6} ok</Tag>
        )}
      </div>

      <details className="mt-2">
        <summary className="cursor-pointer text-[11px] text-slate-500">Details</summary>
        <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
          <div>
            WER: <b>{details.wer ?? "—"}</b>
          </div>
          <div>
            CER: <b>{details.cer ?? "—"}</b>
          </div>
          <div>
            Conf: <b>{details.conf ?? "—"}</b>
          </div>
          <div>
            Duration: <b>{details.duration ?? "—"}</b>s
          </div>
          <div>
            Speed: <b>{details.speed_sps ?? "—"}</b> sps
          </div>
        </div>
      </details>
    </div>
  );
}