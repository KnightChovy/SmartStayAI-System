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

    // Tạo tài khoản (băm mật khẩu + chặn email trùng nằm trong userService.createUser)
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

    return { user: sanitizeUser(user), assignment };
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
      throw new ApiError(httpStatus.NOT_FOUND, 'Nhân viên này không đang làm việc tại khách sạn');
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
      throw new ApiError(httpStatus.NOT_FOUND, 'Nhân viên này không đang làm việc tại khách sạn');
    }
    return prisma.hotelStaffAssignment.update({
      where: { id: assignment.id },
      data: { unassignedAt: new Date() },
    });
  };
}

export const staffService = new StaffService();
