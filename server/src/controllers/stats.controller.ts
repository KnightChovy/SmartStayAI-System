import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import { statsService } from '../services';

export class StatsController {
  // [Public] Số liệu tổng cho trang chủ
  getPublicStats = catchAsync(async (_req: Request, res: Response): Promise<void> => {
    const stats = await statsService.getPublicStats();
    res.send(stats);
  });
}

export const statsController = new StatsController();
