import type { BookingStatus } from '@/types/bookings.type';

export interface StaffBookingCustomer {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
}

export interface StaffBookingRoomType {
  id: string;
  name: string;
}

/** Một phòng vật lý đã gán cho booking. */
export interface StaffBookingRoom {
  id: string;
  assignedAt: string;
  room: {
    id: string;
    roomNumber: string;
    floor?: number | null;
  };
}

export interface BookingVoucher {
  voucherCode: string;
  usedAt?: string | null;
}

export interface StaffBooking {
  id: string;
  bookingCode: string;
  hotelId: string;
  roomTypeId: string;
  checkInDate: string;
  checkOutDate: string;
  numNights: number;
  numGuests: number;
  totalAmount: string;
  status: BookingStatus;
  checkedInAt?: string | null;
  checkedOutAt?: string | null;
  createdAt: string;
  customer: StaffBookingCustomer;
  roomType: StaffBookingRoomType;
  bookingRooms: StaffBookingRoom[];
  voucher?: BookingVoucher | null;
}

export interface StaffBookingsParams {
  status?: BookingStatus;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface CheckInPayload {
  roomId?: string;
  voucherCode?: string;
}

export interface CheckOutPayload {
  extraCharge?: number;
}

export type HousekeepingStatus = 'pending' | 'in_progress' | 'done';

export interface HousekeepingTask {
  id: string;
  hotelId: string;
  roomId: string;
  bookingId?: string | null;
  status: HousekeepingStatus;
  note?: string | null;
  createdAt: string;
  completedAt?: string | null;
  room: {
    id: string;
    roomNumber: string;
    floor?: number | null;
    status: string;
  };
}

export interface HousekeepingParams {
  status?: HousekeepingStatus;
}

export type RoomStatus =
  | 'available'
  | 'occupied'
  | 'maintenance'
  | 'cleaning'
  | 'blocked';

export type RoomStatusUpdatable = Exclude<RoomStatus, 'blocked'>;

export interface StaffRoom {
  id: string;
  hotelId: string;
  roomTypeId: string;
  roomNumber: string;
  floor?: number | null;
  status: RoomStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  roomType: {
    id: string;
    name: string;
  };
}

export interface StaffRoomsParams {
  page?: number;
  limit?: number;
}

export type ConversationStatus =
  | 'open'
  | 'pending'
  | 'active'
  | 'escalated'
  | 'resolved'
  | 'closed';

export type ConversationChannel = 'web' | 'mobile' | 'email' | 'whatsapp';

export type MessageSenderType = 'guest' | 'staff' | 'ai' | 'system';

export type MessageType = 'text' | 'image' | 'file' | 'system_event';

export interface Message {
  id: string;
  conversationId: string;
  senderType: MessageSenderType;
  senderId?: string | null;
  content: string;
  messageType: MessageType;
  isAiSuggested: boolean;
  isApproved: boolean;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  status: ConversationStatus;
  subject?: string | null;
  channel: ConversationChannel;
  assignedTo?: string | null;
  lastMessageAt?: string | null;
  lastMessage?: string | null;
  customer?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
}

export interface Conversation {
  id: string;
  hotelId: string;
  userId?: string | null;
  bookingId?: string | null;
  channel: ConversationChannel;
  status: ConversationStatus;
  assignedTo?: string | null;
  subject?: string | null;
  startedAt: string;
  resolvedAt?: string | null;
  lastMessageAt?: string | null;
  messages: Message[];
}

export interface ConversationsParams {
  status?: ConversationStatus;
  page?: number;
  limit?: number;
}

export interface ReplyPayload {
  message: string;
}
