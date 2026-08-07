import type { ViewStyle } from 'react-native';
import type {
  ConversationStatus,
  HousekeepingStatus,
  RoomStatus,
} from '@/types/staff.type';
import type { RoomDayState } from '@/utils/roomDayView';

/** Raw hex for props that don't accept className (icons, spinner, tab bar, camera). */
export const STAFF_COLORS = {
  primary: '#0F766E', // staff-700
  primaryDark: '#134E4A', // staff-900
  primaryLight: '#CCFBF1', // staff-100
  primarySurface: '#F0FDFA', // staff-50
  accent: '#F97316', // staff-accent (orange)
  gray: '#9CA3AF',
  grayLight: '#D1D5DB',
  white: '#FFFFFF',
} as const;

/** Teal gradient used by headers / immersive surfaces (LinearGradient colors). */
export const STAFF_GRADIENT = ['#0D9488', '#0F766E', '#115E59'] as const;

/** Soft elevation shared by cards for a modern, layered look. */
export const CARD_SHADOW: ViewStyle = {
  shadowColor: '#0F172A',
  shadowOpacity: 0.06,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
  elevation: 2,
};

/** One status label → NativeWind classes (bg + text) + a dot color for the pill. */
export interface StatusStyle {
  label: string;
  /** background class, e.g. `bg-emerald-100`. */
  bg: string;
  /** text class, e.g. `text-emerald-700`. */
  text: string;
  /** dot class, e.g. `bg-emerald-500`. */
  dot: string;
}

/** Room status (room map / housekeeping). */
export const ROOM_STATUS_STYLE: Record<RoomStatus, StatusStyle> = {
  available: { label: 'Available', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  occupied: { label: 'Occupied', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  cleaning: { label: 'Cleaning', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  maintenance: { label: 'Maintenance', bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
  blocked: { label: 'Blocked', bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
};

/** Trạng thái phòng THEO MỘT NGÀY CỤ THỂ (bản đồ phòng của lịch tồn kho) — khác `ROOM_STATUS_STYLE`
 *  vốn chỉ đúng cho HÔM NAY. `held` = booking confirmed đã gán trước, chưa check-in. */
export const ROOM_DAY_STATE_STYLE: Record<RoomDayState, StatusStyle> = {
  available: { label: 'Available', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  held: { label: 'Held', bg: 'bg-sky-50', text: 'text-sky-700', dot: 'bg-sky-500' },
  occupied: { label: 'Occupied', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  maintenance: { label: 'Maintenance', bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
  out_of_service: { label: 'Out of service', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
};

/** Housekeeping task status. */
export const HOUSEKEEPING_STATUS_STYLE: Record<HousekeepingStatus, StatusStyle> = {
  pending: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  in_progress: { label: 'In progress', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  done: { label: 'Done', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
};

/** Conversation status (inbox S04). */
export const CONVERSATION_STATUS_STYLE: Record<ConversationStatus, StatusStyle> = {
  open: { label: 'New', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  pending: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  active: { label: 'In progress', bg: 'bg-staff-50', text: 'text-staff-800', dot: 'bg-staff-500' },
  escalated: { label: 'Needs takeover', bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
  resolved: { label: 'Resolved', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  closed: { label: 'Closed', bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
};
