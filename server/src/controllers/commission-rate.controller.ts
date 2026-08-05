import { Request, Response } from 'express';
import httpStatus from 'http-status';
import type { User } from '@prisma/client';
import pick from '../utils/pick';
import catchAsync from '../utils/catchAsync';
import { commissionRateService } from '../services';

export class CommissionRateController {
  // [Đối tác] Mức hoa hồng đang áp cho khách sạn + hạn ưu đãi + có được nộp đơn không
  getHotelRate = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const summary = await commissionRateService.getHotelRateSummary(
      req.params.hotelId as string,
      req.user as User
    );
    res.send(summary);
  });

  // [Đối tác] Nộp đơn xin giảm hoa hồng
  createRequest = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const request = await commissionRateService.createRequest(
      req.params.hotelId as string,
      req.user as User,
      req.body
    );
    res.status(httpStatus.CREATED).send(request);
  });

  // [Đối tác] Lịch sử đơn của một khách sạn
  listHotelRequests = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const filter = pick(req.query, ['status']);
    const options = pick(req.query, ['limit', 'page']);
    const result = await commissionRateService.listHotelRequests(
      req.params.hotelId as string,
      req.user as User,
      filter,
      options
    );
    res.send(result);
  });

  // [Platform Manager] Hàng chờ đơn toàn sàn
  listRequests = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const filter = pick(req.query, ['status', 'hotelId']);
    const options = pick(req.query, ['limit', 'page']);
    const result = await commissionRateService.listRequests(filter, options);
    res.send(result);
  });

  // [Platform Manager] Duyệt / từ chối một đơn
  reviewRequest = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const request = await commissionRateService.reviewRequest(
      req.params.requestId as string,
      req.user as User,
      req.body
    );
    res.send(request);
  });

  // [Platform Manager] Mức nền đang áp + lịch sử + mức đã lên lịch
  getBaseRate = catchAsync(async (_req: Request, res: Response): Promise<void> => {
    const result = await commissionRateService.getBaseRateHistory();
    res.send(result);
  });

  // [Platform Manager] Đặt mức hoa hồng nền mới cho toàn sàn
  setBaseRate = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const rate = await commissionRateService.setBaseRate(req.user as User, req.body);
    res.status(httpStatus.CREATED).send(rate);
  });
}

export const commissionRateController = new CommissionRateController();
