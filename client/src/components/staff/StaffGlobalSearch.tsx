import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { useNavigate } from 'react-router';
import { Search, BedDouble, Ticket, User as UserIcon, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';
import { useHotelBookings, useHotelRooms } from '@/hooks/staff';
import { useStaffHotelStore } from '@/stores/staffHotelStore';
import { ROUTES } from '@/constants/routes';
import { formatDate } from '@/utils/formatDate';

const MIN_QUERY = 2;
const PER_GROUP = 5;

interface Hit {
  id: string;
  group: 'Bookings' | 'Rooms' | 'Guests';
  icon: ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  to: string;
}

/**
 * Global staff search over the active hotel: booking codes, guests and rooms.
 * Everything is matched against the lists already cached by the operational pages,
 * so opening the dropdown costs no extra request.
 */
export function StaffGlobalSearch() {
  const navigate = useNavigate();
  const hotel = useStaffHotelStore(state => state.hotel);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: bookingData } = useHotelBookings(hotel?.id, { limit: 100 });
  const { data: roomData } = useHotelRooms(hotel?.id);

  const q = query.trim().toLowerCase();
  const enabled = q.length >= MIN_QUERY;

  const hits = useMemo<Hit[]>(() => {
    if (!enabled) return [];
    const bookings = bookingData?.results ?? [];
    const rooms = roomData ?? [];

    const bookingHits: Hit[] = bookings
      .filter(b => b.bookingCode.toLowerCase().includes(q))
      .slice(0, PER_GROUP)
      .map(b => ({
        id: `booking-${b.id}`,
        group: 'Bookings',
        icon: Ticket,
        title: b.bookingCode,
        subtitle: `${b.customer.fullName} · ${formatDate(b.checkInDate)} → ${formatDate(b.checkOutDate)}`,
        to: ROUTES.staffBookingDetail(b.id),
      }));

    // One row per guest (their most recent booking is the one worth opening).
    const seenGuests = new Set<string>();
    const guestHits: Hit[] = bookings
      .filter(
        b =>
          b.customer.fullName.toLowerCase().includes(q) ||
          b.customer.email.toLowerCase().includes(q) ||
          (b.customer.phone ?? '').toLowerCase().includes(q)
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .filter(b => {
        if (seenGuests.has(b.customerId)) return false;
        seenGuests.add(b.customerId);
        return true;
      })
      .slice(0, PER_GROUP)
      .map(b => ({
        id: `guest-${b.customerId}`,
        group: 'Guests',
        icon: UserIcon,
        title: b.customer.fullName,
        subtitle: `${b.customer.email} · latest booking ${b.bookingCode}`,
        to: ROUTES.staffBookingDetail(b.id),
      }));

    const roomHits: Hit[] = rooms
      .filter(
        r =>
          r.roomNumber.toLowerCase().includes(q) ||
          r.roomType.name.toLowerCase().includes(q)
      )
      .slice(0, PER_GROUP)
      .map(r => ({
        id: `room-${r.id}`,
        group: 'Rooms',
        icon: BedDouble,
        title: `Room ${r.roomNumber}`,
        subtitle: `${r.roomType.name} · ${r.status}`,
        // Bản đồ phòng nay nằm trong lịch tồn kho — mở ở ngày hôm nay và làm nổi đúng phòng.
        to: `${ROUTES.staffInventory}?room=${encodeURIComponent(r.roomNumber)}`,
      }));

    return [...bookingHits, ...guestHits, ...roomHits];
  }, [enabled, q, bookingData, roomData]);

  // Close when clicking outside the search box.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const go = (hit: Hit) => {
    setOpen(false);
    setQuery('');
    navigate(hit.to);
  };

  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!hits.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor(c => (c + 1) % hits.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor(c => (c - 1 + hits.length) % hits.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(hits[cursor]);
    }
  };

  // Render each group header once, in the order the hits were built.
  let lastGroup: Hit['group'] | null = null;

  return (
    <div ref={rootRef} className="relative w-full max-w-125">
      <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        className="h-8 w-full rounded-sm bg-white-container-low pr-8 pl-8 text-xs"
        placeholder="Search bookings, rooms, guests..."
        value={query}
        onChange={e => {
          setQuery(e.target.value);
          setOpen(true);
          // New query → highlight the first hit again.
          setCursor(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-expanded={open && enabled}
        aria-controls="staff-search-results"
        aria-label="Search bookings, rooms and guests"
      />
      {query && (
        <button
          type="button"
          onClick={() => {
            setQuery('');
            inputRef.current?.focus();
          }}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600"
          aria-label="Clear search"
        >
          <X className="size-3.5" />
        </button>
      )}

      {open && enabled && (
        <div
          id="staff-search-results"
          role="listbox"
          className="absolute top-full right-0 left-0 z-50 mt-1.5 max-h-96 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {hits.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-slate-400">
              No results for “{query.trim()}”
            </p>
          ) : (
            hits.map((hit, i) => {
              const Icon = hit.icon;
              const showHeader = hit.group !== lastGroup;
              lastGroup = hit.group;
              return (
                <div key={hit.id}>
                  {showHeader && (
                    <p className="px-3 pt-2 pb-1 text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
                      {hit.group}
                    </p>
                  )}
                  <button
                    type="button"
                    role="option"
                    aria-selected={i === cursor}
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => go(hit)}
                    className={cn(
                      'flex w-full items-center gap-2.5 px-3 py-2 text-left',
                      i === cursor ? 'bg-slate-100' : 'hover:bg-slate-50'
                    )}
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                      <Icon className="size-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium text-slate-900">
                        {hit.title}
                      </span>
                      <span className="block truncate text-[11px] text-slate-400">
                        {hit.subtitle}
                      </span>
                    </span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
