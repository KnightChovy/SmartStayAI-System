import type { RoomBlock, StaffBooking, StaffRoom } from '@/types/staff.type';

/** Trạng thái một phòng vật lý ĐÚNG NGÀY đang xem — khác `room.status` (chỉ đúng cho HÔM NAY)
 *  vì đợt chặn (`maintenance`/`out_of_service`) và booking đều gắn theo khoảng ngày. Mirror
 *  `buildRoomDayView` bên web, bỏ nhánh housekeeping (`cleaning`) vì `StaffRoom` bên mobile
 *  không có field `hkStatus`. */
export type RoomDayState = 'maintenance' | 'out_of_service' | 'occupied' | 'held' | 'available';

export interface RoomDayEntry {
  room: StaffRoom;
  state: RoomDayState;
  /** Có khi `state` là `maintenance`/`out_of_service`. */
  block?: RoomBlock;
  /** Đơn đang giữ/chiếm phòng này — có khi `state` là `occupied` hoặc `held`. */
  booking?: StaffBooking;
  /** `'assigned'` = lễ tân đã chốt phòng thật (`POST assign-room` hoặc đã check-in) — nói được số
   *  phòng với khách. `'provisional'` = FE tự xếp tạm (xem `applyProvisionalHolds`), CHƯA chốt,
   *  không được đọc số phòng này cho khách. */
  holdKind?: 'assigned' | 'provisional' | null;
}

const RELEASED_STATUSES = new Set(['cancelled', 'checked_out', 'no_show']);

/** Đơn còn CHIẾM một phòng đêm nay hay không — `pending` còn hạn giữ chỗ vẫn tính, quá hạn thì
 *  coi như đã nhả (cron dọn theo lịch, không tức thời nên vẫn phải tự trừ ở client). */
export function occupiesInventory(
  booking: Pick<StaffBooking, 'status' | 'holdExpiresAt'>,
  now: Date = new Date(),
): boolean {
  if (RELEASED_STATUSES.has(booking.status)) return false;
  if (booking.status !== 'pending') return true;
  if (!booking.holdExpiresAt) return true;
  const expiry = new Date(booking.holdExpiresAt);
  return Number.isNaN(expiry.getTime()) ? true : expiry.getTime() > now.getTime();
}

function dateKeyOf(iso: string): string {
  return iso.slice(0, 10);
}

/** Đợt chặn phủ đúng ngày đang xem — `endDate` INCLUSIVE (đêm cuối vẫn bị chặn), và bỏ qua đợt
 *  đã đóng (`resolvedAt` có giá trị). */
function blockCoversDate(block: RoomBlock, date: string): boolean {
  if (block.resolvedAt) return false;
  return dateKeyOf(block.startDate) <= date && dateKeyOf(block.endDate) >= date;
}

/** Booking chiếm đêm đang xem — `checkOutDate` EXCLUSIVE (đêm trả phòng không tính là còn ở). */
export function bookingCoversDate(booking: StaffBooking, date: string): boolean {
  return dateKeyOf(booking.checkInDate) <= date && dateKeyOf(booking.checkOutDate) > date;
}

interface BuildRoomDayViewInput {
  rooms: StaffRoom[];
  /** Không cần lọc `resolvedAt` trước — hàm tự bỏ qua đợt đã đóng. */
  blocks: RoomBlock[];
  /** TRUYỀN NGUYÊN mọi booking phủ ngày này, kể cả `pending` — hàm tự áp `occupiesInventory` và
   *  chỉ xét đơn ĐÃ GÁN PHÒNG THẬT (`bookingRooms` có dòng). Đơn confirmed/pending chưa gán phòng
   *  không được tính ở đây — đó là việc của `applyProvisionalHolds` bên dưới. */
  bookings: StaffBooking[];
  date: string;
  now?: Date;
}

/** Suy trạng thái TỪNG PHÒNG cho đúng một ngày, theo đúng thứ tự ưu tiên của BE
 *  (`deriveRoomStatus`): đợt chặn > khách đang ở (checked_in) > đã gán trước (confirmed) > trống.
 *  Một phòng có thể dính CẢ đợt chặn LẪN có khách — ưu tiên đợt chặn vì đó là thứ staff cần thấy
 *  ngay (xung đột lịch), giống hệt luật bên web. CHỈ xét booking đã gán phòng THẬT
 *  (`bookingRooms.length > 0`) — gọi `applyProvisionalHolds` sau đó để xử lý phần chưa gán. */
export function buildRoomDayView({
  rooms,
  blocks,
  bookings,
  date,
  now = new Date(),
}: BuildRoomDayViewInput): RoomDayEntry[] {
  const blockByRoomId = new Map<string, RoomBlock>();
  for (const block of blocks) {
    if (blockCoversDate(block, date)) blockByRoomId.set(block.roomId, block);
  }

  const bookingByRoomId = new Map<string, StaffBooking>();
  for (const booking of bookings) {
    if (!occupiesInventory(booking, now)) continue;
    if (!bookingCoversDate(booking, date)) continue;
    for (const link of booking.bookingRooms) {
      const existing = bookingByRoomId.get(link.room.id);
      if (!existing || (booking.status === 'checked_in' && existing.status !== 'checked_in')) {
        bookingByRoomId.set(link.room.id, booking);
      }
    }
  }

  return rooms.map(room => {
    const block = blockByRoomId.get(room.id);
    if (block) {
      return {
        room,
        state: block.blockType === 'ooo' ? 'maintenance' : 'out_of_service',
        block,
      };
    }
    const booking = bookingByRoomId.get(room.id);
    if (booking) {
      return {
        room,
        state: booking.status === 'checked_in' ? 'occupied' : 'held',
        booking,
        holdKind: booking.status === 'checked_in' ? null : 'assigned',
      };
    }
    return { room, state: 'available' };
  });
}

/**
 * Xếp TẠM mỗi đơn CHƯA được gán phòng vào một phòng còn trống cùng loại, để phòng đó không nằm
 * lẫn trong nhóm "còn trống phát được" — mirror `applyProvisionalHolds` bên web.
 *
 * ⚠️ Đây là PHỎNG ĐOÁN của FE (BE chỉ chọn phòng thật lúc check-in hoặc khi lễ tân tự gán trước).
 * Xếp theo số phòng tăng dần + thứ tự đơn cố định (ngày nhận phòng rồi mã đơn) để cùng một dữ
 * liệu luôn ra cùng kết quả — không thì mỗi lần tải lại một phòng khác bị đánh dấu.
 *
 * Đơn không còn phòng trống nào để xếp thì trả về ở `unplaced` — dấu hiệu THIẾU PHÒNG THẬT.
 */
export function applyProvisionalHolds({
  entries,
  bookings,
}: {
  entries: RoomDayEntry[];
  /** Đơn chiếm đêm này nhưng CHƯA được gán phòng nào (`bookingRooms.length === 0`). */
  bookings: StaffBooking[];
}): { entries: RoomDayEntry[]; unplaced: StaffBooking[] } {
  if (bookings.length === 0) return { entries, unplaced: [] };

  const freeByType = new Map<string, number[]>();
  entries.forEach((entry, index) => {
    if (entry.state !== 'available' || entry.room.isActive === false) return;
    const list = freeByType.get(entry.room.roomTypeId);
    if (list) list.push(index);
    else freeByType.set(entry.room.roomTypeId, [index]);
  });
  for (const list of freeByType.values()) {
    list.sort((a, b) =>
      entries[a].room.roomNumber.localeCompare(entries[b].room.roomNumber, undefined, {
        numeric: true,
        sensitivity: 'base',
      }),
    );
  }

  const ordered = [...bookings].sort(
    (a, b) => a.checkInDate.localeCompare(b.checkInDate) || a.bookingCode.localeCompare(b.bookingCode),
  );

  const next = [...entries];
  const unplaced: StaffBooking[] = [];
  const cursor = new Map<string, number>();

  for (const booking of ordered) {
    const candidates = freeByType.get(booking.roomTypeId) ?? [];
    const at = cursor.get(booking.roomTypeId) ?? 0;
    if (at >= candidates.length) {
      unplaced.push(booking);
      continue;
    }
    cursor.set(booking.roomTypeId, at + 1);
    const index = candidates[at];
    next[index] = {
      ...next[index],
      state: 'held',
      booking,
      holdKind: 'provisional',
    };
  }

  return { entries: next, unplaced };
}
