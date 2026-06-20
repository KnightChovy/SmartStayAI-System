import { Request, Response } from 'express';
import type { User } from '@prisma/client';
import pick from '../utils/pick';
import catchAsync from '../utils/catchAsync';
import { housekeepingService } from '../services';

export class HousekeepingController {
  // Danh sách task dọn phòng của khách sạn
  listTasks = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const filter = pick(req.query, ['status']);
    const result = await housekeepingService.listTasks(req.params.hotelId as string, req.user as User, filter);
    res.send(result);
  });

  // Hoàn thành task dọn phòng (1-tap) — trả phòng về available
  completeTask = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const task = await housekeepingService.completeTask(
      req.params.hotelId as string,
      req.params.taskId as string,
      req.user as User
    );
    res.send(task);
  });
}

export const housekeepingController = new HousekeepingController();
