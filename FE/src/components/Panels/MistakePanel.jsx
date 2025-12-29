import React, { useState } from "react";
import { api } from "../../api/api";

export default function MistakePanel({ skill }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mistakes, setMistakes] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAllMistakes = async () => {
    if (!skill) return;
    setLoading(true);
    try {
      let res;
      if (api.Mistakes?.bySkill) {
        res = await api.Mistakes.bySkill(skill.id, { page_size: 50 });
      } else if (api.Mistakes?.list) {
        res = await api.Mistakes.list({
          skill: skill.id,
          ordering: "-timestamp",
          page_size: 50,
        });
      }
      const items = Array.isArray(res?.results)
        ? res.results
        : Array.isArray(res)
        ? res
        : [];
      setMistakes(items);
    } catch (e) {
      console.warn("[MistakePanel] fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const toggle = () => {
    if (!isOpen) {
      fetchAllMistakes();
    }
    setIsOpen(!isOpen);
  };

  if (!skill) return null;

  return (
    <div className="mt-8">
      <button
        onClick={toggle}
        className="text-sm text-slate-600 underline"
      >
        {isOpen ? "Ẩn danh sách lỗi" : "Xem Mistake của kỹ năng này"}
      </button>

      {isOpen && (
        <div className="mt-3 rounded-xl border border-slate-200">
          <div className="border-b px-4 py-2 text-sm font-semibold flex justify-between">
            <span>Mistakes cho: {skill.title}</span>
            {loading && <span className="text-slate-400 font-normal">Loading...</span>}
          </div>
          
          <div className="divide-y">
            {!loading && mistakes.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-500">
                Không có Mistake.
              </div>
            ) : (
              mistakes.map((m) => (
                <div key={m.id} className="px-4 py-3 text-sm">
                  <div className="text-slate-800">
                    <b>Prompt:</b> {m.prompt || "(n/a)"}
                  </div>
                  <div className="text-slate-600">
                    <b>Expected:</b> {m.expected || "(n/a)"} &nbsp;|&nbsp;{" "}
                    <b>Answer:</b> {m.user_answer || "(n/a)"}
                  </div>
                  <div className="text-[12px] text-slate-400">
                    #{m.id} · {m.source}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}