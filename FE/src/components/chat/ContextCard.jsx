import React from "react";
import { Tag } from "./Tag";

export function ContextCard({ items = [] }) {
  if (!items?.length) return null;

  return (
    <details className="mx-10 rounded-xl border border-slate-200 bg-white shadow-sm p-3 text-xs text-slate-700">
      <summary className="cursor-pointer text-slate-600">
        Context (top {items.length})
      </summary>
      <div className="mt-2 space-y-2">
        {items.map((b, i) => (
          <div key={b.id || i} className="rounded-lg border border-slate-100 p-2">
            <div className="mb-1 flex items-center gap-2">
              {b.section && <Tag>{b.section}</Tag>}
              {typeof b.order === "number" && <Tag>#{b.order}</Tag>}
              {b.role && <Tag color="bg-slate-100 text-slate-700">{b.role}</Tag>}
            </div>
            <div className="text-slate-700">{b.text}</div>
          </div>
        ))}
      </div>
    </details>
  );
}