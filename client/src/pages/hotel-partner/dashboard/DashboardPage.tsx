import { DashboardHeader } from '../../../components/hotel-partner/dashboard/DashboardHeader';
import { DashboardStats } from '../../../components/hotel-partner/dashboard/DashboardStats';
import { RevenueBookingChart } from '../../../components/hotel-partner/dashboard/RevenueBookingChart';
import { RecentActivities } from '../../../components/hotel-partner/dashboard/RecentActivities';
import { QuickActions } from '../../../components/hotel-partner/dashboard/QuickActions';
import { VerificationStatus } from '../../../components/hotel-partner/dashboard/VerificationStatus';
import { TopPerformingRooms } from '../../../components/hotel-partner/dashboard/TopPerformingRooms';
import { RevenueTarget } from '../../../components/hotel-partner/dashboard/RevenueTarget';
import { usePartnerOverview } from '@/hooks/partner-dashboard';

export default function DashboardPage() {
  const { stats, series, activities, isLoading, isError } = usePartnerOverview();

  return (
    <div className="p-6 max-w-350 mx-auto w-full bg-white rounded-xl border border-slate-200">
      <DashboardHeader />

      {isError && (
        <div className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          Could not load your dashboard data. Please try again.
        </div>
      )}

      <DashboardStats stats={stats} isLoading={isLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <RevenueBookingChart data={series} isLoading={isLoading} />
          <RecentActivities activities={activities} isLoading={isLoading} />
        </div>

        <div className="flex flex-col">
          <QuickActions />
          <VerificationStatus />
          <TopPerformingRooms />
          <RevenueTarget />
        </div>
      </div>
    </div>
  );
}
