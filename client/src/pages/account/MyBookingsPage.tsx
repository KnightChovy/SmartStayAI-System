import { useMemo, useState } from 'react';
import { CalendarCheck } from 'lucide-react';
import { useMyBookings } from '@/hooks/bookings';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/cn';
import BookingListItem from '@/components/account/BookingListItem';
import EmptyState from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import type { Booking } from '@/types/booking.types';

type Tab = 'upcoming' | 'past';

/** Trạng thái coi là "sắp tới" (chưa trả phòng / chưa hủy). */
const UPCOMING_STATUSES = new Set(['pending', 'confirmed', 'checked_in']);

export default function MyBookingsPage() {
  const [tab, setTab] = useState<Tab>('upcoming');
  const { data, isLoading, isError } = useMyBookings({ limit: 100 });

  const { upcoming, past } = useMemo(() => {
    const all = data?.results ?? [];
    const up: Booking[] = [];
    const pa: Booking[] = [];
    all.forEach(b => (UPCOMING_STATUSES.has(b.status) ? up.push(b) : pa.push(b)));
    return { upcoming: up, past: pa };
  }, [data]);

  const list = tab === 'upcoming' ? upcoming : past;

  return (
    <div>
      <h2 className="font-be-vietnam text-2xl font-bold text-on-surface">My bookings</h2>

      {/* Tabs */}
      <div className="mt-5 inline-flex rounded-xl bg-surface-container-low p-1">
        {(['upcoming', 'past'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-semibold capitalize transition-colors',
              tab === t ? 'bg-surface text-on-surface shadow-sm' : 'text-on-surface-variant'
            )}
          >
            {t} ({t === 'upcoming' ? upcoming.length : past.length})
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)
        ) : isError ? (
          <EmptyState title="Couldn't load bookings" description="Please try again in a moment." />
        ) : list.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title={tab === 'upcoming' ? 'No upcoming stays' : 'No past stays yet'}
            description="When you book a stay, it will appear here."
            action={
              <Button className="bg-on-surface text-white hover:bg-primary" asChild>
                <a href={ROUTES.search}>Find a stay</a>
              </Button>
            }
          />
        ) : (
          list.map(b => <BookingListItem key={b.id} booking={b} />)
        )}
      </div>
    </div>
  );
}
