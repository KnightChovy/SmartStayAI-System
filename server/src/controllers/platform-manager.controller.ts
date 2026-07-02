import { Request, Response } from 'express';
import pick from '../utils/pick';
import catchAsync from '../utils/catchAsync';
import { platformManagerService } from '../services';

export class PlatformManagerController {
  // Danh sách toàn bộ đối tác (hotel_partner)
  listPartners = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const filter = pick(req.query, ['search', 'status']);
    const options = pick(req.query, ['limit', 'page']);
    const result = await platformManagerService.listPartners(filter, options);
    res.send(result);
  });

  // Báo cáo analytics toàn sàn
  getAnalytics = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const query = pick(req.query, ['period', 'range', 'topLimit']);
    const result = await platformManagerService.getPlatformAnalytics(query);
    res.send(result);
  });

  // Bảng xếp hạng hiệu suất toàn sàn
  getPerformanceLeaderboard = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const query = pick(req.query, ['from', 'to']);
    const result = await platformManagerService.getPerformanceLeaderboard(query);
    res.send(result);
  });

  // Hiệu suất + điểm chi tiết của 1 khách sạn
  getHotelPerformance = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const query = pick(req.query, ['from', 'to']);
    const result = await platformManagerService.getHotelPerformance(req.params.hotelId as string, query);
    res.send(result);
  });
}

export const platformManagerController = new PlatformManagerController();
