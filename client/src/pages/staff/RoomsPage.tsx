import { useMemo, useState, type ComponentType } from 'react';
import { Link, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import {
  DoorOpen,
  BedDouble,
  Sparkles,
  Wrench,
  AlertTriangle,
  ChevronDown,
  Check,
  Loader2,
  UserRound,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useHotelRooms, useHotelBookings, useUpdateRoomStatus } from '@/hooks/staff';
import { useStaffHotelStore } from '@/stores/staffHotelStore';
import { ConfirmDialog } from '@/components/hotel-partner/shared/ConfirmDialog';
import type { RoomStatus, StaffRoom } from '@/types/staff.types';
import { ROUTES } from '@/constants/routes';
import { formatDate } from '@/utils/formatDate';
import { errorMessage } from '@/utils/errorMessage';

interface StatusMeta {
  label: string;
  icon: ComponentType<{ className?: string }>;
  dot: string;
  tile: string;
  iconBox: string;
  chipActive: string;
}

const STATUS_META: Record<RoomStatus, StatusMeta> = {
  available: {
    label: 'Available',
    icon: DoorOpen,
    dot: 'bg-emerald-500',
    tile: 'border-emerald-200 bg-emerald-50/60 hover:border-emerald-300',
    iconBox: 'bg-emerald-100 text-emerald-700',
    chipActive: 'bg-emerald-600 text-white',
  },
  occupied: {
    label: 'Occupied',
    icon: BedDouble,
    dot: 'bg-blue-500',
    tile: 'border-blue-200 bg-blue-50/60 hover:border-blue-300',
    iconBox: 'bg-blue-100 text-blue-700',
    chipActive: 'bg-blue-600 text-white',
  },
  cleaning: {
    label: 'Cleaning',
    icon: Sparkles,
    dot: 'bg-amber-500',
    tile: 'border-amber-200 bg-amber-50/60 hover:border-amber-300',
    iconBox: 'bg-amber-100 text-amber-700',
    chipActive: 'bg-amber-500 text-white',
  },
  maintenance: {
    label: 'Maintenance',
    icon: Wrench,
    dot: 'bg-slate-500',
    tile: 'border-slate-200 bg-slate-50 hover:border-slate-300',
    iconBox: 'bg-slate-200 text-slate-700',
    chipActive: 'bg-slate-700 text-white',
  },
};

const STATUS_ORDER: RoomStatus[] = ['available', 'occupied', 'cleaning', 'maintenance'];

/** Changing to these leaves the room unsellable, so they get a confirmation step. */
const SENSITIVE: RoomStatus[] = ['maintenance', 'occupied'];

/** The guest currently in a room, joined from the in-house bookings. */
interface RoomGuest {
  bookingId: string;
  name: string;
  checkOutDate: string;
}

export default function RoomsPage() {
  const hotel = useStaffHotelStore(state => state.hotel);
  const { data: rooms, isLoading, isError, error } = useHotelRooms(hotel?.id);
  const { data: bookingData } = useHotelBookings(hotel?.id, { limit: 100 });
  const updateStatus = useUpdateRoomStatus(hotel?.id);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<RoomStatus | 'all'>('all');
  const [confirm, setConfirm] = useState<{ room: StaffRoom; status: RoomStatus } | null>(
    null
  );
  // Set by the global search ("Room 101") so the tile can be pointed out on arrival.
  const [params] = useSearchParams();
  const highlightRoom = params.get('room');

  const allRooms = rooms ?? [];

  // Who is in each room right now — the booking list already carries its assigned rooms.
  const guestByRoomId = useMemo(() => {
    const map = new Map<string, RoomGuest>();
    for (const b of bookingData?.results ?? []) {
      if (b.status !== 'checked_in') continue;
      for (const link of b.bookingRooms) {
        map.set(link.roomId, {
          bookingId: b.id,
          name: b.customer.fullName,
          checkOutDate: b.checkOutDate,
        });
      }
    }
    return map;
  }, [bookingData]);
  const counts = STATUS_ORDER.reduce<Record<RoomStatus, number>>(
    (acc, s) => {
      acc[s] = allRooms.filter(r => r.status === s).length;
      return acc;
    },
    { available: 0, occupied: 0, cleaning: 0, maintenance: 0 }
  );

  const visibleRooms = filter === 'all' ? allRooms : allRooms.filter(r => r.status === filter);

  const applyChange = async (room: StaffRoom, status: RoomStatus) => {
    setPendingId(room.id);
    try {
      await updateStatus.mutateAsync({ roomId: room.id, status });
      toast.success(`Room ${room.roomNumber} set to ${STATUS_META[status].label}.`);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not change room status.'));
    } finally {
      setPendingId(null);
    }
  };

  /** Sensitive statuses confirm first; the rest apply straight away. */
  const requestChange = (room: StaffRoom, status: RoomStatus) => {
    if (status === room.status) return;
    if (SENSITIVE.includes(status)) setConfirm({ room, status });
    else void applyChange(room, status);
  };

  // Group rooms by floor, natural-sorted within each floor so "Deluxe-2" precedes "Deluxe-10".
  const byFloor = new Map<number | null, StaffRoom[]>();
  for (const room of visibleRooms) {
    const list = byFloor.get(room.floor);
    if (list) list.push(room);
    else byFloor.set(room.floor, [room]);
  }
  for (const list of byFloor.values()) {
    list.sort((a, b) =>
      a.roomNumber.localeCompare(b.roomNumber, undefined, {
        numeric: true,
        sensitivity: 'base',
      })
    );
  }
  // Rooms with no floor recorded sort last.
  const floors = [...byFloor.keys()].sort(
    (a, b) => (a ?? Number.MAX_SAFE_INTEGER) - (b ?? Number.MAX_SAFE_INTEGER)
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Room map</h1>
          <p className="text-sm text-slate-500">
            {allRooms.length} rooms · {hotel?.name}
          </p>
        </div>

        {/* Always-on colour legend so a tile's dot can be read without clicking. */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {STATUS_ORDER.map(s => (
            <span key={s} className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className={cn('size-2 rounded-full', STATUS_META[s].dot)} />
              {STATUS_META[s].label}
            </span>
          ))}
        </div>
      </div>

      {/* Overview bar + status filters */}
      <div className="flex flex-wrap gap-2">
        <FilterChip
          label="All"
          count={allRooms.length}
          active={filter === 'all'}
          activeClass="bg-slate-900 text-white"
          onClick={() => setFilter('all')}
        />
        {STATUS_ORDER.map(s => {
          const meta = STATUS_META[s];
          return (
            <FilterChip
              key={s}
              label={meta.label}
              count={counts[s]}
              dot={meta.dot}
              active={filter === s}
              activeClass={meta.chipActive}
              onClick={() => setFilter(filter === s ? 'all' : s)}
            />
          );
        })}
      </div>

      {isError && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          {errorMessage(error, 'Could not load rooms.')}
        </div>
      )}
      {isLoading && <RoomsSkeleton />}

      {!isLoading && !isError && floors.length === 0 && (
        <p className="py-12 text-center text-sm text-slate-400">No matching rooms.</p>
      )}

      {!isLoading &&
        !isError &&
        floors.map(floor => {
          const floorRooms = byFloor.get(floor) ?? [];
          return (
            <section key={floor ?? 'unknown'} className="space-y-2.5">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-700">
                  {floor == null ? 'Floor not set' : `Floor ${floor}`}
                </h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                  {floorRooms.length} room{floorRooms.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {floorRooms.map(room => (
                  <RoomTile
                    key={room.id}
                    room={room}
                    pending={pendingId === room.id}
                    highlighted={room.roomNumber === highlightRoom}
                    guest={guestByRoomId.get(room.id)}
                    onChange={requestChange}
                  />
                ))}
              </div>
            </section>
          );
        })}

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          if (!confirm) return;
          const { room, status } = confirm;
          setConfirm(null);
          await applyChange(room, status);
        }}
        loading={updateStatus.isPending}
        destructive={confirm?.status === 'maintenance'}
        title={
          confirm
            ? `Set room ${confirm.room.roomNumber} to ${STATUS_META[confirm.status].label}?`
            : ''
        }
        confirmLabel={confirm ? STATUS_META[confirm.status].label : 'Confirm'}
        message={
          confirm?.status === 'maintenance'
            ? `Room ${confirm.room.roomNumber} will stop being offered to guests until you set it back to Available.`
            : confirm
              ? `Room ${confirm.room.roomNumber} will be marked as occupied. Normally check-in does this automatically — only set it by hand if the room map is out of sync.`
              : ''
        }
      />
    </div>
  );
}

function FilterChip({
  label,
  count,
  dot,
  active,
  activeClass,
  onClick,
}: {
  label: string;
  count: number;
  dot?: string;
  active: boolean;
  activeClass: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
        active ? activeClass : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
      )}
    >
      {dot && <span className={cn('size-2 rounded-full', active ? 'bg-white/80' : dot)} />}
      {label}
      <span
        className={cn(
          'rounded-full px-1.5 text-[11px] font-semibold tabular-nums',
          active ? 'bg-white/20' : 'bg-slate-100 text-slate-500'
        )}
      >
        {count}
      </span>
    </button>
  );
}

function RoomTile({
  room,
  pending,
  highlighted,
  guest,
  onChange,
}: {
  room: StaffRoom;
  pending: boolean;
  highlighted?: boolean;
  guest?: RoomGuest;
  onChange: (room: StaffRoom, status: RoomStatus) => void;
}) {
  const meta = STATUS_META[room.status];
  const Icon = meta.icon;

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-xl border p-3 transition-all',
        meta.tile,
        pending && 'opacity-60',
        highlighted && 'ring-2 ring-slate-900 ring-offset-2'
      )}
    >
      <div className="mb-2 flex items-start justify-between">
        <div className={cn('flex size-9 items-center justify-center rounded-lg', meta.iconBox)}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-5" />}
        </div>
        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <span className={cn('size-2 rounded-full', meta.dot)} />
          {meta.label}
        </span>
      </div>

      <p className="text-lg leading-tight font-semibold text-slate-900">{room.roomNumber}</p>
      <p className="truncate text-xs text-slate-500" title={room.roomType.name}>
        {room.roomType.name}
      </p>

      {/* Who's in the room matters most when it's occupied — link straight to their booking. */}
      {guest ? (
        <Link
          to={ROUTES.staffBookingDetail(guest.bookingId)}
          className="mt-2 mb-3 block rounded-lg bg-white/70 px-2 py-1.5 hover:bg-white"
        >
          <span className="flex items-center gap-1 truncate text-xs font-medium text-slate-700">
            <UserRound className="size-3 shrink-0 text-slate-400" />
            <span className="truncate">{guest.name}</span>
          </span>
          <span className="mt-0.5 block text-[11px] text-slate-500">
            Out {formatDate(guest.checkOutDate)}
          </span>
        </Link>
      ) : (
        <div className="mb-3" />
      )}

      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={pending}
          className="mt-auto inline-flex h-8 w-full items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white/80 text-xs font-medium text-slate-600 transition-colors hover:bg-white hover:text-slate-900 disabled:opacity-50"
        >
          Change status <ChevronDown className="size-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {STATUS_ORDER.map(s => {
            const m = STATUS_META[s];
            const ItemIcon = m.icon;
            const current = s === room.status;
            return (
              <DropdownMenuItem
                key={s}
                onClick={() => onChange(room, s)}
                disabled={current}
                className="gap-2"
              >
                <span className={cn('flex size-5 items-center justify-center rounded', m.iconBox)}>
                  <ItemIcon className="size-3" />
                </span>
                <span className="flex-1">{m.label}</span>
                {current && <Check className="size-3.5 text-slate-400" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function RoomsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="h-33 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
      ))}
    </div>
  );
}
