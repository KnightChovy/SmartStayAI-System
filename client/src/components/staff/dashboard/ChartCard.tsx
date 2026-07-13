import type { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

/** Khung card cho biểu đồ — đồng bộ với card của trang partner (rounded-xl, border slate). */
export function ChartCard({ title, subtitle, children, className }: ChartCardProps) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-4${className ? ` ${className}` : ''}`}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

/** Ô "chưa có dữ liệu" cho biểu đồ, giữ đúng chiều cao để layout không nhảy. */
export function ChartEmpty({ height = 260 }: { height?: number }) {
  return (
    <div
      className="flex items-center justify-center text-sm text-slate-400"
      style={{ height }}
    >
      No data yet.
    </div>
  );
}
