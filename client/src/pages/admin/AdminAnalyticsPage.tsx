import { AdminAnalyticsCharts } from '@/components/admin/analytics/AdminAnalyticsCharts';
import { AdminAnalyticsHeader } from '@/components/admin/analytics/AdminAnalyticsHeader';
import { AdminAnalyticsKpiCard } from '@/components/admin/analytics/AdminAnalyticsKpiCard';

const kpis = [
  { label: 'Total Revenue', value: '$2.4M', delta: '+12.5%' },
  { label: 'Occupancy Rate', value: '84.2%', delta: '+8.2%' },
  { label: 'New Users', value: '14.8k', delta: '-2.4%' },
  { label: 'Avg. Rating', value: '4.85', delta: '+0.3' },
];

export function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <AdminAnalyticsHeader
        title="Market Intelligence"
        description="Global performance overview for Q3 2026"
      />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map(kpi => (
          <AdminAnalyticsKpiCard key={kpi.label} {...kpi} />
        ))}
      </section>
      <AdminAnalyticsCharts />
    </div>
  );
}
