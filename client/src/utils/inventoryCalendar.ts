import type {
  HotelBooking,
  InventoryCalendar,
  InventoryDayCell,
  InventoryTypeRow,
  RoomBlockListItem,
  RoomDayEntry,
  RoomDayState,
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

/**
 * Đợt chặn **còn hiệu lực** phủ đúng một ngày, tra theo phòng.
 *
 * Khác `blockedRoomIdsOn` (chỉ đếm `ooo` để tính tồn kho): ở đây giữ cả `oos` vì bản đồ phòng vẫn
 * phải cho staff thấy phòng đang ngưng phục vụ, dù nó không rút phòng khỏi kho bán. Một phòng dính
 * nhiều đợt chồng nhau thì lấy đợt **tạo sau cùng** — cùng luật với `getActiveBlocksToday` của BE.
 */
export function activeBlocksOn(
  blocks: RoomBlockListItem[],
  dateKey: string
): Map<string, RoomBlockListItem> {
  const byRoom = new Map<string, RoomBlockListItem>();
  for (const block of blocks) {
    if (block.resolvedAt) continue;
    const start = toUtcDateKey(block.startDate);
    const end = toUtcDateKey(block.endDate);
    if (!start || !end || dateKey < start || dateKey > end) continue;
    const current = byRoom.get(block.roomId);
    if (!current || block.createdAt >= current.createdAt) byRoom.set(block.roomId, block);
  }
  return byRoom;
}

/**
 * Bản đồ phòng của MỘT ngày cụ thể — thứ mà `rooms.status` không nói được.
 *
 * **Thứ tự ưu tiên bám đúng `deriveRoomStatus` của BE** (đợt chặn → có khách → chưa sạch → trống)
 * nên xem ngày hôm nay ở đây ra đúng nhãn mà room map cũ hiện. Khác biệt duy nhất: `oos` tách khỏi
 * `maintenance` vì nó KHÔNG rút phòng khỏi kho bán.
 *
 * Một ngày trong tương lai chỉ có hai dữ kiện chắc chắn: đơn đã được **gán đúng phòng** và đợt chặn
 * phủ ngày đó ⇒ `includeHousekeeping` phải là `false`, phòng "đang dọn" sáng nay không nói gì về
 * tuần sau. Phòng vừa có khách vừa dính chặn thì `block` và `booking` **đều được trả về** để UI
 * cảnh báo xung đột thay vì giấu một trong hai.
 */
export function buildRoomDayView({
  rooms,
  blocks,
  bookings,
  date,
  includeHousekeeping = false,
  now = new Date(),
}: {
  rooms: StaffRoom[];
  blocks: RoomBlockListItem[];
  bookings: HotelBooking[];
  /** `YYYY-MM-DD`. */
  date: string;
  /** Bật khi `date` là HÔM NAY — chỉ khi đó trạng thái buồng phòng mới có nghĩa. */
  includeHousekeeping?: boolean;
  now?: Date;
}): RoomDayEntry[] {
  const blockByRoom = activeBlocksOn(blocks, date);

  const bookingByRoom = new Map<string, HotelBooking>();
  for (const booking of bookings) {
    if (!occupiesInventory(booking, now)) continue;
    const checkIn = toUtcDateKey(booking.checkInDate);
    const checkOut = toUtcDateKey(booking.checkOutDate);
    // Đêm cuối không tính: khách trả phòng sáng hôm đó nên phòng dùng lại được cho chính đêm ấy.
    if (!checkIn || !checkOut || date < checkIn || date >= checkOut) continue;
    for (const link of booking.bookingRooms) {
      bookingByRoom.set(link.roomId, booking);
    }
  }

  return rooms.map(room => {
    const block = blockByRoom.get(room.id) ?? null;
    const booking = bookingByRoom.get(room.id) ?? null;
    let state: RoomDayState = 'available';
    if (block) {
      // Đợt chặn đè lên tất cả: phòng hỏng thì sạch hay bẩn, có khách hay không cũng không bán được.
      state = block.blockType === 'ooo' ? 'maintenance' : 'out_of_service';
    } else if (booking) {
      state = 'occupied';
    } else if (includeHousekeeping && (room.hkStatus === 'dirty' || room.hkStatus === 'cleaning')) {
      state = 'cleaning';
    }
    return { room, date, state, block, booking, heldBy: null };
  });
}

/**
 * Xếp TẠM mỗi đơn chưa check-in vào một phòng còn trống cùng loại, để phòng đó không nằm lẫn trong
 * nhóm "còn trống phát được".
 *
 * ⚠️ **Đây là phỏng đoán của FE.** BE không có endpoint gán phòng trước — phòng vật lý chỉ được
 * chọn lúc check-in (`booking.service.checkIn` quét phòng `available` đúng loại). Vì vậy:
 * - Xếp theo **số phòng tăng dần** và theo thứ tự đơn cố định (ngày nhận phòng, rồi mã đơn) để
 *   cùng một dữ liệu luôn ra cùng kết quả — nếu không, mỗi lần tải lại một phòng khác bị đánh dấu.
 * - Phòng được xếp tạm vẫn là phòng **trống thật**, nên UI phải ghi rõ "dự kiến" và không được để
 *   lễ tân đọc số phòng đó cho khách như số phòng chính thức.
 *
 * Đơn không còn phòng trống nào để xếp thì trả về ở `unplaced` — đó là dấu hiệu **thiếu phòng
 * thật**, phải hiện cảnh báo chứ không được im lặng bỏ qua.
 */
export function applyProvisionalHolds({
  entries,
  bookings,
}: {
  entries: RoomDayEntry[];
  /** Đơn chiếm đêm này nhưng chưa được gán phòng nào. */
  bookings: HotelBooking[];
}): { entries: RoomDayEntry[]; unplaced: HotelBooking[] } {
  if (bookings.length === 0) return { entries, unplaced: [] };

  // Chỉ số của các phòng có thể xếp tạm, gom theo loại phòng, đã sắp theo số phòng tự nhiên.
  const freeByType = new Map<string, number[]>();
  entries.forEach((entry, index) => {
    if (entry.state !== 'available' || !entry.room.isActive) return;
    const list = freeByType.get(entry.room.roomTypeId);
    if (list) list.push(index);
    else freeByType.set(entry.room.roomTypeId, [index]);
  });
  for (const list of freeByType.values()) {
    list.sort((a, b) =>
      entries[a].room.roomNumber.localeCompare(entries[b].room.roomNumber, undefined, {
        numeric: true,
        sensitivity: 'base',
      })
    );
  }

  const ordered = [...bookings].sort(
    (a, b) =>
      a.checkInDate.localeCompare(b.checkInDate) || a.bookingCode.localeCompare(b.bookingCode)
  );

  const next = [...entries];
  const unplaced: HotelBooking[] = [];
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
    next[index] = { ...next[index], state: 'held', heldBy: booking };
  }

  return { entries: next, unplaced };
}

/** Hậu quả dự kiến của một đợt chặn, tính TẠI CLIENT từ dữ liệu lịch đang hiển thị. */
export interface LocalBlockPreview {
  /** Đơn đã được gán ĐÚNG phòng này và trùng khoảng chặn ⇒ phải xếp lại phòng. */
  affectedBookings: HotelBooking[];
  /** Đêm sẽ thiếu phòng sau khi chặn (`booked > sellable`). */
  shortageNights: { date: string; sellable: number; booked: number; shortage: number }[];
  /** Ngày cuối cùng còn dữ liệu để kiểm tra — sau ngày này lịch chưa tải booking nên không kết luận. */
  checkedThrough: string | null;
}

/**
 * Xem trước hậu quả của việc chặn một phòng — **tính ở client**, không gọi BE.
 *
 * ⚠️ Vì sao không dùng `POST .../blocks?dryRun=true` của BE: middleware `validate` chạy
 * `Object.assign(req, value)` nên `req.query.dryRun` đã được Joi convert thành **boolean**, trong
 * khi controller so với chuỗi `'true'` ⇒ nhánh xem trước không bao giờ chạy và mỗi lần "xem trước"
 * lại **chặn thật** một phòng (đã tái hiện trên deploy). Đã sửa controller, nhưng FE vẫn phải an
 * toàn với bản server đang chạy — và tính ở đây thì con số khớp đúng thứ đang hiện trên lưới.
 *
 * Mirror `computeShortage` của BE: đếm theo PHÒNG bị chặn (không đếm block) và chỉ `ooo` mới rút
 * phòng khỏi kho bán.
 */
export function previewRoomBlockLocally({
  rooms,
  blocks,
  bookings,
  roomId,
  blockType,
  startDate,
  endDate,
  dataTo,
  now = new Date(),
}: {
  rooms: StaffRoom[];
  blocks: RoomBlockListItem[];
  bookings: HotelBooking[];
  roomId: string;
  blockType: RoomBlockListItem['blockType'];
  startDate: string;
  endDate: string;
  /** Ngày cuối của khoảng đã tải booking — quá mốc này thì không kết luận thiếu phòng. */
  dataTo: string;
  now?: Date;
}): LocalBlockPreview {
  const room = rooms.find(r => r.id === roomId);
  const live = bookings.filter(booking => occupiesInventory(booking, now));

  const affectedBookings = live.filter(booking => {
    if (!booking.bookingRooms.some(link => link.roomId === roomId)) return false;
    const checkIn = toUtcDateKey(booking.checkInDate);
    const checkOut = toUtcDateKey(booking.checkOutDate);
    // Trùng khoảng chặn khi: nhận phòng <= ngày cuối bị chặn VÀ trả phòng > ngày đầu bị chặn
    // (ngày trả phòng không phải một đêm ngủ nên dùng >, không phải >=).
    return Boolean(checkIn && checkOut && checkIn <= endDate && checkOut > startDate);
  });

  const shortageNights: LocalBlockPreview['shortageNights'] = [];
  const checkedThrough = endDate <= dataTo ? endDate : dataTo >= startDate ? dataTo : null;

  if (room && checkedThrough) {
    const typeRoomIds = rooms.filter(r => r.roomTypeId === room.roomTypeId && r.isActive).map(r => r.id);
    for (const date of eachDateKey(startDate, checkedThrough)) {
      const blocked = blockedRoomIdsOn(blocks, date);
      if (blockType === 'ooo') blocked.add(roomId);
      const sellable = typeRoomIds.filter(id => !blocked.has(id)).length;
      const booked = live.filter(booking => {
        if (booking.roomTypeId !== room.roomTypeId) return false;
        const checkIn = toUtcDateKey(booking.checkInDate);
        const checkOut = toUtcDateKey(booking.checkOutDate);
        return Boolean(checkIn && checkOut && date >= checkIn && date < checkOut);
      }).length;
      if (booked > sellable) {
        shortageNights.push({ date, sellable, booked, shortage: booked - sellable });
      }
    }
  }

  return { affectedBookings, shortageNights, checkedThrough };
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
