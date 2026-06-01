import { AdminDashboardActivityLog } from '@/components/Admin/dashboard/AdminDashboardActivityLog';
import { AdminDashboardAppPanel } from '@/components/Admin/dashboard/AdminDashboardAppPanel';
import { AdminDashboardGrowthChart } from '@/components/Admin/dashboard/AdminDashboardGrowthChart';
import { AdminDashboardQuickActions } from '@/components/Admin/dashboard/AdminDashboardQuickActions';
import { AdminDashboardStatCard } from '@/components/Admin/dashboard/AdminDashboardStatCard';
import { AdminDashboardSystemHealth } from '@/components/Admin/dashboard/AdminDashboardSystemHealth';

const stats = [
  { label: 'TOTAL USERS', value: '124,500', trend: '+8.3%' },
  { label: 'REVENUE', value: '$1,250', trend: '+12%' },
  { label: 'ACTIVE SESSIONS', value: '8,750', trend: '+5%' },
  { label: 'SERVER UPTIME', value: '99.9%', trend: 'Healthy' },
];

export function AdminDashboardPage() {
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
      <div className="space-y-4">
        <h1 className="text-xl font-bold tracking-tight">
          Welcome back, <span className="text-blue-600">Admin</span>
        </h1>

        <section className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
          {stats.map(item => (
            <AdminDashboardStatCard key={item.label} {...item} />
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.9fr_1fr]">
          <AdminDashboardGrowthChart />
          <div className="rounded-sm border bg-white p-4">
            <h2 className="text-base font-semibold">Device Distribution</h2>
            <div className="mx-auto mt-4 size-36 rounded-full border-14 border-blue-500 border-b-black border-l-slate-200" />
            <ul className="mt-4 space-y-1.5 text-xs">
              <li className="flex items-center justify-between">
                <span>Mobile</span>
                <span>45%</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Desktop</span>
                <span>35%</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Tablet</span>
                <span>20%</span>
              </li>
            </ul>
          </div>
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
