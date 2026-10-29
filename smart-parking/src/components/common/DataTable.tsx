import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState, SearchInput } from './Elements';
import { searchText } from '@/utils/format';
import { compareValues } from '@/utils/sort';
import { exportExcel } from '@/services/export';
import { useCan } from '@/stores/useParkingStore';
export interface Column<T> {
  key: string;
  label: string;
  value: (row: T) => string | number;
  render?: (row: T) => ReactNode;
  className?: string;
}
export function DataTable<T extends { id: string }>({
  rows,
  columns,
  title,
  filters,
  actions,
  onRow,
  searchPlaceholder = 'Tìm kiếm trong danh sách...',
  exportName,
  initialQuery = '',
  pageSize = 10,
}: {
  rows: T[];
  columns: Column<T>[];
  title?: string;
  filters?: ReactNode;
  actions?: (row: T) => ReactNode;
  onRow?: (row: T) => void;
  searchPlaceholder?: string;
  exportName?: string;
  initialQuery?: string;
  pageSize?: number;
}) {
  const [query, setQuery] = useState(initialQuery),
    [page, setPage] = useState(1),
    [size, setSize] = useState(pageSize),
    [sort, setSort] = useState<{ key: string; dir: number }>({ key: '', dir: 1 });
  const canExport = useCan('export');
  useEffect(() => {
    setQuery(initialQuery);
    setPage(1);
  }, [initialQuery]);
  const filtered = useMemo(() => {
    const words = searchText(query).split(' ').filter(Boolean);
    const result = rows.filter((row) => {
      const text = searchText(columns.map((c) => c.value(row)).join(' '));
      return words.every((w) => text.includes(w));
    });
    const col = columns.find((c) => c.key === sort.key);
    if (col)
      result.sort((a, b) => {
        const av = col.value(a),
          bv = col.value(b);
        return sort.dir * compareValues(av, bv);
      });
    return result;
  }, [rows, columns, query, sort]);
  const maxPage = Math.max(1, Math.ceil(filtered.length / size)),
    current = Math.min(page, maxPage),
    visible = filtered.slice((current - 1) * size, current * size);
  return (
    <section className="panel data-panel">
      {title && (
        <div className="panel-heading">
          <h2>
            {title} <span className="count-pill">{rows.length}</span>
          </h2>
        </div>
      )}
      <div className="table-toolbar">
        <SearchInput
          value={query}
          onChange={(q) => {
            setQuery(q);
            setPage(1);
          }}
          placeholder={searchPlaceholder}
        />
        <div className="table-filters">{filters}</div>
        {exportName && canExport && (
          <Button
            variant="outline"
            onClick={() =>
              exportExcel(
                exportName,
                filtered.map((row) =>
                  Object.fromEntries(columns.map((c) => [c.label, c.value(row)])),
                ),
              )
            }
          >
            <Download size={16} />
            Xuất Excel
          </Button>
        )}
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={c.className}
                  aria-sort={
                    sort.key === c.key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'
                  }
                >
                  <button
                    onClick={() => setSort({ key: c.key, dir: sort.key === c.key ? -sort.dir : 1 })}
                  >
                    {c.label}
                    {sort.key === c.key ? (
                      sort.dir === 1 ? (
                        <ArrowUp size={13} />
                      ) : (
                        <ArrowDown size={13} />
                      )
                    ) : (
                      <ArrowUpDown size={12} />
                    )}
                  </button>
                </th>
              ))}
              {actions && <th className="actions-col">Thao tác</th>}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr
                key={row.id}
                className={onRow ? 'clickable' : ''}
                onClick={() => onRow?.(row)}
                tabIndex={onRow ? 0 : undefined}
                onKeyDown={(e) => {
                  if (e.target === e.currentTarget && e.key === 'Enter') onRow?.(row);
                }}
              >
                {columns.map((c) => (
                  <td key={c.key} className={c.className}>
                    {c.render ? c.render(row) : c.value(row) || '—'}
                  </td>
                ))}
                {actions && (
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="row-actions">{actions(row)}</div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <EmptyState />}
      </div>
      <div className="pagination">
        <span>
          Hiển thị{' '}
          <b>
            {filtered.length ? (current - 1) * size + 1 : 0}–
            {Math.min(current * size, filtered.length)}
          </b>{' '}
          trong <b>{filtered.length}</b> kết quả
        </span>
        <div>
          <select
            aria-label="Số dòng mỗi trang"
            value={size}
            onChange={(e) => {
              setSize(Number(e.target.value));
              setPage(1);
            }}
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n} dòng / trang
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="icon"
            aria-label="Trang trước"
            disabled={current === 1}
            onClick={() => setPage(current - 1)}
          >
            <ChevronLeft size={17} />
          </Button>
          <span className="current-page">
            {current} / {maxPage}
          </span>
          <Button
            variant="outline"
            size="icon"
            aria-label="Trang sau"
            disabled={current === maxPage}
            onClick={() => setPage(current + 1)}
          >
            <ChevronRight size={17} />
          </Button>
        </div>
      </div>
      <table className="print-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((row) => (
            <tr key={row.id}>
              {columns.map((c) => (
                <td key={c.key}>{c.render ? c.render(row) : c.value(row) || '—'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
