import type { RoomBlockType } from '@prisma/client';

/** Payload chặn một phòng theo khoảng ngày (bảo trì / hỏng hóc). */
export interface CreateRoomBlockDto {
  blockType: RoomBlockType;
  /** Ngày bắt đầu chặn (YYYY-MM-DD) */
  startDate: Date;
  /** Ngày cuối CÒN BỊ CHẶN, tính cả ngày này */
  endDate: Date;
  reason: string;
  estimatedCost?: number;
}

/** Một booking sẽ mất phòng vì đợt chặn này. */
export interface AffectedBooking {
  id: string;
  bookingCode: string;
  checkInDate: Date;
  checkOutDate: Date;
  status: string;
  guestName: string;
}

/** Tình hình tồn kho của một ngày sau khi áp đợt chặn. */
export interface ShortageNight {
  date: Date;
  /** Số phòng cùng loại còn bán được trong ngày đó, ĐÃ trừ đợt chặn đang xét */
  sellable: number;
  /** Số phòng cùng loại đã có khách đặt */
  booked: number;
  /** booked − sellable, chỉ xuất hiện khi > 0 */
  shortage: number;
}

/**
 * Kết quả kiểm tra trước khi chặn. Trả cho FE hiển thị panel cảnh báo, và trả lại luôn sau khi
 * chặn thật để staff thấy đúng thứ mình vừa gây ra.
 */
export interface RoomBlockPreview {
  roomNumber: string;
  roomTypeName: string;
  /** Booking đã được gán ĐÚNG phòng này và trùng khoảng chặn — chắc chắn phải xếp lại */
  affectedBookings: AffectedBooking[];
  /** Chỉ những ngày THỰC SỰ thiếu phòng (booked > sellable), thường chỉ 1–2 ngày cao điểm */
  shortageNights: ShortageNight[];
}
