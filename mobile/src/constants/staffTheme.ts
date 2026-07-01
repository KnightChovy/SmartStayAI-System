import type {
  ConversationStatus,
  HousekeepingStatus,
  RoomStatus,
} from '@/types/staff.type';

export const STAFF_COLORS = {
  primary: '#0F766E',
  primaryDark: '#134E4A',
  primaryLight: '#CCFBF1',
  primarySurface: '#F0FDFA',
  accent: '#F97316',
  gray: '#9CA3AF',
  grayLight: '#D1D5DB',
  white: '#FFFFFF',
} as const;

export interface StatusStyle {
  label: string;

  bg: string;

  text: string;
}

export const ROOM_STATUS_STYLE: Record<RoomStatus, StatusStyle> = {
  available: { label: 'Trống', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  occupied: { label: 'Đang ở', bg: 'bg-blue-100', text: 'text-blue-700' },
  cleaning: { label: 'Đang dọn', bg: 'bg-amber-100', text: 'text-amber-700' },
  maintenance: { label: 'Bảo trì', bg: 'bg-rose-100', text: 'text-rose-700' },
  blocked: { label: 'Khoá', bg: 'bg-gray-200', text: 'text-gray-600' },
};

export const HOUSEKEEPING_STATUS_STYLE: Record<
  HousekeepingStatus,
  StatusStyle
> = {
  pending: { label: 'Chờ dọn', bg: 'bg-amber-100', text: 'text-amber-700' },
  in_progress: { label: 'Đang dọn', bg: 'bg-blue-100', text: 'text-blue-700' },
  done: { label: 'Đã xong', bg: 'bg-emerald-100', text: 'text-emerald-700' },
};

export const CONVERSATION_STATUS_STYLE: Record<
  ConversationStatus,
  StatusStyle
> = {
  open: { label: 'Mới', bg: 'bg-blue-100', text: 'text-blue-700' },
  pending: { label: 'Chờ xử lý', bg: 'bg-amber-100', text: 'text-amber-700' },
  active: { label: 'Đang xử lý', bg: 'bg-staff-100', text: 'text-staff-800' },
  escalated: {
    label: 'Cần tiếp quản',
    bg: 'bg-rose-100',
    text: 'text-rose-700',
  },
  resolved: {
    label: 'Đã xong',
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
  },
  closed: { label: 'Đã đóng', bg: 'bg-gray-200', text: 'text-gray-600' },
};
