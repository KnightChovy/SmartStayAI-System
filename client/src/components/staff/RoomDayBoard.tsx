import { useMemo, useState, type ComponentType } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import {
  AlertTriangle,
  BedDouble,
  CalendarOff,
  Check,
  ChevronDown,
  DoorOpen,
  Loader2,
  Sparkles,
  UserRound,
  Wrench,
  X,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/hotel-partner/shared/ConfirmDialog';
import {
  useAssignRoom,
  useReleaseAssignedRoom,
  useResolveRoomBlock,
  useUpdateHousekeeping,
} from '@/hooks/staff';
import type {
  BookingStatus,
  HkStatus,
  HotelBooking,
  InventoryDayCell,
  RoomBlockListItem,
  RoomBlockType,
  RoomDayEntry,
  RoomDayState,
  StaffRoom,
} from '@/types/staff.types';
import { ROUTES } from '@/constants/routes';
import { errorMessage } from '@/utils/errorMessage';
import { formatDate } from '@/utils/formatDate';
import {
  applyProvisionalHolds,
  buildRoomDayView,
  occupiesInventory,
} from '@/utils/inventoryCalendar';
import { toUtcDateKey } from '@/utils/formatDate';
import { BlockRoomModal } from './BlockRoomModal';

interface StateMeta {
  label: string;
  icon: ComponentType<{ className?: string }>;
  dot: string;
  tile: string;
  iconBox: string;
  chipActive: string;
}

/**
 * Nhãn + màu giữ ĐÚNG như room map cũ (`available/occupied/cleaning/maintenance`) để lễ tân không
 * phải học lại. `out_of_service` là nhãn thứ 5 tách ra từ `maintenance` của BE — cùng là đợt chặn
 * nhưng KHÔNG rút phòng khỏi kho bán, gộp chung sẽ khiến số trên lịch trông như đếm sai.
 */
const STATE_META: Record<RoomDayState, StateMeta> = {
  available: {
    label: 'Available',
    icon: DoorOpen,
    dot: 'bg-emerald-500',
    tile: 'border-emerald-200 bg-emerald-50/60',
    iconBox: 'bg-emerald-100 text-emerald-700',
    chipActive: 'bg-emerald-600 text-white',
  },
  held: {
    label: 'Held',
    icon: UserRound,
    dot: 'bg-sky-500',
    tile: 'border-sky-300 border-dashed bg-sky-50/60',
    iconBox: 'bg-sky-100 text-sky-700',
    chipActive: 'bg-sky-600 text-white',
  },
  occupied: {
    label: 'Occupied',
    icon: BedDouble,
    dot: 'bg-blue-500',
    tile: 'border-blue-200 bg-blue-50/60',
    iconBox: 'bg-blue-100 text-blue-700',
    chipActive: 'bg-blue-600 text-white',
  },
  cleaning: {
    label: 'Cleaning',
    icon: Sparkles,
    dot: 'bg-amber-500',
    tile: 'border-amber-200 bg-amber-50/60',
    iconBox: 'bg-amber-100 text-amber-700',
    chipActive: 'bg-amber-500 text-white',
  },
  maintenance: {
    label: 'Maintenance',
    icon: Wrench,
    dot: 'bg-slate-500',
    tile: 'border-slate-300 bg-slate-50',
    iconBox: 'bg-slate-200 text-slate-700',
    chipActive: 'bg-slate-700 text-white',
  },
  out_of_service: {
    label: 'Out of service',
    icon: CalendarOff,
    dot: 'bg-orange-400',
    tile: 'border-orange-200 bg-orange-50/60',
    iconBox: 'bg-orange-100 text-orange-700',
    chipActive: 'bg-orange-500 text-white',
  },
};

const STATE_ORDER: RoomDayState[] = [
  'available',
  'held',
  'occupied',
  'cleaning',
  'maintenance',
  'out_of_service',
];

/** Nhãn trạng thái buồng phòng — chỉ có nghĩa với HÔM NAY, không gắn ngày. */
const HK_LABELS: Record<HkStatus, string> = {
  dirty: 'Dirty',
  cleaning: 'Cleaning',
  clean: 'Clean',
  inspected: 'Inspected',
};

const HK_ORDER: HkStatus[] = ['dirty', 'cleaning', 'clean', 'inspected'];

/** Trạng thái đơn viết cho người đọc — quan trọng nhất là phân biệt "chưa trả tiền" với "đã chắc suất". */
const STATUS_WORDS: Record<BookingStatus, string> = {
  pending: 'awaiting payment',
  confirmed: 'arriving',
  checked_in: 'in house',
  checked_out: 'checked out',
  cancelled: 'cancelled',
  no_show: 'no-show',
};

function weekdayLabel(dateKey: string): string {
  return new Date(`${dateKey}T00:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'long',
    timeZone: 'UTC',
  });
}

function dayMonthLabel(dateKey: string): string {
  const [, month, day] = dateKey.split('-');
  return `${day}/${month}`;
}

/** `dd/MM` từ một mốc ISO của BE (đợt chặn dùng cột `@db.Date`). */
function isoDayMonth(iso: string): string {
  return dayMonthLabel(iso.slice(0, 10));
}

interface RoomDayBoardProps {
  hotelId: string | undefined;
  /** Ngày đang xem (`YYYY-MM-DD`). */
  date: string;
  /** Ngày này có phải hôm nay không — quyết định có hiện phần buồng phòng hay không. */
  isToday: boolean;
  /** Nguồn của lịch tồn kho — dùng chung cache, không gọi thêm request nào. */
  rooms: StaffRoom[];
  blocks: RoomBlockListItem[];
  bookings: HotelBooking[];
  /** Ngày cuối của khung lịch đang tải — để modal chặn phòng biết đã kiểm tới đâu. */
  dataTo: string;
  /** Loại phòng đang lọc (từ ô lịch được bấm), `null` = mọi loại. */
  roomTypeId: string | null;
  roomTypeName?: string;
  /** Ô tồn kho tương ứng — để đối chiếu số phòng với số đơn (kể cả đơn chưa gán phòng). */
  cell?: InventoryDayCell;
  /** Số phòng cần làm nổi (điều hướng từ ô tìm kiếm toàn cục). */
  highlightRoom?: string | null;
  onClearRoomType: () => void;
  onClose: () => void;
}

/**
 * Bản đồ phòng **của một ngày cụ thể** — thay cho trang Room map cũ (chỉ nói được hôm nay).
 *
 * Hai thao tác ở đây khác nhau về bản chất, nên cố ý tách bạch trên giao diện:
 * - **Chặn phòng** gắn với khoảng ngày ⇒ đổi đúng ngày đang xem, không đụng ngày khác.
 * - **Buồng phòng** (dirty/cleaning/clean) là tình trạng lúc này ⇒ chỉ hiện khi đang xem hôm nay,
 *   kèm chú thích để không ai tưởng mình đang đặt lịch dọn cho tuần sau.
 */
export function RoomDayBoard({
  hotelId,
  date,
  isToday,
  rooms,
  blocks,
  bookings,
  dataTo,
  roomTypeId,
  roomTypeName,
  cell,
  highlightRoom,
  onClearRoomType,
  onClose,
}: RoomDayBoardProps) {
  const [filter, setFilter] = useState<RoomDayState | 'all'>('all');
  const [blockTarget, setBlockTarget] = useState<{
    room: StaffRoom;
    blockType: RoomBlockType;
    /** Có giá trị ⇒ sửa đợt đang mở (gia hạn/rút ngắn) thay vì tạo đợt mới. */
    block?: RoomBlockListItem;
  } | null>(null);
  const [unblockTarget, setUnblockTarget] = useState<{
    room: StaffRoom;
    block: RoomBlockListItem;
  } | null>(null);
  const [releaseTarget, setReleaseTarget] = useState<{
    room: StaffRoom;
    booking: HotelBooking;
  } | null>(null);
  const [pendingRoomId, setPendingRoomId] = useState<string | null>(null);

  const resolveBlock = useResolveRoomBlock(hotelId);
  const updateHk = useUpdateHousekeeping(hotelId);
  const assignRoom = useAssignRoom(hotelId);
  const releaseRoom = useReleaseAssignedRoom(hotelId);

  const factualEntries: RoomDayEntry[] = useMemo(() => {
    // `includeHousekeeping` chỉ bật cho hôm nay ⇒ ngày tương lai không bao giờ có ô "Cleaning",
    // đúng bản chất: không ai biết trước tuần sau phòng có bẩn hay không.
    const all = buildRoomDayView({
      rooms,
      blocks,
      bookings,
      date,
      includeHousekeeping: isToday,
    });
    return roomTypeId ? all.filter(entry => entry.room.roomTypeId === roomTypeId) : all;
  }, [rooms, blocks, bookings, date, isToday, roomTypeId]);

  /**
   * Đơn chiếm đêm này nhưng **chưa được gán phòng nào** — khách đã đặt, chỉ chưa check-in nên BE
   * chưa chọn phòng vật lý. Đây chính là phần chênh giữa "10 phòng đang trống" và "9 phòng phát
   * ra được".
   */
  const unassignedBookings = useMemo(
    () =>
      bookings.filter(booking => {
        if (!occupiesInventory(booking)) return false;
        if (roomTypeId && booking.roomTypeId !== roomTypeId) return false;
        if (booking.bookingRooms.length > 0) return false;
        const checkIn = toUtcDateKey(booking.checkInDate);
        const checkOut = toUtcDateKey(booking.checkOutDate);
        return Boolean(checkIn && checkOut && date >= checkIn && date < checkOut);
      }),
    [bookings, roomTypeId, date]
  );

  // Xếp TẠM mỗi đơn đó vào một phòng trống cùng loại ⇒ phòng ấy rời khỏi nhóm xanh "Available".
  // Là phỏng đoán của FE (BE chỉ chọn phòng lúc check-in) nên ô được đánh dấu "Held · provisional".
  const { entries, unplacedHolds } = useMemo(() => {
    const result = applyProvisionalHolds({
      entries: factualEntries,
      bookings: unassignedBookings,
    });
    return { entries: result.entries, unplacedHolds: result.unplaced };
  }, [factualEntries, unassignedBookings]);

  // Phòng `isActive = false` không được tính là "Available" ở đây — state thô của
  // `buildRoomDayView` vẫn ra 'available' cho nó (không block, không khách), nhưng nó đã bị rút
  // khỏi biên chế nên KHÔNG THỂ phát cho khách. Trước đây bucket này đếm theo state thô ⇒ chip
  // "Available" đếm dư đúng những phòng đã nghỉ bán, lệch với "Free to give out" bên dưới (dòng
  // đó đã lọc `isActive` từ trước) — cùng một khách sạn, hai con số available khác nhau ngay
  // trên một màn hình.
  const isCountableAvailable = (entry: RoomDayEntry) =>
    entry.state !== 'available' || entry.room.isActive;

  const counts = STATE_ORDER.reduce<Record<RoomDayState, number>>(
    (acc, state) => {
      acc[state] = entries.filter(
        entry => entry.state === state && isCountableAvailable(entry)
      ).length;
      return acc;
    },
    { available: 0, held: 0, occupied: 0, cleaning: 0, maintenance: 0, out_of_service: 0 }
  );

  // Cùng lý do: bấm chip "Available" thì danh sách hiện ra phải khớp đúng số trên chip — không
  // thể chip ghi 3 mà bấm vào lại thấy 4 ô. Phòng đã nghỉ bán vẫn xem được bình thường qua "All".
  const visible =
    filter === 'all'
      ? entries
      : entries.filter(e => e.state === filter && isCountableAvailable(e));

  // Nhóm theo tầng, trong tầng sắp theo số phòng tự nhiên ("Deluxe-2" trước "Deluxe-10").
  const floors = useMemo(() => {
    const byFloor = new Map<number | null, RoomDayEntry[]>();
    for (const entry of visible) {
      const list = byFloor.get(entry.room.floor);
      if (list) list.push(entry);
      else byFloor.set(entry.room.floor, [entry]);
    }
    for (const list of byFloor.values()) {
      list.sort((a, b) =>
        a.room.roomNumber.localeCompare(b.room.roomNumber, undefined, {
          numeric: true,
          sensitivity: 'base',
        })
      );
    }
    // Phòng chưa ghi tầng xếp cuối.
    return [...byFloor.keys()]
      .sort((a, b) => (a ?? Number.MAX_SAFE_INTEGER) - (b ?? Number.MAX_SAFE_INTEGER))
      .map(floor => ({ floor, rooms: byFloor.get(floor) ?? [] }));
  }, [visible]);

  // Đếm theo đơn ĐÃ CÓ PHÒNG THẬT chứ không theo `state`: phòng vừa có khách vừa dính đợt chặn
  // được xếp nhãn Maintenance (theo đúng thứ tự của BE) nhưng vẫn là một đơn đã có phòng, và đơn
  // chốt trước phòng (`holdKind === 'assigned'`) cũng vậy dù chưa check-in.
  const assigned = entries.filter(
    entry => entry.booking || (entry.heldBy && entry.holdKind === 'assigned')
  ).length;

  const assignedHeld = entries.filter(entry => entry.holdKind === 'assigned').length;
  const provisionalHeld = entries.filter(entry => entry.holdKind === 'provisional').length;

  // Chốt chặn: nếu số của lưới vẫn lệch sau khi đã liệt kê hết (dữ liệu ngoài khung tải, đơn gán
  // phòng của loại khác…) thì vẫn nói ra phần còn thiếu chứ không im lặng.
  const unexplained = cell
    ? Math.max(0, cell.booked - assigned - unassignedBookings.length)
    : 0;

  /**
   * Phép trừ hiện trên đầu bảng. Phòng `isActive = false` không tính vào "đang trống": nó vẫn hiện
   * một ô (để staff biết nó tồn tại) nhưng đã bị rút khỏi biên chế, phát cho khách không được.
   * Nhờ vậy phép trừ khớp đúng con số trên lịch (`sellable − booked`).
   */
  const heldForArrivals = counts.held + unplacedHolds.length;
  const freeToGiveOut = entries.filter(
    entry => entry.state === 'available' && entry.room.isActive
  ).length;
  const vacantNow = freeToGiveOut + heldForArrivals;

  const endBlock = async () => {
    if (!unblockTarget) return;
    const { room, block } = unblockTarget;
    setUnblockTarget(null);
    setPendingRoomId(room.id);
    try {
      await resolveBlock.mutateAsync({ roomId: room.id, blockId: block.id });
      toast.success(`Room ${room.roomNumber} is back on sale.`);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not end this block.'));
    } finally {
      setPendingRoomId(null);
    }
  };

  /**
   * "Available" gộp hai việc khác nhau tuỳ tình huống, đúng như staff nghĩ về nó:
   * đang bị chặn → gỡ đợt chặn (qua hộp xác nhận vì nó kết thúc cả đợt); đang bẩn/đang dọn và là
   * hôm nay → đánh dấu đã dọn xong. Không có gì để làm thì mục này đã bị disable từ trước.
   */
  const setAvailable = (entry: RoomDayEntry) => {
    if (entry.block) {
      setUnblockTarget({ room: entry.room, block: entry.block });
      return;
    }
    if (isToday) void changeHk(entry.room, 'clean');
  };

  /**
   * Biến một ô **Held dự kiến** thành phòng chốt thật (`POST .../assign-room`).
   * Sau khi gán, số phòng nói được với khách và check-in sẽ dùng đúng phòng này.
   */
  const confirmHold = async (room: StaffRoom, booking: HotelBooking) => {
    setPendingRoomId(room.id);
    try {
      await assignRoom.mutateAsync({ bookingId: booking.id, roomId: room.id });
      toast.success(`Room ${room.roomNumber} is now assigned to ${booking.customer.fullName}.`);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not assign this room.'));
    } finally {
      setPendingRoomId(null);
    }
  };

  const releaseHold = async () => {
    if (!releaseTarget) return;
    const { room, booking } = releaseTarget;
    setReleaseTarget(null);
    setPendingRoomId(room.id);
    try {
      await releaseRoom.mutateAsync({ bookingId: booking.id });
      toast.success(`Room ${room.roomNumber} released — the booking has no room picked now.`);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not release this room.'));
    } finally {
      setPendingRoomId(null);
    }
  };

  const changeHk = async (room: StaffRoom, hkStatus: HkStatus) => {
    setPendingRoomId(room.id);
    try {
      await updateHk.mutateAsync({ roomId: room.id, hkStatus });
      toast.success(`Room ${room.roomNumber} set to ${HK_LABELS[hkStatus]}.`);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not change the housekeeping status.'));
    } finally {
      setPendingRoomId(null);
    }
  };

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Rooms on {weekdayLabel(date)} {dayMonthLabel(date)}
            {isToday && (
              <span className="ml-2 rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-medium text-white">
                Today
              </span>
            )}
          </h2>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
            {roomTypeId && roomTypeName ? (
              <>
                <span>{roomTypeName}</span>
                <button
                  type="button"
                  onClick={onClearRoomType}
                  className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-200"
                >
                  Show every room type
                </button>
              </>
            ) : (
              <span>All room types</span>
            )}
          </p>

          {/*
           * Phép trừ mà lễ tân cần: 10 ô xanh bên dưới KHÔNG phải 10 phòng phát ra được, vì một
           * phần đã có chủ (đơn đã đặt, chỉ chưa chọn phòng). Bày thẳng phép tính thay vì để họ
           * đếm ô rồi hứa nhầm với khách vãng lai.
           */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
            <SummaryPill label="Vacant now" value={vacantNow} />
            <span className="text-slate-300">−</span>
            <SummaryPill label="Held for arrivals" value={heldForArrivals} tone="blue" />
            <span className="text-slate-300">=</span>
            <SummaryPill label="Free to give out" value={freeToGiveOut} tone="emerald" />
            {cell && freeToGiveOut === cell.available && (
              <span className="text-slate-400">— the number on the grid above</span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          <X className="size-3.5" /> Close
        </button>
      </div>

      {unexplained > 0 && (
        <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          {unexplained} more booking{unexplained === 1 ? '' : 's'} counted in the grid could not be
          matched to a room or to an arrival above — the booking list may be cut off for this
          period.
        </p>
      )}

      {/*
       * Khu RIÊNG cho đơn đã đặt nhưng chưa có phòng. Cố ý KHÔNG nhét vào lưới phòng bên dưới:
       * chưa check-in thì chưa phòng nào được chọn, gán bừa vào một ô là bịa dữ liệu — mà bỏ qua
       * thì lễ tân đếm 10 ô Available rồi tưởng còn 10 chỗ bán, trong khi thực tế chỉ còn 9.
       */}
      {/*
       * Chỉ còn những đơn KHÔNG xếp nổi vào phòng nào (hết phòng trống cùng loại) — đây là thiếu
       * phòng thật, không phải chuyện hiển thị, nên để tông đỏ và đứng riêng.
       */}
      {unplacedHolds.length > 0 && (
        <div className="space-y-2.5 rounded-lg border border-rose-200 bg-rose-50/60 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <AlertTriangle className="size-4 shrink-0 text-rose-600" />
            <h3 className="text-sm font-semibold text-rose-800">
              {unplacedHolds.length} booking{unplacedHolds.length === 1 ? '' : 's'} with no room
              left
            </h3>
            <span className="text-xs text-rose-700">
              Every room of this type is taken or blocked for this night — move a guest or free a
              room
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {unplacedHolds.map(booking => (
              <ArrivalCard key={booking.id} booking={booking} date={date} />
            ))}
          </div>
        </div>
      )}

      {/* Nói ra vì sao ngày tương lai không có ô "Cleaning" — thiếu dòng này trông như mất trạng thái. */}
      {!isToday && (
        <p className="text-xs text-slate-400">
          Cleaning is a right-now status, so it only shows on today. For a future date a room is
          either taken by a booking, blocked, or free.
        </p>
      )}

      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <h3 className="text-sm font-semibold text-slate-700">Rooms</h3>
        {/*
          Phân biệt rõ hai loại Held: chốt thật thì nói được số phòng với khách, còn phần FE xếp
          tạm thì chưa. Gộp làm một là hoặc giấu mất thông tin chắc chắn, hoặc hứa nhầm.
        */}
        {assignedHeld > 0 && (
          <span className="text-xs text-slate-400">
            {assignedHeld} <b>Held</b> room{assignedHeld === 1 ? '' : 's'} already assigned to an
            arrival — check-in hands over exactly that room.
          </span>
        )}
        {provisionalHeld > 0 && (
          <span className="text-xs text-slate-400">
            {provisionalHeld} more kept for arrivals with <b>no room picked yet</b> — the room shown
            is only a guess, so do not quote it to the guest until you assign it.
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip
          label="All"
          count={entries.length}
          active={filter === 'all'}
          activeClass="bg-slate-900 text-white"
          onClick={() => setFilter('all')}
        />
        {STATE_ORDER.filter(state => isToday || state !== 'cleaning').map(state => {
          const meta = STATE_META[state];
          return (
            <FilterChip
              key={state}
              label={meta.label}
              count={counts[state]}
              dot={meta.dot}
              active={filter === state}
              activeClass={meta.chipActive}
              onClick={() => setFilter(filter === state ? 'all' : state)}
            />
          );
        })}
      </div>

      {floors.length === 0 && (
        <p className="py-10 text-center text-sm text-slate-400">No matching rooms.</p>
      )}

      {floors.map(({ floor, rooms }) => (
        <div key={floor ?? 'unknown'} className="space-y-2.5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-700">
              {floor == null ? 'Floor not set' : `Floor ${floor}`}
            </h3>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
              {rooms.length} room{rooms.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rooms.map(entry => (
              <RoomDayTile
                key={entry.room.id}
                entry={entry}
                isToday={isToday}
                pending={pendingRoomId === entry.room.id}
                highlighted={entry.room.roomNumber === highlightRoom}
                onBlock={blockType => setBlockTarget({ room: entry.room, blockType })}
                onEditBlock={block =>
                  setBlockTarget({ room: entry.room, blockType: block.blockType, block })
                }
                onSetAvailable={() => setAvailable(entry)}
                onChangeHk={changeHk}
                onConfirmHold={booking => void confirmHold(entry.room, booking)}
                onReleaseHold={booking => setReleaseTarget({ room: entry.room, booking })}
              />
            ))}
          </div>
        </div>
      ))}

      <BlockRoomModal
        open={Boolean(blockTarget)}
        onClose={() => setBlockTarget(null)}
        hotelId={hotelId}
        room={blockTarget?.room ?? null}
        date={date}
        initialBlockType={blockTarget?.blockType ?? 'ooo'}
        block={blockTarget?.block ?? null}
        rooms={rooms}
        blocks={blocks}
        bookings={bookings}
        dataTo={dataTo}
      />

      <ConfirmDialog
        open={Boolean(unblockTarget)}
        onClose={() => setUnblockTarget(null)}
        onConfirm={() => void endBlock()}
        loading={resolveBlock.isPending}
        title={
          unblockTarget ? `Room ${unblockTarget.room.roomNumber} is fixed?` : ''
        }
        confirmLabel="End block"
        message={
          unblockTarget
            ? `This ends the whole block (${isoDayMonth(unblockTarget.block.startDate)} → ${isoDayMonth(
                unblockTarget.block.endDate
              )}), not just ${dayMonthLabel(date)}. The room goes back on sale for every remaining day.`
            : ''
        }
      />

      <ConfirmDialog
        open={Boolean(releaseTarget)}
        onClose={() => setReleaseTarget(null)}
        onConfirm={() => void releaseHold()}
        loading={releaseRoom.isPending}
        title={releaseTarget ? `Release room ${releaseTarget.room.roomNumber}?` : ''}
        confirmLabel="Unassign"
        message={
          releaseTarget
            ? `${releaseTarget.booking.customer.fullName} (${releaseTarget.booking.bookingCode}) keeps the booking and its place in inventory — it just goes back to having no room picked, and check-in will choose any free room of this type.`
            : ''
        }
      />
    </section>
  );
}

/** Một số trong phép trừ ở đầu bảng — số to, nhãn nhỏ, để đọc lướt ra ngay. */
function SummaryPill({
  label,
  value,
  tone = 'slate',
}: {
  label: string;
  value: number;
  tone?: 'slate' | 'blue' | 'emerald';
}) {
  const toneClass = {
    slate: 'bg-slate-100 text-slate-700',
    blue: 'bg-blue-100 text-blue-700',
    emerald: 'bg-emerald-100 text-emerald-700',
  }[tone];

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-1 ring-1 ring-slate-200">
      <span
        className={cn(
          'inline-flex min-w-5 justify-center rounded-full px-1 font-semibold tabular-nums',
          toneClass
        )}
      >
        {value}
      </span>
      <span className="text-slate-500">{label}</span>
    </span>
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
      type="button"
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

/** Một dòng trạng thái trong menu — mờ đi kèm lý do thay vì biến mất, để staff biết vì sao không bấm được. */
function StatusItem({
  state,
  current,
  disabled,
  hint,
  onSelect,
}: {
  state: RoomDayState;
  current: RoomDayState;
  disabled?: boolean;
  hint?: string;
  onSelect?: () => void;
}) {
  const meta = STATE_META[state];
  const Icon = meta.icon;
  const isCurrent = state === current;

  return (
    <DropdownMenuItem
      onClick={onSelect}
      disabled={disabled}
      className="flex-col items-start gap-0.5"
    >
      <span className="flex w-full items-center gap-2">
        <span className={cn('flex size-5 items-center justify-center rounded', meta.iconBox)}>
          <Icon className="size-3" />
        </span>
        <span className="flex-1">{meta.label}</span>
        {isCurrent && <Check className="size-3.5 text-slate-400" />}
      </span>
      {hint && <span className="pl-7 text-[11px] leading-snug text-slate-400">{hint}</span>}
    </DropdownMenuItem>
  );
}

function RoomDayTile({
  entry,
  isToday,
  pending,
  highlighted,
  onBlock,
  onEditBlock,
  onSetAvailable,
  onChangeHk,
  onConfirmHold,
  onReleaseHold,
}: {
  entry: RoomDayEntry;
  isToday: boolean;
  pending: boolean;
  highlighted?: boolean;
  onBlock: (blockType: RoomBlockType) => void;
  onEditBlock: (block: RoomBlockListItem) => void;
  onSetAvailable: () => void;
  onChangeHk: (room: StaffRoom, hkStatus: HkStatus) => void | Promise<void>;
  onConfirmHold: (booking: HotelBooking) => void;
  onReleaseHold: (booking: HotelBooking) => void;
}) {
  const { room, block, booking, heldBy, holdKind, state } = entry;
  const meta = STATE_META[state];
  const Icon = meta.icon;

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-xl border p-3 transition-all',
        meta.tile,
        !room.isActive && 'opacity-70',
        pending && 'opacity-60',
        highlighted && 'ring-2 ring-slate-900 ring-offset-2'
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
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

      {!room.isActive && (
        <p className="mt-1 text-[11px] font-medium text-slate-500">
          Retired room — not sold on any date.
        </p>
      )}

      <div className="mt-2 mb-3 space-y-1.5">
        {booking && <GuestLine booking={booking} />}

        {/*
          Hai kiểu "Held" khác nhau về độ tin cậy nên phải nói khác nhau:
          - `assigned` = lễ tân đã chốt thật qua `assign-room` ⇒ nói được số phòng với khách.
          - `provisional` = FE xếp tạm để phòng không nằm lẫn trong nhóm phát ra được ⇒ chưa chốt.
        */}
        {heldBy && (
          <>
            <GuestLine booking={heldBy} action="check in" />
            {holdKind === 'assigned' ? (
              <>
                <p className="text-[11px] leading-snug text-sky-700">
                  Assigned to this booking · check-in will hand over this room
                </p>
                <button
                  type="button"
                  onClick={() => onReleaseHold(heldBy)}
                  disabled={pending}
                  className="text-[11px] font-medium text-slate-500 underline underline-offset-2 transition-colors hover:text-slate-900 disabled:opacity-50"
                >
                  Unassign this room
                </button>
              </>
            ) : (
              <>
                <p className="text-[11px] leading-snug text-sky-700">
                  Kept free for this arrival · room not confirmed yet
                </p>
                <button
                  type="button"
                  onClick={() => onConfirmHold(heldBy)}
                  disabled={pending}
                  className="text-[11px] font-medium text-sky-700 underline underline-offset-2 transition-colors hover:text-sky-900 disabled:opacity-50"
                >
                  Assign this room for real
                </button>
              </>
            )}
          </>
        )}

        {block && (
          <div className="rounded-lg bg-white/70 px-2 py-1.5">
            <p className="text-[11px] font-medium text-slate-700">
              {block.blockType === 'ooo' ? 'Maintenance' : 'Out of service'} ·{' '}
              {isoDayMonth(block.startDate)} → {isoDayMonth(block.endDate)}
            </p>
            <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500" title={block.reason}>
              {block.reason}
            </p>
            {booking && (
              <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-rose-600">
                <AlertTriangle className="size-3 shrink-0" />
                A guest is still assigned to this blocked room.
              </p>
            )}
            {/*
              Gia hạn / rút ngắn đợt này. Khác hẳn "Available" trong menu (gỡ SẠCH cả đợt và trả
              phòng về kho bán) — ở đây đợt chặn vẫn còn, chỉ đổi ngày dự kiến xong, nên lịch sử
              chi phí sự cố giữ nguyên.
            */}
            <button
              type="button"
              onClick={() => onEditBlock(block)}
              disabled={pending}
              className="mt-1 text-[11px] font-medium text-slate-500 underline underline-offset-2 transition-colors hover:text-slate-900 disabled:opacity-50"
            >
              Change end date or reason
            </button>
          </div>
        )}

        {/* Buồng phòng chỉ có nghĩa với hôm nay — hiện ở ngày khác là mời người ta hiểu nhầm. */}
        {isToday && (
          <p className="flex items-center gap-1 text-[11px] text-slate-500">
            <Sparkles className="size-3 shrink-0 text-slate-400" />
            Housekeeping now: {HK_LABELS[room.hkStatus]}
          </p>
        )}
      </div>

      {/*
       * Một nút "Change status" như room map cũ, nhưng mỗi mục đi vào đúng cơ chế của nó:
       * Maintenance/Out of service → đợt chặn CHO NGÀY ĐANG XEM; Available → gỡ đợt chặn (hoặc
       * đánh dấu đã dọn nếu là hôm nay); Cleaning → trạng thái buồng phòng, vốn chỉ có nghĩa hôm nay.
       * Occupied cố tình để mờ: BE từ chối đổi tay, nó chỉ sinh ra từ check-in.
       */}
      <div className="mt-auto">
        <DropdownMenu>
          <DropdownMenuTrigger
            disabled={pending || !room.isActive}
            className="inline-flex h-8 w-full items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white/80 text-xs font-medium text-slate-600 transition-colors hover:bg-white hover:text-slate-900 disabled:opacity-50"
          >
            Change status <ChevronDown className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <p className="px-2 py-1.5 text-[11px] leading-snug text-slate-400">
              Applies to {dayMonthLabel(entry.date)}
              {isToday ? ' (today)' : ' only'}
            </p>

            <StatusItem
              state="available"
              current={state}
              disabled={Boolean(booking) || (!block && (state === 'available' || state === 'held'))}
              hint={
                booking
                  ? 'Guest is checked in — check out from Front desk'
                  : block
                    ? `Ends the whole block (${isoDayMonth(block.startDate)} → ${isoDayMonth(block.endDate)}) — to only move the end day, use "Change end date" above`
                    : heldBy
                      ? holdKind === 'assigned'
                        ? 'Assigned to an arrival — unassign it above to free the room'
                        : 'Kept for an arrival — check that booking in, or cancel it, to free the room'
                      : undefined
              }
              onSelect={onSetAvailable}
            />

            <StatusItem
              state="occupied"
              current={state}
              disabled
              hint="Only check-in can set this — use Front desk"
            />

            <StatusItem
              state="cleaning"
              current={state}
              disabled={!isToday || room.hkStatus === 'cleaning'}
              hint={!isToday ? 'Housekeeping is a right-now status — today only' : undefined}
              onSelect={() => void onChangeHk(room, 'cleaning')}
            />

            <StatusItem
              state="maintenance"
              current={state}
              disabled={Boolean(block)}
              hint={
                block
                  ? 'Already blocked — change its dates above, or set it back to Available first'
                  : undefined
              }
              onSelect={() => onBlock('ooo')}
            />

            <StatusItem
              state="out_of_service"
              current={state}
              disabled={Boolean(block)}
              hint={
                block
                  ? 'Already blocked — change its dates above, or set it back to Available first'
                  : undefined
              }
              onSelect={() => onBlock('oos')}
            />

            {/* Chi tiết buồng phòng: BE có 4 nấc, "Cleaning" ở trên chỉ là một trong số đó. */}
            {isToday && (
              <>
                <div className="my-1 border-t border-slate-100" />
                <p className="px-2 pb-1 text-[11px] font-medium text-slate-400">
                  Housekeeping detail
                </p>
                {HK_ORDER.filter(status => status !== 'cleaning').map(status => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => void onChangeHk(room, status)}
                    disabled={status === room.hkStatus}
                    className="gap-2"
                  >
                    <Sparkles className="size-3.5 text-slate-400" />
                    <span className="flex-1">{HK_LABELS[status]}</span>
                    {status === room.hkStatus && <Check className="size-3.5 text-slate-400" />}
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

/**
 * Thẻ cho một đơn CHƯA có phòng. Viền đứt + ô số phòng bỏ trống để nhìn phát biết đây không phải
 * một phòng thật, chỉ là một suất đã bán đang chờ xếp phòng.
 */
function ArrivalCard({ booking, date }: { booking: HotelBooking; date: string }) {
  const arrivesToday = toUtcDateKey(booking.checkInDate) === date;
  const awaitingPayment = booking.status === 'pending';

  return (
    <Link
      to={ROUTES.staffBookingDetail(booking.id)}
      className={cn(
        'flex flex-col rounded-xl border border-dashed p-3 transition-colors',
        awaitingPayment
          ? 'border-amber-300 bg-amber-50/60 hover:bg-amber-50'
          : 'border-blue-300 bg-blue-50/40 hover:bg-blue-50'
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div
          className={cn(
            'flex size-9 items-center justify-center rounded-lg',
            awaitingPayment ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
          )}
        >
          <UserRound className="size-5" />
        </div>
        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <span
            className={cn('size-2 rounded-full', awaitingPayment ? 'bg-amber-500' : 'bg-blue-500')}
          />
          {STATUS_WORDS[booking.status]}
        </span>
      </div>

      <p className="text-lg leading-tight font-semibold text-slate-400">— · —</p>
      <p className="truncate text-xs text-slate-500" title={booking.roomType.name}>
        {booking.roomType.name}
      </p>

      <div className="mt-2 mb-3 rounded-lg bg-white/70 px-2 py-1.5">
        <span className="block truncate text-xs font-medium text-slate-700">
          {booking.customer.fullName}
        </span>
        <span className="mt-0.5 block text-[11px] text-slate-500">
          {booking.bookingCode} · {formatDate(booking.checkInDate)} →{' '}
          {formatDate(booking.checkOutDate)}
        </span>
      </div>

      <span className="mt-auto inline-flex h-8 w-full items-center justify-center rounded-lg border border-slate-200 bg-white/80 text-xs font-medium text-slate-600">
        {awaitingPayment
          ? 'Open booking · take payment'
          : arrivesToday
            ? 'Open booking · check in'
            : 'Open booking'}
      </span>
    </Link>
  );
}

function GuestLine({ booking, action }: { booking: HotelBooking; action?: string }) {
  return (
    <Link
      to={ROUTES.staffBookingDetail(booking.id)}
      className="block rounded-lg bg-white/70 px-2 py-1.5 transition-colors hover:bg-white"
    >
      <span className="flex items-center gap-1 truncate text-xs font-medium text-slate-700">
        <UserRound className="size-3 shrink-0 text-slate-400" />
        <span className="truncate">{booking.customer.fullName}</span>
      </span>
      <span className="mt-0.5 block text-[11px] text-slate-500">
        {booking.bookingCode} · {action ? `${action} · ` : ''}out {formatDate(booking.checkOutDate)}
      </span>
    </Link>
  );
}
