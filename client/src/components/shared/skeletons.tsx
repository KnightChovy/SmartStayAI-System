import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';

/**
 * Skeleton loaders dùng chung cho các portal (hotel-partner, manager, ...).
 * Thay cho spinner ở các khối content đang tải để giữ layout ổn định và cảm
 * giác nhanh hơn. Nút submit (mutation) vẫn dùng spinner nhỏ, không dùng ở đây.
 */

/** Skeleton cho bảng dữ liệu — khớp look của `DataTable` (header + rows). */
export function TableSkeleton({
  rows = 5,
  columns = 4,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn('overflow-hidden rounded-xl border border-slate-200', className)}>
      <div className="flex gap-4 bg-slate-50 px-4 py-3.5">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-3.5 flex-1" />
        ))}
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 px-4 py-4">
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton
                key={c}
                className={cn('h-4 flex-1', c === 0 && 'max-w-[38%]')}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Skeleton cho thanh công cụ (search + filter) đứng trên bảng directory. */
export function ToolbarSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      <Skeleton className="h-10 flex-1 min-w-[180px] rounded-lg" />
      <Skeleton className="h-10 w-28 rounded-lg" />
    </div>
  );
}

/** Directory page (danh sách khách sạn): toolbar + bảng. */
export function DirectorySkeleton({
  rows = 5,
  columns = 4,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-4', className)}>
      <ToolbarSkeleton />
      <TableSkeleton rows={rows} columns={columns} />
    </div>
  );
}

/** Skeleton lưới card (grid ảnh/khách sạn). */
export function CardGridSkeleton({
  count = 6,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-200 p-4 space-y-3">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Skeleton danh sách item (amenity, staff list dạng dòng). */
export function ListSkeleton({
  rows = 6,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2.5', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border border-slate-200 p-3"
        >
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Skeleton trang chi tiết: header + các section. */
export function DetailSkeleton({
  sections = 3,
  className,
}: {
  sections?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-start gap-4">
        <Skeleton className="h-16 w-16 rounded-xl" />
        <div className="flex-1 space-y-2.5">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
      {Array.from({ length: sections }).map((_, s) => (
        <div key={s} className="rounded-xl border border-slate-200 p-5 space-y-3">
          <Skeleton className="h-4 w-32" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
