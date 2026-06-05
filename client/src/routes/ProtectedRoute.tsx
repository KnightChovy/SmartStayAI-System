import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuthStore } from '@/stores/authStore';
import { getLandingPathForRole, type UserRole } from '@/constants/roles';

interface ProtectedRouteProps {
  /**
   * Các role được phép truy cập nhánh route này. Bỏ trống nghĩa là chỉ
   * cần đăng nhập (không giới hạn role).
   */
  allowedRoles?: UserRole[];
}

/**
 * Auth guard theo role. Dùng như một layout route bọc các route con:
 * - Chưa đăng nhập → chuyển về `/login` (giữ lại trang muốn vào để quay lại sau).
 * - Sai role → chuyển về cổng tương ứng với role hiện tại.
 * - Hợp lệ → render route con qua `<Outlet />`.
 */
export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const user = useAuthStore(state => state.user);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={getLandingPathForRole(user.role)} replace />;
  }

  return <Outlet />;
}
