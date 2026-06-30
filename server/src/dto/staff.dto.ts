/**
 * Payload chủ khách sạn tạo tài khoản nhân viên rồi gán vào khách sạn.
 * assignedRole quyết định luôn vai trò toàn cục của user: hiện chỉ còn 'staff' (vận hành).
 */
export interface AddStaffDto {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
  assignedRole: 'staff';
}
