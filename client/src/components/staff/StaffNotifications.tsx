import { type ComponentType } from 'react';
import { useNavigate } from 'react-router';
import { Bell, LogIn, LogOut, Clock, Sparkles, CheckCircle2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/cn';
import { useHotelBookings, useHousekeepingTasks } from '@/hooks/staff';
import { useStaffHotelStore } from '@/stores/staffHotelStore';
import { ROUTES } from '@/constants/routes';
import { toUtcDateKey, todayUtcKey } from '@/utils/formatDate';

interface Alert {
  id: string;
  icon: ComponentType<{ className?: string }>;
  tone: string;
  title: string;
  detail: string;
  to: string;
}

/**
 * Operational alerts for the active hotel. There is no notifications endpoint — these are
 * derived from the booking and housekeeping lists the portal already loads, so the bell
 * always reflects the same numbers the pages show.
 */
export function StaffNotifications() {
  const navigate = useNavigate();
  const hotel = useStaffHotelStore(state => state.hotel);
  const { data: bookingData } = useHotelBookings(hotel?.id, { limit: 100 });
  const { data: tasks } = useHousekeepingTasks(hotel?.id, 'pending');

  const bookings = bookingData?.results ?? [];
  const today = todayUtcKey();

  const arrivals = bookings.filter(
    b =>
      b.status === 'confirmed' &&
      toUtcDateKey(b.checkInDate) <= today &&
      today < toUtcDateKey(b.checkOutDate)
  ).length;
  const departures = bookings.filter(
    b => b.status === 'checked_in' && toUtcDateKey(b.checkOutDate) === today
  ).length;
  const awaitingPayment = bookings.filter(b => b.status === 'pending').length;
  const toClean = tasks?.length ?? 0;

  const alerts: Alert[] = [];
  if (arrivals > 0)
    alerts.push({
      id: 'arrivals',
      icon: LogIn,
      tone: 'bg-emerald-100 text-emerald-700',
      title: `${arrivals} guest${arrivals === 1 ? '' : 's'} ready to check in`,
      detail: 'Within their check-in window today.',
      to: `${ROUTES.staffFrontDesk}?bucket=checkin`,
    });
  if (departures > 0)
    alerts.push({
      id: 'departures',
      icon: LogOut,
      tone: 'bg-amber-100 text-amber-700',
      title: `${departures} departure${departures === 1 ? '' : 's'} today`,
      detail: 'In-house guests due to check out.',
      to: `${ROUTES.staffFrontDesk}?bucket=departure`,
    });
  if (awaitingPayment > 0)
    alerts.push({
      id: 'payment',
      icon: Clock,
      tone: 'bg-rose-100 text-rose-700',
      title: `${awaitingPayment} booking${awaitingPayment === 1 ? '' : 's'} awaiting payment`,
      detail: 'Not confirmed until payment clears.',
      to: `${ROUTES.staffFrontDesk}?bucket=pending`,
    });
  if (toClean > 0)
    alerts.push({
      id: 'housekeeping',
      icon: Sparkles,
      tone: 'bg-blue-100 text-blue-700',
      title: `${toClean} room${toClean === 1 ? '' : 's'} to clean`,
      detail: 'Housekeeping tasks still pending.',
      to: ROUTES.staffHousekeeping,
    });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="relative inline-flex size-8 items-center justify-center rounded-full border border-outline-variant/40 outline-none hover:bg-surface-container-low data-[state=open]:bg-surface-container-low"
        aria-label={`Notifications${alerts.length ? ` (${alerts.length} unread)` : ''}`}
      >
        <Bell className="size-3.5" />
        {alerts.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white">
            {alerts.length}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="border-b border-slate-100 px-3 py-2.5">
          <p className="text-sm font-semibold text-slate-900">Notifications</p>
          <p className="text-xs text-slate-400">{hotel?.name}</p>
        </div>

        {alerts.length === 0 ? (
          <div className="flex flex-col items-center gap-1.5 px-3 py-8 text-center">
            <CheckCircle2 className="size-6 text-emerald-500" />
            <p className="text-sm font-medium text-slate-700">All caught up</p>
            <p className="text-xs text-slate-400">
              No arrivals, departures or cleaning tasks need attention.
            </p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto py-1">
            {alerts.map(alert => {
              const Icon = alert.icon;
              return (
                <button
                  key={alert.id}
                  type="button"
                  onClick={() => navigate(alert.to)}
                  className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left hover:bg-slate-50"
                >
                  <span
                    className={cn(
                      'flex size-7 shrink-0 items-center justify-center rounded-md',
                      alert.tone
                    )}
                  >
                    <Icon className="size-3.5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-medium text-slate-900">
                      {alert.title}
                    </span>
                    <span className="block text-[11px] text-slate-400">{alert.detail}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
