import { Navigate, useLocation } from 'react-router';
import { ROUTES } from '@/constants/routes';

/**
 * `/staff/rooms` (bản đồ phòng cũ) đã gộp vào lịch tồn kho. Giữ đường dẫn để link/bookmark cũ không
 * gãy, và **mang theo query string** vì link cũ có thể còn `?room=101` (ô tìm kiếm toàn cục).
 */
export function RoomMapRedirect() {
  const { search } = useLocation();
  return <Navigate to={`${ROUTES.staffInventory}${search}`} replace />;
}
