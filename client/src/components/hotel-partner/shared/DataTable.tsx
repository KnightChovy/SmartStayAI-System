import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface Column<T> {
  /** Khóa ổn định cho cột (dùng làm React key). */
  id: string;
  header: ReactNode;
  /** Render nội dung ô cho một dòng. */
  cell: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
  /** Class thêm cho cả <th> và <td> của cột (vd width, ẩn ở mobile). */
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Tailwind min-width để bảng cuộn ngang gọn trên mobile. */
  minWidthClass?: string;
  onRowClick?: (row: T) => void;
  className?: string;
}

const ALIGN_CLASS = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
} as const;

/**
 * Bảng dữ liệu dùng chung cho các màn quản trị (Hotels, Room Types, Rooms,
 * Pricing). Khai báo cột bằng `Column<T>[]`, mọi style header/row/cuộn ngang
 * được chuẩn hóa ở một nơi.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  minWidthClass = 'min-w-[640px]',
  onRowClick,
  className,
}: DataTableProps<T>) {
  return (
    <div className={cn('overflow-x-auto rounded-xl border border-slate-200', className)}>
      <table className={cn('w-full text-sm', minWidthClass)}>
        <thead>
          <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            {columns.map(col => (
              <th
                key={col.id}
                className={cn('px-4 py-3', col.align && ALIGN_CLASS[col.align], col.className)}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map(row => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn('hover:bg-slate-50/60', onRowClick && 'cursor-pointer')}
            >
              {columns.map(col => (
                <td
                  key={col.id}
                  className={cn('px-4 py-3 align-middle', col.align && ALIGN_CLASS[col.align], col.className)}
                >
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
