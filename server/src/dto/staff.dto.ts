/**
 * Payload chủ khách sạn tạo tài khoản nhân viên rồi gán vào khách sạn.
 * assignedRole quyết định luôn vai trò toàn cục của user: 'staff' (vận hành) hoặc 'marketer'.
 */
export interface AddStaffDto {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
  assignedRole: 'staff' | 'marketer';
}
