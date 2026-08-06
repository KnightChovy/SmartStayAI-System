import type { FoStatus, HkStatus, RoomStatus } from '@prisma/client';

/**
 * Trạng thái phòng có 3 chiều ĐỘC LẬP, mỗi chiều một người đổi:
 *  - fo (lễ tân)     : phòng có khách hay không — chỉ sinh ra từ check-in/check-out
 *  - hk (buồng phòng): phòng sạch tới đâu       — chiều duy nhất staff bấm trực tiếp
 *  - block (kỹ thuật): chặn theo KHOẢNG NGÀY    — bảng room_blocks
 *
 * Room map lại chỉ hiển thị được một nhãn. File này là chỗ DUY NHẤT ép 3 chiều đó về 1 nhãn.
 * Copy logic này ra nơi khác là bắt đầu có hai màn hình nói hai chuyện khác nhau về cùng một phòng.
 */

/** Phần thông tin tối thiểu để suy ra nhãn hiển thị. */
export interface RoomStatusDimensions {
  foStatus: FoStatus;
  hkStatus: HkStatus;
}

/**
 * Suy ra nhãn hiển thị từ 3 chiều. Thứ tự ưu tiên phản ánh mức độ "chặn bán" giảm dần:
 *
 * 1. Đang bị block  → maintenance. Block đè lên tất cả: phòng OOO thì sạch hay bẩn cũng không bán được.
 * 2. Đang có khách  → occupied.    Ưu tiên hơn hk vì phòng có khách thì chưa dọn được kiểu gì.
 * 3. Bẩn/đang dọn   → cleaning.
 * 4. Còn lại        → available.
 *
 * @param room       hai chiều fo/hk của phòng
 * @param hasBlock   phòng có block còn hiệu lực trong NGÀY ĐANG XÉT hay không
 */
export const deriveRoomStatus = (room: RoomStatusDimensions, hasBlock: boolean): RoomStatus => {
  if (hasBlock) {
    return 'maintenance';
  }
  if (room.foStatus === 'occupied') {
    return 'occupied';
  }
  if (room.hkStatus === 'dirty' || room.hkStatus === 'cleaning') {
    return 'cleaning';
  }
  return 'available';
};

/**
 * Phòng đã sẵn sàng đón khách chưa (xét riêng chiều buồng phòng).
 * Loại phòng bật requiresInspection thì phải qua bước supervisor kiểm tra, `clean` chưa đủ.
 */
export const isHousekeepingReady = (hkStatus: HkStatus, requiresInspection: boolean): boolean => {
  return requiresInspection ? hkStatus === 'inspected' : hkStatus === 'clean' || hkStatus === 'inspected';
};

/**
 * Mức độ trễ so với SLA dọn phòng, để FE tô badge mà không phải tự tính lại luật:
 *  - on_time  : còn trong định mức
 *  - warning  : đã quá 50% định mức (badge vàng)
 *  - overdue  : đã quá 100% định mức (badge đỏ + cần báo supervisor)
 *
 * Chỉ có ý nghĩa khi phòng đang dọn dở. Trả `null` nếu phòng không ở trạng thái cleaning hoặc
 * chưa có mốc thời gian — không bịa ra cảnh báo từ dữ liệu không có.
 */
export type CleaningSla = 'on_time' | 'warning' | 'overdue';

export const cleaningSlaLevel = (
  hkStatus: HkStatus,
  hkStatusSince: Date | null,
  hkExpectedUntil: Date | null,
  now: Date = new Date()
): CleaningSla | null => {
  if (hkStatus !== 'cleaning' || !hkStatusSince || !hkExpectedUntil) {
    return null;
  }
  const allowedMs = hkExpectedUntil.getTime() - hkStatusSince.getTime();
  if (allowedMs <= 0) {
    return null;
  }
  const elapsedMs = now.getTime() - hkStatusSince.getTime();
  if (elapsedMs >= allowedMs) {
    return 'overdue';
  }
  return elapsedMs >= allowedMs / 2 ? 'warning' : 'on_time';
};
