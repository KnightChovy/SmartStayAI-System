/**
 * Payload chủ khách sạn thêm nhân viên vào khách sạn. Một endpoint làm 2 việc theo email:
 * - Email CHƯA có tài khoản → tạo mới (cần name + password) rồi gán.
 * - Email ĐÃ có tài khoản staff → GÁN LẠI vào KS (bỏ qua name/password).
 * assignedRole quyết định vai trò toàn cục của user: hiện chỉ còn 'staff' (vận hành).
 */
export interface AddStaffDto {
  name?: string; // bắt buộc khi tạo mới; bỏ qua khi gán lại
  email: string;
  password?: string; // bắt buộc khi tạo mới; bỏ qua khi gán lại
  phone?: string | null;
  assignedRole: 'staff';
}
