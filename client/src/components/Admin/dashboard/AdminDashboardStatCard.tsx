import type { AdminDashboardStatCardProps } from '@/types/admin.types';

export function AdminDashboardStatCard({
  label,
  value,
  trend,
}: AdminDashboardStatCardProps) {
  return (
    <div className="rounded-sm border bg-white p-4">
      <p className="text-[10px] font-semibold tracking-wide text-slate-700">
        {label}
      </p>
      <p className="mt-1.5 text-2xl font-bold">{value}</p>
      <p className="mt-0.5 text-sm text-green-600">{trend}</p>
    </div>
  );
}
