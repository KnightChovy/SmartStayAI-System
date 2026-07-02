import { AlertTriangle, Inbox } from 'lucide-react';
import { cn } from '@/lib/cn';

/** Lỗi cho một khối (card/chart/table) kèm nút Thử lại — AC-2.3. */
export function SectionError({
  onRetry,
  className,
}: {
  onRetry: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-red-200 bg-white p-8 text-center',
        className
      )}
    >
      <AlertTriangle className="w-7 h-7 text-red-500 mb-3" />
      <p className="text-slate-800 font-medium text-sm">Couldn't load data</p>
      <p className="text-slate-500 text-xs mt-1">Something went wrong loading this section.</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-lg bg-role-manager-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-role-manager-secondary"
      >
        Retry
      </button>
    </div>
  );
}

/** Rỗng cho một khối — AC-2.2 (không hiển thị số 0 gây hiểu nhầm). */
export function SectionEmpty({
  message = 'No revenue data for the selected period',
  className,
  height = 'h-64',
}: {
  message?: string;
  className?: string;
  height?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center text-slate-400',
        height,
        className
      )}
    >
      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Inbox className="w-6 h-6" />
      </div>
      <p className="text-sm max-w-xs">{message}</p>
    </div>
  );
}

/** Skeleton cho khối chart — giữ chiều cao để không nhảy layout (AC-2.1). */
export function ChartSkeleton({ height = 'h-64' }: { height?: string }) {
  return (
    <div className={cn('animate-pulse rounded-lg bg-slate-50', height)} />
  );
}
