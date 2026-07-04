import { Request, Response } from 'express';
import type { User } from '@prisma/client';
import pick from '../utils/pick';
import catchAsync from '../utils/catchAsync';
import { revenueService } from '../services';

export class RevenueController {
  // [Chủ KS / manager] Báo cáo doanh thu khách sạn theo khoảng thời gian
  getHotelRevenue = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const options = pick(req.query, ['from', 'to', 'groupBy']);
    const result = await revenueService.getHotelRevenue(req.params.hotelId as string, req.user as User, options);
    res.send(result);
  });

  // [Chủ KS / manager] Số dư ví + lịch sử giao dịch của khách sạn
  getHotelWallet = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const options = pick(req.query, ['type', 'limit', 'page']);
    const result = await revenueService.getHotelWallet(req.params.hotelId as string, req.user as User, options);
    res.send(result);
  });

  // [Chủ KS / manager] Analytics vận hành + điểm số của khách sạn
  getHotelAnalytics = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const options = pick(req.query, ['from', 'to']);
    const result = await revenueService.getHotelAnalytics(req.params.hotelId as string, req.user as User, options);
    res.send(result);
  });
}

export const revenueController = new RevenueController();
