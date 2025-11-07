import React from 'react';
import {Eye, Plus, Pencil, Trash2 } from 'lucide-react'

export default function TableCard({
  addLabel = 'Create New Entry',
  onAdd,
  rows = [],
  columns = [],
  getRowId = (r) => r.id,
  searchKeys = [],
  emptyText = 'No data.',
}) {
  const [q, setQ] = React.useState('');

  const filtered = React.useMemo(() => {
    if (!q.trim()) return rows;
    const s = q.trim().toLowerCase();
    const keys = searchKeys.length ? searchKeys : columns.map(c => c.key);
    return rows.filter((r) =>
      keys.some((k) => String(r?.[k] ?? '').toLowerCase().includes(s))
    );
  }, [q, rows, columns, searchKeys]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-xs">
          
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-400/40"
          />
        </div>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
        >
          <Plus /> {addLabel}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-700 uppercase text-xs tracking-wide">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="px-4 py-3 font-semibold">{c.header}</th>
              ))}
              <th className="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((r) => (
              <tr key={getRowId(r)} className="hover:bg-slate-50">
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3">
                    {c.render ? c.render(r[c.key], r) : r[c.key]}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2 text-slate-500">
                    <button title="Edit" className="hover:text-sky-600"><Pencil /></button>
                    <button title="Delete" className="hover:text-rose-600"><Trash2 /></button>
                    <button title="View" className="hover:text-emerald-600"><Eye /></button>
                  </div>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={columns.length + 1}>
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}