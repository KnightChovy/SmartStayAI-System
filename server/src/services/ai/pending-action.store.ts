/**
 * Một hành động GHI (đặt/huỷ phòng) ĐÃ được kiểm tra hợp lệ ở bước "prepare" và đang CHỜ KHÁCH
 * XÁC NHẬN. Đây là "cổng xác nhận" (human-in-the-loop) của agent: tách ý định khỏi thực thi để
 * agent không tự ý đặt/huỷ — gây mất tiền của khách.
 */
export interface PendingAction {
  type: 'create_booking' | 'cancel_booking';
  customerId: string; // chỉ ĐÚNG khách đã tạo ra phiếu mới được xác nhận nó
  payload: Record<string, unknown>; // tham số đã validate, sẵn sàng đưa vào service
  summary: string; //               tóm tắt để agent đọc lại cho khách
  expiresAt: number; //             hết hạn sau ít phút (mốc Date.now() tính bằng ms)
}

// Phiếu chờ chỉ sống ngắn — đủ cho khách đọc tóm tắt rồi đồng ý trong cùng một lượt trò chuyện.
const TTL_MS = 10 * 60 * 1000; // 10 phút

/**
 * Kho chứa trong RAM, khoá theo conversationId — mỗi hội thoại giữ ĐÚNG MỘT phiếu chờ
 * (đề xuất mới nhất ghi đè cái cũ). Vì sao khoá theo hội thoại chứ không phải một "mã xác nhận"
 * gửi cho LLM: lịch sử lưu lại CHỈ gồm tin khách + câu trả lời cuối của bot, KHÔNG gồm các
 * kết quả tool trung gian ⇒ một mã trả trong tool sẽ biến mất ở lượt sau. Phiếu nằm server-side,
 * khoá theo conversationId thì TỰ sống qua các lượt mà LLM không phải "nhớ" gì.
 * Mất khi restart server: chấp nhận được vì phiếu chỉ sống vài phút của một lượt xác nhận.
 */
const store = new Map<string, PendingAction>();

/** Đặt/ghi đè phiếu chờ cho một hội thoại (bước prepare gọi). */
export const setPendingAction = (conversationId: string, action: Omit<PendingAction, 'expiresAt'>): void => {
  store.set(conversationId, { ...action, expiresAt: Date.now() + TTL_MS });
};

/**
 * Lấy & XOÁ (dùng-một-lần) phiếu chờ của hội thoại. Chỉ trả về khi còn hạn VÀ đúng khách.
 * Trả null nếu không có / hết hạn / không thuộc về khách này.
 */
export const consumePendingAction = (conversationId: string, customerId: string): PendingAction | null => {
  const action = store.get(conversationId);
  if (!action) {
    return null;
  }
  store.delete(conversationId); // dùng-một-lần: xoá ngay để không thể confirm lại lần hai
  if (action.expiresAt < Date.now() || action.customerId !== customerId) {
    return null;
  }
  return action;
};
