/**
 * Hệ thống role của StayHub. Giá trị phải khớp với backend
 * (`server/src/config/roles.ts`).
 */
export const UserRole = {
  GUEST: 'guest',
  CUSTOMER: 'customer',
  STAFF: 'staff',
  MARKETER: 'marketer',
  HOTEL_PARTNER: 'hotel_partner',
  PLATFORM_MANAGER: 'platform_manager',
  ADMIN: 'admin',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

/**
 * Trang đích sau khi đăng nhập, theo từng role.
 * - Admin / Platform manager → cổng quản trị.
 * - Hotel partner → cổng đối tác.
 * - Còn lại (guest/customer/...) → trang chủ.
 */
export const ROLE_HOME_ROUTE: Record<UserRole, string> = {
  [UserRole.ADMIN]: '/admin/dashboard',
  [UserRole.PLATFORM_MANAGER]: '/manager/dashboard',
  [UserRole.HOTEL_PARTNER]: '/partner/dashboard',
  [UserRole.GUEST]: '/',
  [UserRole.CUSTOMER]: '/',
  [UserRole.STAFF]: '/staff/dashboard',
  [UserRole.MARKETER]: '/',
};

/**
 * Trả về đường dẫn điều hướng phù hợp với role. Role không xác định
 * sẽ về trang chủ để tránh điều hướng nhầm vào cổng có bảo vệ.
 */
export function getLandingPathForRole(role?: string | null): string {
  if (!role) return '/';
  return ROLE_HOME_ROUTE[role as UserRole] ?? '/';
}
