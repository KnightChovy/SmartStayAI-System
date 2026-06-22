import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import { adminService } from '../services';

export class AdminController {
  // [Admin/Platform_manager] Số liệu tổng quan toàn sàn
  getOverview = catchAsync(async (_req: Request, res: Response): Promise<void> => {
    const overview = await adminService.getOverview();
    res.send(overview);
  });
}

export const adminController = new AdminController();
