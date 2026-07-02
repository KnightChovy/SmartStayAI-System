import React from 'react';
import { DashboardHeader } from '../../../components/hotel-partner/dashboard/DashboardHeader';
import { DashboardStats } from '../../../components/hotel-partner/dashboard/DashboardStats';
import { RevenueBookingChart } from '../../../components/hotel-partner/dashboard/RevenueBookingChart';
import { RecentActivities } from '../../../components/hotel-partner/dashboard/RecentActivities';
import { QuickActions } from '../../../components/hotel-partner/dashboard/QuickActions';
import { VerificationStatus } from '../../../components/hotel-partner/dashboard/VerificationStatus';
import { TopPerformingRooms } from '../../../components/hotel-partner/dashboard/TopPerformingRooms';
import { RevenueTarget } from '../../../components/hotel-partner/dashboard/RevenueTarget';

export default function DashboardPage() {
  return (
    <div className="p-6 max-w-[1400px] mx-auto w-full bg-white rounded-xl border border-slate-200">
      <DashboardHeader />
      <DashboardStats />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <RevenueBookingChart />
          <RecentActivities />
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
