import { AdminDashboardActivityLog } from '@/components/Admin/dashboard/AdminDashboardActivityLog';
import { AdminDashboardAppPanel } from '@/components/Admin/dashboard/AdminDashboardAppPanel';
import { AdminDashboardDeviceChart } from '@/components/Admin/dashboard/AdminDashboardDeviceChart';
import { AdminDashboardGrowthChart } from '@/components/Admin/dashboard/AdminDashboardGrowthChart';
import { AdminDashboardQuickActions } from '@/components/Admin/dashboard/AdminDashboardQuickActions';
import { AdminDashboardStatCard } from '@/components/Admin/dashboard/AdminDashboardStatCard';
import { AdminDashboardSystemHealth } from '@/components/Admin/dashboard/AdminDashboardSystemHealth';

const stats = [
  { label: 'TOTAL USERS', value: '124,500', trend: '+8.3%' },
  { label: 'REVENUE', value: '$1,250', trend: '+12%' },
  { label: 'BOOKINGS', value: '3,482', trend: '+9.1%' },
  { label: 'ENGAGEMENT', value: '76.4%', trend: '+5%' },
];

export function AdminDashboardPage() {
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
      <div className="space-y-4">
        <h1 className="text-xl font-bold tracking-tight">
          Welcome back, <span className="text-blue-600">Admin</span>
        </h1>

        <section className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4 md:grid-cols-2 sm:grid-cols-2">
          {stats.map(item => (
            <AdminDashboardStatCard key={item.label} {...item} />
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.9fr_1fr]">
          <AdminDashboardGrowthChart />
          <AdminDashboardDeviceChart />
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
