/**
 * Types cho Quản lý nhân viên khách sạn (`/v1/hotels/:hotelId/staff`) — partner/manager
 * tạo/gán/bỏ-gán nhân viên cho khách sạn của mình (quyền `getManagedHotel`).
 * Lưu ý: Date/DateTime của Prisma serialize qua JSON thành ISO 8601 **string**.
 */

import type { UserRole } from '@/constants/roles';

// ─── Shared enums ─────────────────────────────────────────────────────────────

export type UserStatus = 'active' | 'inactive' | 'suspended';

/** Role nội bộ có thể gán cho nhân viên khách sạn. */
export type StaffRole = 'staff' | 'marketer';

// ─── Entities ─────────────────────────────────────────────────────────────────

/** User rút gọn kèm trong một assignment. */
export interface StaffUser {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  status: UserStatus;
}

/** Bản ghi phân công nhân viên còn hiệu lực (kèm thông tin user). */
export interface StaffAssignment {
  id: string;
  hotelId: string;
  userId: string;
  assignedRole: StaffRole;
  assignedAt: string;
  unassignedAt: string | null;
  user: StaffUser;
}

/** Assignment scalar (không kèm `user`) — trả về khi bỏ gán nhân viên. */
export interface StaffAssignmentScalar {
  id: string;
  hotelId: string;
  userId: string;
  assignedRole: StaffRole;
  assignedAt: string;
  /** Đã set = thời điểm bỏ gán. */
  unassignedAt: string;
}

/** User đã được làm sạch (sanitize) trả về khi tạo tài khoản nhân viên. */
export interface SanitizedUser {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  role: UserRole;
  status: UserStatus;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

/** Body cho POST /hotels/:hotelId/staff. */
export interface AddStaffDto {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
  /** Mặc định 'staff' nếu bỏ trống. */
  assignedRole?: StaffRole;
}

/** Response 201 khi tạo + gán nhân viên. */
export interface AddStaffResponse {
  user: SanitizedUser;
  assignment: StaffAssignment;
}
