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
    return 'bg-amber-100 text-amber-700';
  }

  if (
    normalized.includes('inactive') ||
    normalized.includes('unlisted') ||
    normalized.includes('failed') ||
    normalized.includes('suspended') ||
    normalized.includes('cancelled')
  ) {
    return 'bg-red-100 text-red-700';
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
    return 'bg-emerald-100 text-emerald-700';
  }

  return 'bg-slate-100 text-slate-600';
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
      // Cùng hình dạng với `Pill` của partner/manager: pill tròn, text-[11px], không viền.
      <span
        className={cn(
          'inline-flex max-w-52 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
          getStatusClasses(cell)
        )}
      >
        {showStatusIcons ? (
          <StatusIcon aria-hidden="true" className="size-3 shrink-0" />
        ) : null}
        {cell}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'block',
        columnIndex === 0 ? 'font-medium text-slate-800' : 'text-slate-600'
      )}
    >
      {cell}
    </span>
  );
}

/**
 * Bảng của cổng Admin.
 *
 * Khung/typography/spacing bám đúng `DataTable` mà partner & manager dùng, để ba cổng đọc như một
 * hệ. Trước đây admin lệch ở: bo góc `rounded-xl` + shadow nặng, header `text-[11px]` tracking rộng
 * hơn, ô `py-3.5`, có đường kẻ dọc `border-l` giữa mọi cột, và hover dòng `bg-indigo-50/35` —
 * indigo lại đúng là màu của cổng partner.
 *
 * Khác biệt CỐ Ý giữ lại so với `DataTable`: bảng này nhận `string[][]` (không generic) nên vẫn cần
 * tự suy badge trạng thái từ nội dung ô.
 */
export function AdminTable({
  headers,
  rows,
  renderLastColumn,
  footer,
  showStatusIcons = false,
}: AdminTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-160 text-left text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {headers.map((header, index) => (
                <th
                  key={header}
                  className={cn(
                    'whitespace-nowrap px-4 py-3',
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
                  className="px-4 py-12 text-center text-sm text-slate-400"
                  colSpan={headers.length}
                >
                  No records found.
                </td>
              </tr>
            ) : (
              rows.map((row, rowIdx) => (
                <tr
                  key={`${row[0]}-${rowIdx}`}
                  className="group transition-colors hover:bg-slate-50/60"
                >
                  {row.map((cell, idx) => {
                    const isLast = idx === row.length - 1;
                    if (isLast && renderLastColumn) {
                      return (
                        <td
                          key={`${row[0]}-${rowIdx}-${idx}`}
                          className="px-4 py-3 text-right align-middle"
                        >
                          {renderLastColumn(row)}
                        </td>
                      );
                    }

                    return (
                      <td
                        key={`${row[0]}-${rowIdx}-${idx}`}
                        className="whitespace-nowrap px-4 py-3 align-middle"
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
        <div className="border-t border-slate-100 px-4 py-3">{footer}</div>
      ) : null}
    </div>
  );
}
