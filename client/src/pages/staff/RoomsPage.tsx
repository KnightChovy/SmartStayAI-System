import { useState, type ComponentType } from 'react';
import {
  DoorOpen,
  BedDouble,
  Sparkles,
  Wrench,
  AlertTriangle,
  ChevronDown,
  Check,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useHotelRooms, useUpdateRoomStatus } from '@/hooks/staff';
import { useStaffHotelStore } from '@/stores/staffHotelStore';
import type { RoomStatus, StaffRoom } from '@/types/staff.types';
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
    label: 'Trống',
    icon: DoorOpen,
    dot: 'bg-emerald-500',
    tile: 'border-emerald-200 bg-emerald-50/60 hover:border-emerald-300',
    iconBox: 'bg-emerald-100 text-emerald-700',
    chipActive: 'bg-emerald-600 text-white',
  },
  occupied: {
    label: 'Đang ở',
    icon: BedDouble,
    dot: 'bg-blue-500',
    tile: 'border-blue-200 bg-blue-50/60 hover:border-blue-300',
    iconBox: 'bg-blue-100 text-blue-700',
    chipActive: 'bg-blue-600 text-white',
  },
  cleaning: {
    label: 'Đang dọn',
    icon: Sparkles,
    dot: 'bg-amber-500',
    tile: 'border-amber-200 bg-amber-50/60 hover:border-amber-300',
    iconBox: 'bg-amber-100 text-amber-700',
    chipActive: 'bg-amber-500 text-white',
  },
  maintenance: {
    label: 'Bảo trì',
    icon: Wrench,
    dot: 'bg-slate-500',
    tile: 'border-slate-200 bg-slate-50 hover:border-slate-300',
    iconBox: 'bg-slate-200 text-slate-700',
    chipActive: 'bg-slate-700 text-white',
  },
};

const STATUS_ORDER: RoomStatus[] = ['available', 'occupied', 'cleaning', 'maintenance'];

export default function RoomsPage() {
  const hotel = useStaffHotelStore(state => state.hotel);
  const { data: rooms, isLoading, isError, error } = useHotelRooms(hotel?.id);
  const updateStatus = useUpdateRoomStatus(hotel?.id);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<RoomStatus | 'all'>('all');

  const allRooms = rooms ?? [];
  const counts = STATUS_ORDER.reduce<Record<RoomStatus, number>>(
    (acc, s) => {
      acc[s] = allRooms.filter(r => r.status === s).length;
      return acc;
    },
    { available: 0, occupied: 0, cleaning: 0, maintenance: 0 }
  );

  const visibleRooms = filter === 'all' ? allRooms : allRooms.filter(r => r.status === filter);

  const handleChange = async (room: StaffRoom, status: RoomStatus) => {
    if (status === room.status) return;
    setActionError(null);
    setPendingId(room.id);
    try {
      await updateStatus.mutateAsync({ roomId: room.id, status });
    } catch (err) {
      setActionError(errorMessage(err, 'Không đổi được trạng thái phòng.'));
    } finally {
      setPendingId(null);
    }
  };

  // Nhóm phòng theo tầng
  const byFloor = visibleRooms.reduce<Record<number, StaffRoom[]>>((acc, room) => {
    (acc[room.floor] ??= []).push(room);
    return acc;
  }, {});
  const floors = Object.keys(byFloor)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Bản đồ phòng</h1>
          <p className="text-sm text-slate-500">
            {allRooms.length} phòng · {hotel?.name}
          </p>
        </div>
      </div>

      {/* Thanh tổng quan + bộ lọc theo trạng thái */}
      <div className="flex flex-wrap gap-2">
        <FilterChip
          label="Tất cả"
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

      {actionError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {actionError}
        </div>
      )}
      {isError && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          {errorMessage(error, 'Không tải được danh sách phòng.')}
        </div>
      )}
      {isLoading && <RoomsSkeleton />}

      {!isLoading && !isError && floors.length === 0 && (
        <p className="py-12 text-center text-sm text-slate-400">Không có phòng nào phù hợp.</p>
      )}

      {!isLoading &&
        !isError &&
        floors.map(floor => (
          <section key={floor} className="space-y-2.5">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-700">Tầng {floor}</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                {byFloor[floor].length} phòng
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {byFloor[floor].map(room => (
                <RoomTile
                  key={room.id}
                  room={room}
                  pending={pendingId === room.id}
                  onChange={handleChange}
                />
              ))}
            </div>
          </section>
        ))}
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
  onChange,
}: {
  room: StaffRoom;
  pending: boolean;
  onChange: (room: StaffRoom, status: RoomStatus) => void;
}) {
  const meta = STATUS_META[room.status];
  const Icon = meta.icon;

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-xl border p-3 transition-all',
        meta.tile,
        pending && 'opacity-60'
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
      <p className="mb-3 truncate text-xs text-slate-500" title={room.roomType.name}>
        {room.roomType.name}
      </p>

      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={pending}
          className="mt-auto inline-flex h-8 w-full items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white/80 text-xs font-medium text-slate-600 transition-colors hover:bg-white hover:text-slate-900 disabled:opacity-50"
        >
          Đổi trạng thái <ChevronDown className="size-3.5" />
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
