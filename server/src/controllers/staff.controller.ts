import httpStatus from 'http-status';
import { Request, Response } from 'express';
import type { User } from '@prisma/client';
import catchAsync from '../utils/catchAsync';
import { staffService } from '../services';

export class StaffController {
  // Chủ KS tạo + gán nhân viên vào khách sạn
  addStaff = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const result = await staffService.addStaff(req.params.hotelId as string, req.user as User, req.body);
    res.status(httpStatus.CREATED).send(result);
  });

  // Danh sách nhân viên của khách sạn
  listStaff = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const result = await staffService.listStaff(req.params.hotelId as string, req.user as User);
    res.send(result);
  });

  // Bỏ gán một nhân viên khỏi khách sạn
  removeStaff = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const result = await staffService.removeStaff(
      req.params.hotelId as string,
      req.params.userId as string,
      req.user as User
    );
    res.send(result);
  });
}

export const staffController = new StaffController();
