import { cn } from '@/lib/cn';
import { ROLE_THEME } from '@/constants/roleTheme';
import type { AdminDashboardStatCardProps } from '@/types/admin.types';

/**
 * Thẻ chỉ số của dashboard Admin.
 *
 * Cấu trúc bám KPI card của manager (`DashboardKpiCards`): ô icon màu vai trò → số lớn `text-2xl`
 * → nhãn → dòng phụ. Trước đây thẻ này là `rounded-sm` (góc gần như vuông giữa một giao diện toàn
 * bo tròn) với nhãn `text-[10px]` nằm TRÊN số, tức lệch cả hình dạng lẫn thứ tự đọc.
 */
export function AdminDashboardStatCard({
  label,
  value,
  trend,
  icon: Icon,
}: AdminDashboardStatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-role-admin-primary/40 hover:shadow-sm">
      {Icon ? (
        <div
          className={cn(
            'mb-3 flex size-9 items-center justify-center rounded-lg',
            ROLE_THEME.admin.accentSoft
          )}
        >
          <Icon className="size-4.5" />
        </div>
      ) : null}
      <p
        className="wrap-break-word text-2xl font-bold text-slate-900"
        title={value}
      >
        {value}
      </p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
      <p className="mt-0.5 text-xs text-emerald-600">{trend}</p>
    </div>
  );
}
