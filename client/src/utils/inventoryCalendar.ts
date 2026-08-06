import type {
  HotelBooking,
  InventoryCalendar,
  InventoryDayCell,
  InventoryTypeRow,
  RoomBlockListItem,
  StaffRoom,
} from '@/types/staff.types';
import { toUtcDateKey } from '@/utils/formatDate';

/**
 * Tính tồn kho theo TỪNG ĐÊM cho lịch phòng của staff.
 *
 * ⚠️ Đây là bản MÔ PHỎNG công thức của BE ở phía client — BE chưa có endpoint trả tồn kho theo ngày
 * (`availabilityService.getStayQuotes` chỉ trả MIN của cả kỳ ở). Mỗi luật dưới đây bám đúng một chỗ
 * cụ thể trong `server/src/services/availability.service.ts` (`countSellableRoomsPerDate`) và
 * `room-block.service.ts` (`computeShortage`). Sửa ở đây thì phải đối chiếu lại bên đó, nếu không
 * số trên lịch sẽ khác số khách thấy lúc đặt phòng.
 */

/** Đơn ở trạng thái này KHÔNG chiếm phòng nữa. */
const RELEASED_STATUSES = new Set(['cancelled', 'checked_out', 'no_show']);

/**
 * Đơn có đang chiếm tồn kho không.
 *
 * - `confirmed` / `checked_in`: chiếm — hiển nhiên.
 * - `pending`: **CÓ chiếm**. BE cộng `roomAvailability.bookedRooms` NGAY lúc tạo đơn để giữ chỗ,
 *   chỉ nhả khi cron `releaseExpiredHolds` chạy. Tài liệu thiết kế chỉ ghi `confirmed|checked_in`;
 *   làm đúng theo tài liệu thì lịch **báo thừa phòng** đúng bằng số đơn đang chờ thanh toán.
 * - `pending` đã quá `holdExpiresAt`: KHÔNG tính — cron sẽ huỷ, chỉ là chưa chạy tới.
 * - `checked_out`: khách trả phòng sớm, các đêm còn lại của đơn không còn bị chiếm.
 */
export function occupiesInventory(
  booking: Pick<HotelBooking, 'status' | 'holdExpiresAt'>,
  now: Date = new Date()
): boolean {
  if (RELEASED_STATUSES.has(booking.status)) return false;
  if (booking.status !== 'pending') return true;
  if (!booking.holdExpiresAt) return true; // không có hạn giữ chỗ ⇒ vẫn đang giữ phòng
  const expiry = new Date(booking.holdExpiresAt);
  return Number.isNaN(expiry.getTime()) ? true : expiry.getTime() > now.getTime();
}

/**
 * Phòng còn thuộc biên chế khách sạn — mirror `ACTIVE_ROOM_WHERE` của BE.
 *
 * CỐ Ý không lọc theo `status`: đó là tình trạng của HÔM NAY. Phòng đang có khách hoặc đang dọn vẫn
 * bán được cho những đêm sau (và lượt khách đó đã nằm trong `booked` rồi — trừ thêm là trừ hai lần).
 * Phần phụ thuộc ngày (phòng đang bị chặn để sửa) xử lý riêng ở `blockedRoomIdsOn`.
 */
export function isActiveRoom(room: Pick<StaffRoom, 'isActive'>): boolean {
  return room.isActive;
}

/**
 * Id các phòng bị rút khỏi kho bán trong một ngày.
 *
 * CHỈ `ooo` mới trừ — `oos` là ngưng phục vụ trong ngày (kê lại đồ, giữ phòng), không rút phòng khỏi
 * kho. Trả về `Set` **theo phòng** chứ không đếm block: một phòng dính hai đợt chặn chồng nhau vẫn
 * chỉ mất đúng một phòng khỏi kho.
 */
export function blockedRoomIdsOn(
  blocks: RoomBlockListItem[],
  dateKey: string
): Set<string> {
  const blocked = new Set<string>();
  for (const block of blocks) {
    if (block.blockType !== 'ooo' || block.resolvedAt) continue;
    // `endDate` là ngày cuối CÒN BỊ CHẶN nên dùng <=, khác `checkOutDate` của booking.
    const start = toUtcDateKey(block.startDate);
    const end = toUtcDateKey(block.endDate);
    if (start && end && dateKey >= start && dateKey <= end) {
      blocked.add(block.roomId);
    }
  }
  return blocked;
}

/** Danh sách khoá ngày `YYYY-MM-DD` từ `from` tới `to` (bao gồm cả hai đầu). */
export function eachDateKey(from: string, to: string): string[] {
  const start = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return [];
  }
  const keys: string[] = [];
  for (let d = start; d <= end; d = new Date(d.getTime() + 86_400_000)) {
    keys.push(d.toISOString().slice(0, 10));
  }
  return keys;
}

/** Cộng `days` ngày vào một khoá ngày `YYYY-MM-DD` (âm = lùi lại). */
export function shiftDateKey(dateKey: string, days: number): string {
  const base = new Date(`${dateKey}T00:00:00Z`);
  if (Number.isNaN(base.getTime())) return dateKey;
  return new Date(base.getTime() + days * 86_400_000).toISOString().slice(0, 10);
}

interface BuildInventoryCalendarInput {
  rooms: StaffRoom[];
  blocks: RoomBlockListItem[];
  bookings: HotelBooking[];
  /** Giá gốc mỗi đêm theo loại phòng — chỉ để xếp hàng theo phân khúc giá. */
  basePriceByType?: Map<string, number>;
  /** Ngày đầu lịch `YYYY-MM-DD`. */
  from: string;
  /** Ngày cuối lịch `YYYY-MM-DD` (bao gồm). */
  to: string;
  /** Có booking bị cắt vì chạm trần phân trang không. */
  truncated?: boolean;
  /** Mốc "bây giờ" để xét hạn giữ chỗ — tách ra để test được. */
  now?: Date;
}

/**
 * Ghép `rooms` + `blocks` + `bookings` thành lưới tồn kho.
 *
 * Loại phòng lấy từ chính danh sách phòng: loại nào không có phòng vật lý nào thì cũng không có gì
 * để bán nên không cần hiện.
 */
export function buildInventoryCalendar({
  rooms,
  blocks,
  bookings,
  basePriceByType,
  from,
  to,
  truncated = false,
  now = new Date(),
}: BuildInventoryCalendarInput): InventoryCalendar {
  const dates = eachDateKey(from, to);

  // Gom phòng còn dùng được theo loại.
  const typeMeta = new Map<string, { name: string; roomIds: string[] }>();
  for (const room of rooms) {
    const entry = typeMeta.get(room.roomTypeId);
    if (entry) {
      if (isActiveRoom(room)) entry.roomIds.push(room.id);
    } else {
      typeMeta.set(room.roomTypeId, {
        name: room.roomType.name,
        roomIds: isActiveRoom(room) ? [room.id] : [],
      });
    }
  }

  // Phòng bị chặn OOO của từng ngày — tính một lần cho cả lưới.
  const blockedByDate = new Map(dates.map(date => [date, blockedRoomIdsOn(blocks, date)]));

  // Số phòng bị đơn đặt chiếm theo (loại phòng, đêm).
  const bookedByTypeAndDate = new Map<string, number>();
  for (const booking of bookings) {
    if (!occupiesInventory(booking, now)) continue;
    // Một đêm bị chiếm khi checkIn <= đêm < checkOut — ĐÊM CUỐI KHÔNG TÍNH, vì khách trả phòng
    // sáng hôm đó nên phòng bán lại được cho chính đêm ấy.
    const checkIn = toUtcDateKey(booking.checkInDate);
    const checkOut = toUtcDateKey(booking.checkOutDate);
    if (!checkIn || !checkOut) continue;
    for (const date of dates) {
      if (date >= checkIn && date < checkOut) {
        const key = `${booking.roomTypeId}:${date}`;
        bookedByTypeAndDate.set(key, (bookedByTypeAndDate.get(key) ?? 0) + 1);
      }
    }
  }

  const rows: InventoryTypeRow[] = [...typeMeta.entries()]
    .map(([roomTypeId, meta]) => {
      const days: InventoryDayCell[] = dates.map(date => {
        const blocked = blockedByDate.get(date) ?? new Set<string>();
        const sellable = meta.roomIds.filter(roomId => !blocked.has(roomId)).length;
        const booked = bookedByTypeAndDate.get(`${roomTypeId}:${date}`) ?? 0;
        return { date, sellable, booked, available: sellable - booked };
      });
      return {
        roomTypeId,
        roomTypeName: meta.name,
        basePrice: basePriceByType?.get(roomTypeId) ?? null,
        days,
      };
    })
    // Xếp theo PHÂN KHÚC GIÁ tăng dần — đọc lịch theo hạng phòng tự nhiên hơn theo bảng chữ cái.
    // Loại chưa biết giá (đã tắt bán nên endpoint công khai không trả) đẩy xuống cuối, rồi mới so tên.
    .sort((a, b) => {
      if (a.basePrice !== b.basePrice) {
        if (a.basePrice === null) return 1;
        if (b.basePrice === null) return -1;
        return a.basePrice - b.basePrice;
      }
      return a.roomTypeName.localeCompare(b.roomTypeName, undefined, {
        numeric: true,
        sensitivity: 'base',
      });
    });

  return { from, to, rows, truncated };
}
