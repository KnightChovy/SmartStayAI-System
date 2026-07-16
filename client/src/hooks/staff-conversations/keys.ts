import type { StaffConversationsParams } from '@/types/staff-conversation.types';

/** Query key factory cho hộp thư hội thoại của staff (scope theo khách sạn đang trực). */
export const staffConversationKeys = {
  all: ['staff-conversations'] as const,
  /** Mọi danh sách của một KS — dùng làm prefix để invalidate bất kể filter/paging. */
  lists: (hotelId: string) => ['staff-conversations', 'list', hotelId] as const,
  list: (hotelId: string, params: StaffConversationsParams) =>
    ['staff-conversations', 'list', hotelId, params] as const,
  detail: (hotelId: string, conversationId: string) =>
    ['staff-conversations', 'detail', hotelId, conversationId] as const,
};
