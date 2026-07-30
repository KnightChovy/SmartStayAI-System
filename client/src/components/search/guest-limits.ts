/**
 * Giới hạn + luật ràng buộc cho bộ chọn khách (Người lớn / Trẻ em / Số phòng).
 *
 * Dùng chung cho thanh tìm kiếm hero (`GuestsPopover`) và filter sidebar của trang kết quả
 * (`GuestCounters`) — để hai chỗ không trôi lệch luật.
 *
 * Vì sao KHÔNG chặn theo `availableRooms` của một khách sạn cụ thể: bộ chọn này chạy TRƯỚC khi
 * có kết quả và áp cho toàn bộ kết quả, không thuộc về khách sạn nào. Việc "chỉ còn 4 phòng" được
 * xử lý ở tầng dữ liệu: BE (`GET /hotels`) loại thẳng khách sạn có tổng phòng trống < `rooms`
 * cho kỳ ở đã chọn. Ở đây chỉ chặn các giá trị vô nghĩa.
 */

export interface GuestSelection {
  adults: number;
  children: number;
  rooms: number;
}

/** Trần số phòng mỗi lượt tìm — nhiều hơn thì là đặt đoàn, phải liên hệ khách sạn. */
export const MAX_ROOMS = 8;
/** Trần người lớn = 2 người/phòng × trần số phòng. */
export const MAX_ADULTS = MAX_ROOMS * 2;
export const MAX_CHILDREN = 10;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.round(value)));

/**
 * Chuẩn hoá một lựa chọn bất kỳ về vùng hợp lệ. Dùng khi đọc từ URL — khách có thể sửa tay
 * `?rooms=999` hoặc giữ link cũ; không kẹp thì con số vô lý đi thẳng vào request.
 */
export function clampGuestSelection(sel: GuestSelection): GuestSelection {
  const rooms = clamp(Number.isFinite(sel.rooms) ? sel.rooms : 1, 1, MAX_ROOMS);
  const children = clamp(
    Number.isFinite(sel.children) ? sel.children : 0,
    0,
    MAX_CHILDREN
  );
  // Mỗi phòng cần ít nhất một người lớn ⇒ adults ≥ rooms.
  const adults = clamp(
    Number.isFinite(sel.adults) ? sel.adults : 1,
    rooms,
    MAX_ADULTS
  );
  return { adults, children, rooms };
}

/**
 * Đổi số người lớn. Giảm xuống dưới số phòng thì kéo số phòng xuống theo — không thể để
 * 2 người lớn nhận 5 phòng.
 */
export function setAdults(sel: GuestSelection, adults: number): GuestSelection {
  const next = clamp(adults, 1, MAX_ADULTS);
  return { ...sel, adults: next, rooms: Math.min(sel.rooms, next) };
}

export function setChildren(
  sel: GuestSelection,
  children: number
): GuestSelection {
  return { ...sel, children: clamp(children, 0, MAX_CHILDREN) };
}

/** Đổi số phòng. Tăng vượt số người lớn thì đẩy số người lớn lên bằng (mỗi phòng ≥ 1 người lớn). */
export function setRooms(sel: GuestSelection, rooms: number): GuestSelection {
  const next = clamp(rooms, 1, MAX_ROOMS);
  return { ...sel, rooms: next, adults: Math.max(sel.adults, next) };
}
