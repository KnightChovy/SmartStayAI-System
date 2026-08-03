import { UserRole } from '@/constants/roles';

/**
 * Bốn cổng nội bộ có bảng màu riêng (khai ở `styles/index.css` — khối "Role Themes Configuration").
 * Cổng guest không nằm ở đây vì nó dùng bảng màu thương hiệu chung, không phải màu theo vai trò.
 */
export type PortalRole = 'admin' | 'manager' | 'partner' | 'staff';

export interface RoleThemeTokens {
  /**
   * Mục điều hướng đang được chọn ở sidebar.
   *
   * PHẢI dùng modifier `data-active:` chứ không phải class thường. `sidebarMenuButtonVariants`
   * của shadcn có sẵn `data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground`,
   * mà dự án này KHÔNG định nghĩa `--sidebar-accent` ⇒ `var()` rỗng ⇒ nền trong suốt. Tailwind xếp
   * utility có variant SAU utility thường, nên một class `bg-...` trần luôn bị nó đè, và
   * tailwind-merge cũng không gộp được vì khác modifier. Dùng cùng modifier thì tailwind-merge
   * loại bỏ class của shadcn và giữ lại của mình.
   *
   * Đây là lý do mục đang chọn ở sidebar CHƯA TỪNG hiển thị nền — kể cả `bg-blue-50` nguyên bản.
   */
  navActive: string;
  /** Ô logo ở đầu sidebar. */
  logo: string;
  /** Chữ/icon mang màu nhấn của cổng (dùng cho spinner, số liệu nổi bật...). */
  accentText: string;
  /** Nền màu nhấn — dùng cho nút hành động chính. */
  accentBg: string;
  /** Nền nhạt cùng tông — dùng cho badge, ô icon. */
  accentSoft: string;
  /** Hover của nút thu/mở sidebar trên navbar. */
  toggleHover: string;
}

/**
 * Class Tailwind ở đây BẮT BUỘC là chuỗi literal.
 *
 * Tailwind quét mã nguồn theo văn bản, nên `bg-role-${role}-light` sẽ không sinh ra class nào —
 * giao diện im lặng mất màu mà không có lỗi build nào báo. Vì vậy mỗi vai trò viết tay đủ bộ,
 * chấp nhận lặp để đổi lại việc màu chắc chắn được build ra.
 */
export const ROLE_THEME: Record<PortalRole, RoleThemeTokens> = {
  admin: {
    navActive:
      'data-active:bg-role-admin-light data-active:text-role-admin-primary data-active:font-semibold',
    logo: 'bg-role-admin-primary text-white',
    accentText: 'text-role-admin-primary',
    accentBg: 'bg-role-admin-primary text-white hover:bg-role-admin-secondary',
    accentSoft: 'bg-role-admin-light text-role-admin-primary',
    toggleHover:
      'group-hover:bg-role-admin-light group-hover:text-role-admin-primary',
  },
  manager: {
    navActive:
      'data-active:bg-role-manager-light data-active:text-role-manager-primary data-active:font-semibold',
    logo: 'bg-role-manager-primary text-white',
    accentText: 'text-role-manager-primary',
    accentBg:
      'bg-role-manager-primary text-white hover:bg-role-manager-secondary',
    accentSoft: 'bg-role-manager-light text-role-manager-primary',
    toggleHover:
      'group-hover:bg-role-manager-light group-hover:text-role-manager-primary',
  },
  partner: {
    navActive:
      'data-active:bg-role-partner-light data-active:text-role-partner-primary data-active:font-semibold',
    logo: 'bg-role-partner-primary text-white',
    accentText: 'text-role-partner-primary',
    accentBg:
      'bg-role-partner-primary text-white hover:bg-role-partner-secondary',
    accentSoft: 'bg-role-partner-light text-role-partner-primary',
    toggleHover:
      'group-hover:bg-role-partner-light group-hover:text-role-partner-primary',
  },
  staff: {
    navActive:
      'data-active:bg-role-staff-light data-active:text-role-staff-primary data-active:font-semibold',
    logo: 'bg-role-staff-primary text-white',
    accentText: 'text-role-staff-primary',
    accentBg: 'bg-role-staff-primary text-white hover:bg-role-staff-secondary',
    accentSoft: 'bg-role-staff-light text-role-staff-primary',
    toggleHover:
      'group-hover:bg-role-staff-light group-hover:text-role-staff-primary',
  },
};

/**
 * Suy cổng từ role của tài khoản. Dùng khi một component dùng chung được mount ở nhiều cổng và
 * không nhận được `role` qua prop. Role lạ/không đăng nhập trả về 'manager' (tông trung tính nhất
 * trong 4 bảng màu) thay vì ném lỗi — sai màu nhẹ hơn nhiều so với trắng màn hình.
 */
export function portalRoleFor(role?: string | null): PortalRole {
  switch (role) {
    case UserRole.ADMIN:
      return 'admin';
    case UserRole.PLATFORM_MANAGER:
      return 'manager';
    case UserRole.HOTEL_PARTNER:
      return 'partner';
    case UserRole.STAFF:
      return 'staff';
    default:
      return 'manager';
  }
}
