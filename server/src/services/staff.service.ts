import httpStatus from 'http-status';
import type { User } from '@prisma/client';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';
import sanitizeUser from '../utils/sanitizeUser';
import { hotelService } from './hotel.service';
import { userService } from './user.service';
import type { AddStaffDto } from '../dto/staff.dto';

// Nhân viên hiển thị kèm khi trả assignment cho màn quản lý của chủ KS
const assignmentInclude = {
  user: { select: { id: true, fullName: true, email: true, phone: true, status: true } },
};

export class StaffService {
  /**
   * Chủ KS (hoặc manager) tạo tài khoản nhân viên + gán vào khách sạn. Tài khoản tạo ra sẵn sàng
   * đăng nhập (status active) — không cần OTP vì chủ KS đứng ra bảo lãnh. assignedRole quyết định
   * luôn vai trò toàn cục của user. Sau bước này, getOperableHotel mới cho nhân viên check-in/out.
   */
  addStaff = async (hotelId: string, currentUser: User, payload: AddStaffDto) => {
    await hotelService.getManagedHotel(hotelId, currentUser);

    const existing = await userService.getUserByEmail(payload.email);

    // Email ĐÃ có tài khoản → GÁN LẠI (không tạo mới, giữ nguyên thông tin/mật khẩu tài khoản cũ)
    if (existing) {
      if (existing.role !== 'staff') {
        throw new ApiError(httpStatus.BAD_REQUEST, 'This email already belongs to a non-staff account');
      }
      // Luật 1 nhân viên = 1 khách sạn: chặn nếu đang có phân công còn hiệu lực
      const active = await prisma.hotelStaffAssignment.findFirst({
        where: { userId: existing.id, unassignedAt: null },
      });
      if (active) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          active.hotelId === hotelId
            ? 'This staff member is already working at this hotel'
            : 'This staff member is already working at another hotel (each staff member works at only one hotel)'
        );
      }
      const assignment = await prisma.hotelStaffAssignment.create({
        data: { hotelId, userId: existing.id, assignedRole: payload.assignedRole },
        include: assignmentInclude,
      });
      return { user: sanitizeUser(existing), assignment, reassigned: true };
    }

    // Chưa có tài khoản → TẠO MỚI (cần name + password) rồi gán
    if (!payload.name || !payload.password) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Full name and password are required to create a new staff account');
    }
    const user = await userService.createUser({
      name: payload.name,
      email: payload.email,
      password: payload.password,
      phone: payload.phone ?? null,
      role: payload.assignedRole,
    });
    const assignment = await prisma.hotelStaffAssignment.create({
      data: { hotelId, userId: user.id, assignedRole: payload.assignedRole },
      include: assignmentInclude,
    });
    return { user: sanitizeUser(user), assignment, reassigned: false };
  };

  /** Danh sách nhân viên đang làm việc tại khách sạn (assignment còn hiệu lực). */
  listStaff = async (hotelId: string, currentUser: User) => {
    await hotelService.getManagedHotel(hotelId, currentUser);
    return prisma.hotelStaffAssignment.findMany({
      where: { hotelId, unassignedAt: null },
      include: assignmentInclude,
      orderBy: { assignedAt: 'desc' },
    });
  };

  /** Chi tiết một nhân viên đang làm việc tại khách sạn (cho màn quản lý của chủ KS). */
  getStaffDetail = async (hotelId: string, userId: string, currentUser: User) => {
    await hotelService.getManagedHotel(hotelId, currentUser);
    const assignment = await prisma.hotelStaffAssignment.findFirst({
      where: { hotelId, userId, unassignedAt: null },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            avatarUrl: true,
            status: true,
            role: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
      },
    });
    if (!assignment) {
      throw new ApiError(httpStatus.NOT_FOUND, 'This staff member is not working at this hotel');
    }
    return assignment;
  };

  /** Bỏ gán một nhân viên khỏi khách sạn (không xoá tài khoản, chỉ kết thúc phân công). */
  removeStaff = async (hotelId: string, userId: string, currentUser: User) => {
    await hotelService.getManagedHotel(hotelId, currentUser);
    const assignment = await prisma.hotelStaffAssignment.findFirst({
      where: { hotelId, userId, unassignedAt: null },
    });
    if (!assignment) {
      throw new ApiError(httpStatus.NOT_FOUND, 'This staff member is not working at this hotel');
    }
    return prisma.hotelStaffAssignment.update({
      where: { id: assignment.id },
      data: { unassignedAt: new Date() },
    });
  };
}

export const staffService = new StaffService();
