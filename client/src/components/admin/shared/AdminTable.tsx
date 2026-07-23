import { BadgeCheck, CircleDot, CircleSlash2, Clock3 } from 'lucide-react';
import type { AdminTableProps } from '@/types/admin.types';
import { cn } from '@/lib/cn';

const STATUS_HEADERS = new Set(['status', 'verification']);

function getStatusClasses(value: string): string {
  const normalized = value.toLowerCase();

  if (
    normalized.includes('pending') ||
    normalized.includes('review') ||
    normalized.includes('unpaid')
  ) {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }

  if (
    normalized.includes('inactive') ||
    normalized.includes('unlisted') ||
    normalized.includes('failed') ||
    normalized.includes('suspended') ||
    normalized.includes('cancelled')
  ) {
    return 'border-rose-200 bg-rose-50 text-rose-700';
  }
  if (
    normalized.includes('active') ||
    normalized.includes('listed') ||
    normalized.includes('verified') ||
    normalized.includes('completed') ||
    normalized.includes('settled') ||
    normalized.includes('confirmed') ||
    normalized.includes('checked_out')
  ) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  return 'border-slate-200 bg-slate-50 text-slate-600';
}

function getStatusIcon(value: string) {
  const normalized = value.toLowerCase();

  if (
    normalized.includes('pending') ||
    normalized.includes('review') ||
    normalized.includes('unpaid')
  ) {
    return Clock3;
  }

  if (
    normalized.includes('inactive') ||
    normalized.includes('unlisted') ||
    normalized.includes('failed') ||
    normalized.includes('suspended') ||
    normalized.includes('cancelled')
  ) {
    return CircleSlash2;
  }

  if (
    normalized.includes('active') ||
    normalized.includes('listed') ||
    normalized.includes('verified') ||
    normalized.includes('completed') ||
    normalized.includes('settled') ||
    normalized.includes('confirmed') ||
    normalized.includes('checked_out')
  ) {
    return BadgeCheck;
  }

  return CircleDot;
}

function renderCell(
  header: string,
  cell: string,
  columnIndex: number,
  showStatusIcons: boolean
) {
  if (STATUS_HEADERS.has(header.toLowerCase())) {
    const StatusIcon = getStatusIcon(cell);

    return (
      <span
        className={cn(
          'inline-flex max-w-52 items-center rounded-lg border px-2.5 py-1 text-xs font-semibold',
          getStatusClasses(cell)
        )}
      >
        {showStatusIcons ? (
          <StatusIcon aria-hidden="true" className="mr-1.5 size-3.5 shrink-0" />
        ) : null}
        {cell}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'block',
        columnIndex === 0 ? 'font-semibold text-slate-950' : 'text-slate-600'
      )}
    >
      {cell}
    </span>
  );
}

export function AdminTable({
  headers,
  rows,
  renderLastColumn,
  footer,
  showStatusIcons = false,
}: AdminTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_12px_32px_-28px_rgba(15,23,42,0.55)] lg:rounded-3xl">
      <div className="overflow-x-auto">
        <table className="min-w-190 w-full text-left">
          <thead className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={header}
                  className={cn(
                    'whitespace-nowrap px-4 py-4 first:pl-5 last:pr-5',
                    index > 0 && 'border-l border-slate-200/80',
                    index === headers.length - 1 &&
                      renderLastColumn &&
                      'text-right'
                  )}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td
                  className="px-5 py-12 text-center text-sm text-slate-500"
                  colSpan={headers.length}
                >
                  No records found.
                </td>
              </tr>
            ) : (
              rows.map((row, rowIdx) => (
                <tr
                  key={`${row[0]}-${rowIdx}`}
                  className="group transition-colors duration-200 hover:bg-indigo-50/35"
                >
                  {row.map((cell, idx) => {
                    const isLast = idx === row.length - 1;
                    if (isLast && renderLastColumn) {
                      return (
                        <td
                          key={`${row[0]}-${rowIdx}-${idx}`}
                          className={cn(
                            'px-4 py-3.5 text-right first:pl-5 last:pr-5',
                            idx > 0 && 'border-l border-slate-200/80'
                          )}
                        >
                          {renderLastColumn(row)}
                        </td>
                      );
                    }

                    return (
                      <td
                          key={`${row[0]}-${rowIdx}-${idx}`}
                          className={cn(
                            'whitespace-nowrap px-4 py-3.5 text-sm first:pl-5 last:pr-5',
                            idx > 0 && 'border-l border-slate-200/80'
                          )}
                      >
                        {renderCell(
                          headers[idx] ?? '',
                          cell,
                          idx,
                          showStatusIcons
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {footer ? (
        <div className="border-t border-slate-200 bg-slate-50/45 px-4 py-3">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
