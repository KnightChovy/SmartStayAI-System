import { io, type Socket } from 'socket.io-client';

import { API_BASE_URL } from './api';
import { useAuthStore } from '@/stores/authStore';

/**
 * Socket.IO gắn chung HTTP server của BE nên nối vào ORIGIN, không phải base URL của REST:
 * 'http://localhost:5000/v1' → 'http://localhost:5000'. Giữ '/v1' sẽ hỏng handshake.
 */
const SOCKET_URL = API_BASE_URL.replace(/\/v1$/, '');

// Một instance duy nhất cho cả app (giống `api` của axios): nhiều nơi cùng nghe vẫn dùng chung một
// kết nối, và socket sống xuyên qua điều hướng route.
let socket: Socket | null = null;
// Token đã dùng để bắt tay — BE chỉ xác thực MỘT LẦN ở middleware `io.use`, nên đổi danh tính thì
// phải nối lại chứ không thể "vá" kết nối đang mở.
let handshakeToken: string | undefined;

/**
 * Kết nối hiện tại, tự tạo ở lần gọi đầu và tự nối lại khi token đổi (đăng nhập/đăng xuất).
 * Token trống vẫn kết nối được: BE cho phép khách vãng lai (user = null), quyền vào room kiểm riêng
 * lúc join.
 */
export const getSocket = (): Socket => {
  const token = useAuthStore.getState().accessToken ?? undefined;

  if (socket && handshakeToken !== token) {
    socket.disconnect();
    socket = null;
  }

  if (!socket) {
    handshakeToken = token;
    socket = io(SOCKET_URL, { auth: { token } });
  }

  return socket;
};

/** Ngắt và bỏ instance hiện tại (dùng khi cần dọn dẹp thủ công, vd lúc đăng xuất). */
export const resetSocket = (): void => {
  socket?.disconnect();
  socket = null;
  handshakeToken = undefined;
};
