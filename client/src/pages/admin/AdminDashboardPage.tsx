import {
  Building2,
  CalendarCheck,
  DollarSign,
  LayoutDashboard,
  Users,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/shared/AdminPageHeader';
import { AdminDashboardActivityLog } from '@/components/admin/dashboard/AdminDashboardActivityLog';
import { AdminDashboardAppPanel } from '@/components/admin/dashboard/AdminDashboardAppPanel';
import { AdminDashboardBookingStatusChart } from '@/components/admin/dashboard/AdminDashboardBookingStatusChart';
import { AdminDashboardGrowthChart } from '@/components/admin/dashboard/AdminDashboardGrowthChart';
import { AdminDashboardQuickActions } from '@/components/admin/dashboard/AdminDashboardQuickActions';
import { AdminDashboardStatCard } from '@/components/admin/dashboard/AdminDashboardStatCard';
import { AdminDashboardSystemHealth } from '@/components/admin/dashboard/AdminDashboardSystemHealth';
import { useAuthStore } from '@/stores/authStore';
import { useAdminOverview } from '@/hooks/admin';
import { usePlatformAnalytics } from '@/hooks/analytics';
import { errorMessage } from '@/utils/errorMessage';
import { formatCurrency } from '@/utils/formatCurrency';

export function AdminDashboardPage() {
  const user = useAuthStore(state => state.user);
  const { data: overview, isLoading, isError, error } = useAdminOverview();
  const { data: analytics, isLoading: isAnalyticsLoading } =
    usePlatformAnalytics({
      period: 'month',
      range: 8,
    });

  const stats = [
    {
      icon: Users,
      label: 'Total users',
      value: overview?.users.total.toLocaleString('en-US') ?? '—',
      trend: `${overview?.users.newThisMonth ?? 0} new this month`,
    },
    {
      icon: DollarSign,
      label: 'GMV',
      value: formatCurrency(overview?.revenue.gmv),
      trend: `${formatCurrency(overview?.revenue.commissionPending)} pending`,
    },
    {
      icon: CalendarCheck,
      label: 'Bookings',
      value: overview?.bookings.total.toLocaleString('en-US') ?? '—',
      trend: `${overview?.bookings.thisMonth ?? 0} this month`,
    },
    {
      icon: Building2,
      label: 'Listed hotels',
      value: overview?.hotels.listed.toLocaleString('en-US') ?? '—',
      trend: `${overview?.hotels.unlisted ?? 0} unlisted`,
    },
  ];

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
      <div className="space-y-4">
        {/*
          Dùng chung AdminPageHeader như 8 trang admin còn lại (và như manager/partner): card trắng
          + ô icon + h1 text-2xl. Trước đây đây là h1 trần `text-xl` kèm chữ "Admin" hardcode tô
          `text-blue-600` — vừa lệch cỡ chữ, vừa mượn màu của cổng manager.
        */}
        <AdminPageHeader
          icon={LayoutDashboard}
          title={`Welcome back, ${user?.fullName ?? 'Admin'}`}
          description="Platform health, revenue, and activity at a glance"
        />

        {isLoading && (
          <p className="text-sm text-muted-foreground">Loading overview...</p>
        )}
        {isError && (
          <p className="text-sm font-medium text-destructive">
            {errorMessage(error, 'Could not load admin overview.')}
          </p>
        )}

        <section className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4 md:grid-cols-2 sm:grid-cols-2">
          {stats.map(item => (
            <AdminDashboardStatCard key={item.label} {...item} />
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.9fr_1fr]">
          <AdminDashboardGrowthChart
            data={analytics?.timeSeries ?? []}
            isLoading={isAnalyticsLoading}
          />
          <AdminDashboardBookingStatusChart
            byStatus={overview?.bookings.byStatus ?? {}}
            isLoading={isLoading}
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.9fr_1fr]">
          <AdminDashboardActivityLog />
          <AdminDashboardSystemHealth />
        </section>
      </div>

      <aside className="space-y-4">
        <AdminDashboardAppPanel />
        <AdminDashboardQuickActions />
      </aside>
    </div>
  );
}
