import { Building, CalendarDays, DollarSign, Warehouse } from 'lucide-react';
import type { PartnerOverviewStats } from '@/hooks/partner-dashboard';
import { formatCompactVnd } from '@/utils/formatCurrency';

interface DashboardStatsProps {
  stats: PartnerOverviewStats;
  isLoading?: boolean;
}

const cardBase =
  'p-5 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between min-h-[140px] transition-transform duration-300 hover:scale-105';

function StatSkeleton() {
  return (
    <div className={cardBase}>
      <div className="w-10 h-10 rounded-lg bg-slate-100 animate-pulse" />
      <div className="space-y-2">
        <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
        <div className="h-6 w-20 bg-slate-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

export function DashboardStats({ stats, isLoading }: DashboardStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[0, 1, 2, 3].map(i => (
          <StatSkeleton key={i} />
        ))}
      </div>
    );
  }

  const occupancyPct =
    stats.occupancyRate !== null ? Math.round(stats.occupancyRate * 100) : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Bookings this month */}
      <div className={`cursor-pointer ${cardBase}`}>
        <div className="flex justify-between items-start mb-4">
          <div className="w-10 h-10 rounded-lg bg-role-partner-light/80 border border-role-partner-light">
            <CalendarDays className="w-10 h-10 text-role-partner-primary p-2" />
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">Bookings this month</p>
          <h3 className="text-2xl font-bold text-slate-900 leading-none">
            {stats.monthlyBookings.toLocaleString('en-US')}
          </h3>
        </div>
      </div>

      {/* Occupancy Rate */}
      <div className={`cursor-pointer ${cardBase}`}>
        <div className="flex justify-between items-start mb-4">
          <div className="w-10 h-10 rounded-lg bg-role-partner-light/80 border border-role-partner-light">
            <Building className="w-10 h-10 text-role-partner-primary p-2" />
          </div>
        </div>
        <div className="relative">
          <p className="text-sm font-medium text-slate-500 mb-1 flex items-center justify-between">
            <span>Occupancy Rate</span>
            <span className="text-xl font-bold text-slate-900 leading-none">
              {occupancyPct !== null ? `${occupancyPct}%` : '—'}
            </span>
          </p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-3">
            <div
              className="bg-role-partner-primary h-full rounded-full"
              style={{ width: `${occupancyPct ?? 0}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Monthly Revenue */}
      <div className={`cursor-pointer ${cardBase}`}>
        <div className="flex justify-between items-start mb-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50/80 border border-emerald-100 flex items-center justify-center">
            <DollarSign className="w-10 h-10 text-role-partner-primary p-2" />
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">Monthly Revenue (net)</p>
          <h3 className="text-2xl font-bold text-slate-900 leading-none">
            {formatCompactVnd(stats.monthlyNet)}
          </h3>
          <p className="text-xs text-slate-400 mt-1.5">
            Gross {formatCompactVnd(stats.monthlyGross)}
          </p>
        </div>
      </div>

      {/* Total Rooms */}
      <div className={`cursor-pointer ${cardBase}`}>
        <div className="flex justify-between items-start mb-4">
          <div className="w-10 h-10 rounded-lg bg-slate-100/80 border border-slate-200 flex items-center justify-center">
            <Warehouse className="w-10 h-10 text-role-partner-primary p-2" />
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">Total Rooms</p>
          <h3 className="text-2xl font-bold text-slate-900 leading-none mb-2.5">
            {stats.totalRooms.toLocaleString('en-US')}
          </h3>
          <div className="flex gap-2">
            <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-sm">
              {stats.totalRoomTypes} room types
            </span>
            <span className="text-[10px] font-semibold bg-role-partner-light text-role-partner-primary px-2 py-0.5 rounded-sm">
              {stats.hotelCount} {stats.hotelCount === 1 ? 'hotel' : 'hotels'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
