import httpStatus from 'http-status';
import type { Prisma, User } from '@prisma/client';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';
import { hotelService } from './hotel.service';
import type { HousekeepingFilter } from '../dto/housekeeping.dto';

// Phòng kèm theo khi trả task cho màn housekeeping của staff
const taskInclude = {
  room: { select: { id: true, roomNumber: true, floor: true, status: true } },
} satisfies Prisma.HousekeepingTaskInclude;

export class HousekeepingService {
  /**
   * [S22] Danh sách task dọn phòng của khách sạn, lọc theo trạng thái. Cho staff được phân công
   * (getOperableHotel). Mặc định xếp cũ trước để dọn theo thứ tự phát sinh.
   */
  listTasks = async (hotelId: string, currentUser: User, filter: HousekeepingFilter) => {
    await hotelService.getOperableHotel(hotelId, currentUser);
    const where: Prisma.HousekeepingTaskWhereInput = { hotelId };
    if (filter.status) {
      where.status = filter.status;
    }
    return prisma.housekeepingTask.findMany({ where, include: taskInclude, orderBy: { createdAt: 'asc' } });
  };

  /**
   * [S22] Hoàn thành task dọn phòng (1-tap): task → done, và nếu phòng đang 'cleaning' thì trả về
   * 'available' (có điều kiện để không ghi đè khi phòng đã sang trạng thái khác).
   */
  completeTask = async (hotelId: string, taskId: string, currentUser: User) => {
    await hotelService.getOperableHotel(hotelId, currentUser);
    const task = await prisma.housekeepingTask.findFirst({ where: { id: taskId, hotelId } });
    if (!task) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Housekeeping task not found');
    }
    if (task.status === 'done') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Task already completed');
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.housekeepingTask.update({
        where: { id: taskId },
        data: { status: 'done', completedAt: new Date() },
        include: taskInclude,
      });
      // Dọn xong ⇒ phòng sẵn sàng bán lại (chỉ khi vẫn đang cleaning — điều kiện này cũng khiến
      // phòng đang bị chặn để sửa không bị vô tình mở bán lại, vì status của nó là 'maintenance').
      // hkExpectedUntil về null: SLA đã kết thúc, để lại thì FE đếm ngược một cái hạn đã qua.
      await tx.room.updateMany({
        where: { id: task.roomId, status: 'cleaning' },
        data: { status: 'available', hkStatus: 'clean', hkStatusSince: new Date(), hkExpectedUntil: null },
      });
      return updated;
    });
  };
}

export const housekeepingService = new HousekeepingService();
