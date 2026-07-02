import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, Inbox } from 'lucide-react';
import { cn } from '@/lib/cn';

/** Skeleton 4 KPI cards (AC-4). */
export function KpiCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100" />
            <div className="h-4 w-12 bg-slate-100 rounded" />
          </div>
          <div className="h-7 w-2/3 bg-slate-100 rounded mb-2" />
          <div className="h-3 w-1/2 bg-slate-100 rounded mb-3" />
          <div className="h-8 w-full bg-slate-50 rounded" />
        </div>
      ))}
    </div>
  );
}

/** Skeleton cho khối chart — giữ chiều cao tránh nhảy layout (AC-4). */
export function ChartCardSkeleton({ height = 'h-64' }: { height?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
      <div className="h-4 w-40 bg-slate-100 rounded mb-6" />
      <div className={cn('bg-slate-50 rounded', height)} />
    </div>
  );
}

/** Skeleton cho list (verifications/alerts/activity). */
export function ListCardSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
      <div className="h-4 w-40 bg-slate-100 rounded mb-5" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-slate-100 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-1/2 bg-slate-100 rounded" />
              <div className="h-3 w-1/3 bg-slate-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Error cho một khối kèm nút Retry (AC-4). */
export function SectionError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <AlertTriangle className="w-7 h-7 text-red-500 mb-3" />
      <p className="text-slate-800 font-medium text-sm">Couldn't load this section</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 rounded-lg bg-role-manager-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-role-manager-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-role-manager-primary"
      >
        Try again
      </button>
    </div>
  );
}

/** Empty state cho một khối kèm CTA tuỳ chọn (AC-4). */
export function SectionEmpty({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-sm font-medium text-slate-600">{title}</p>
      {description && <p className="text-xs text-slate-500 mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
