import type { RoomStatus, RuleType, AdjustmentType } from '@/types/hotel-management.types';
import { formatCurrency } from '@/utils/formatCurrency';

/** Display config for room status (label + badge class). */
export const ROOM_STATUS_CONFIG: Record<RoomStatus, { label: string; class: string }> = {
  available: { label: 'Available', class: 'bg-emerald-100 text-emerald-700' },
  occupied: { label: 'Occupied', class: 'bg-blue-100 text-blue-700' },
  maintenance: { label: 'Maintenance', class: 'bg-amber-100 text-amber-700' },
  cleaning: { label: 'Cleaning', class: 'bg-violet-100 text-violet-700' },
};

/** Mọi trạng thái phòng — dùng cho BỘ LỌC danh sách (`GET /rooms?status=` vẫn nhận đủ 4 giá trị). */
export const ROOM_STATUS_OPTIONS: { value: RoomStatus; label: string }[] = [
  { value: 'available', label: 'Available' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'cleaning', label: 'Cleaning' },
];

/**
 * Trạng thái được phép ĐẶT trong form tạo/sửa phòng — chỉ 2 giá trị này, khớp `editableRoomStatus`
 * của BE. Gửi `maintenance`/`occupied` là **400**: bảo trì phải khai khoảng ngày qua đợt chặn phòng,
 * còn "có khách" chỉ sinh ra từ check-in.
 */
export const EDITABLE_ROOM_STATUS_OPTIONS: { value: RoomStatus; label: string }[] = [
  { value: 'available', label: 'Available' },
  { value: 'cleaning', label: 'Cleaning' },
];

export const RULE_TYPE_LABELS: Record<RuleType, string> = {
  seasonal: 'Seasonal',
  weekend: 'Weekend',
  occupancy: 'Occupancy',
  early_bird: 'Early bird',
};

export const RULE_TYPE_OPTIONS: { value: RuleType; label: string }[] = [
  { value: 'seasonal', label: RULE_TYPE_LABELS.seasonal },
  { value: 'weekend', label: RULE_TYPE_LABELS.weekend },
  { value: 'occupancy', label: RULE_TYPE_LABELS.occupancy },
  { value: 'early_bird', label: RULE_TYPE_LABELS.early_bird },
];

export const ADJUSTMENT_TYPE_OPTIONS: { value: AdjustmentType; label: string }[] = [
  { value: 'percentage', label: 'Percentage (%)' },
  { value: 'fixed', label: 'Fixed (VND)' },
];

/** 0 = Sunday ... 6 = Saturday. */
export const DAY_OF_WEEK_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Hiển thị mức điều chỉnh giá của một pricing rule.
 * `adjustmentValue` âm = giảm giá (discount). Trả về text kèm cờ `isDiscount`
 * để tô màu (đỏ = giảm, xanh = tăng).
 */
export function formatAdjustment(
  type: AdjustmentType,
  value: string
): { text: string; isDiscount: boolean } {
  const num = Number(value);
  const isDiscount = num < 0;
  const sign = num > 0 ? '+' : '';
  const text = type === 'percentage' ? `${sign}${num}%` : `${sign}${formatCurrency(num)}`;
  return { text, isDiscount };
}
