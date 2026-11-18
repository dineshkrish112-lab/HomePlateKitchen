import { useMemo, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { EmptyState } from './ui';

export interface Column<T> { key: string; header: string; render: (row: T) => ReactNode; className?: string; }

/** Searchable, paginated table used across admin & kitchen portals. */
export default function DataTable<T>({ rows, columns, searchText, pageSize = 10, toolbar, empty = 'No records found', onRowClick }:
  { rows: T[]; columns: Column<T>[]; searchText?: (row: T) => string; pageSize?: number; toolbar?: ReactNode;
    empty?: string; onRowClick?: (row: T) => void }) {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!q.trim() || !searchText) return rows;
    const s = q.toLowerCase();
    return rows.filter((r) => searchText(r).toLowerCase().includes(s));
  }, [rows, q, searchText]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const cur = Math.min(page, pages);
  const slice = filtered.slice((cur - 1) * pageSize, cur * pageSize);

  return (
    <div className="card overflow-hidden">
      {(searchText || toolbar) && (
        <div className="flex flex-col gap-3 border-b border-cream-200 p-4 sm:flex-row sm:items-center">
          {searchText && (
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />
              <input className="input pl-9" placeholder="Search…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
            </div>
          )}
          <div className="flex flex-1 flex-wrap items-center gap-2 sm:justify-end">{toolbar}</div>
        </div>
      )}
      {slice.length === 0 ? (
        <div className="p-6"><EmptyState title={empty} /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-cream-200">
            <thead className="bg-cream-50"><tr>{columns.map((c) => <th key={c.key} className={`table-th ${c.className ?? ''}`}>{c.header}</th>)}</tr></thead>
            <tbody className="divide-y divide-cream-100">
              {slice.map((r, i) => (
                <tr key={i} onClick={() => onRowClick?.(r)} className={onRowClick ? 'cursor-pointer transition hover:bg-cream-50' : 'hover:bg-cream-50/50'}>
                  {columns.map((c) => <td key={c.key} className={`table-td ${c.className ?? ''}`}>{c.render(r)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex items-center justify-between border-t border-cream-200 px-4 py-3 text-xs text-charcoal-500">
        <span>{filtered.length} record{filtered.length === 1 ? '' : 's'}</span>
        <div className="flex items-center gap-2">
          <button className="rounded-lg p-1.5 hover:bg-cream-100 disabled:opacity-40" disabled={cur <= 1} onClick={() => setPage(cur - 1)} aria-label="Previous"><ChevronLeft className="h-4 w-4" /></button>
          <span>Page {cur} of {pages}</span>
          <button className="rounded-lg p-1.5 hover:bg-cream-100 disabled:opacity-40" disabled={cur >= pages} onClick={() => setPage(cur + 1)} aria-label="Next"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}
