import { api } from '@/lib/api';
import type {
  AddStaffDto,
  AddStaffResponse,
  StaffAssignment,
  StaffAssignmentScalar,
} from '@/types/hotel-staff.types';

/**
 * Tầng gọi API quản lý nhân viên khách sạn (`/v1/hotels/:hotelId/staff`).
 * Tất cả endpoint cần token chủ khách sạn hoặc quyền `manageHotels` (`getManagedHotel`).
 */
export const hotelStaffService = {
  /** #1 GET /hotels/:hotelId/staff — danh sách nhân viên còn hiệu lực. */
  async list(hotelId: string): Promise<StaffAssignment[]> {
    const { data } = await api.get<StaffAssignment[]>(`/hotels/${hotelId}/staff`);
    return data;
  },

  /** #2 POST /hotels/:hotelId/staff — tạo tài khoản + gán nhân viên. */
  async add(hotelId: string, dto: AddStaffDto): Promise<AddStaffResponse> {
    const { data } = await api.post<AddStaffResponse>(`/hotels/${hotelId}/staff`, dto);
    return data;
  },

  /** #3 DELETE /hotels/:hotelId/staff/:userId — bỏ gán nhân viên (soft-unassign). */
  async remove(hotelId: string, userId: string): Promise<StaffAssignmentScalar> {
    const { data } = await api.delete<StaffAssignmentScalar>(
      `/hotels/${hotelId}/staff/${userId}`
    );
    return data;
  },
};
