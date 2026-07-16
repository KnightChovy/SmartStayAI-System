import { Request, Response } from 'express';
import type { User } from '@prisma/client';
import pick from '../utils/pick';
import catchAsync from '../utils/catchAsync';
import { refundService } from '../services';

export class RefundController {
  // [KS] Danh sách yêu cầu hoàn tiền của một khách sạn (chủ KS / manager / staff được phân công)
  listHotelRefunds = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const filter = pick(req.query, ['status']);
    const options = pick(req.query, ['limit', 'page']);
    const result = await refundService.listHotelRefunds(
      req.params.hotelId as string,
      req.user as User,
      filter,
      options
    );
    res.send(result);
  });

  // [KS] Duyệt / từ chối một yêu cầu hoàn tiền
  reviewRefund = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const refund = await refundService.reviewRefund(
      req.params.hotelId as string,
      req.params.refundId as string,
      req.user as User,
      req.body
    );
    res.send(refund);
  });

  // [Admin/PM] Danh sách yêu cầu hoàn tiền toàn sàn
  listAllRefunds = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const filter = pick(req.query, ['status', 'hotelId']);
    const options = pick(req.query, ['limit', 'page']);
    const result = await refundService.listAllRefunds(filter, options);
    res.send(result);
  });

  // [Admin] Đánh dấu đã chuyển khoản hoàn tiền xong cho yêu cầu đã duyệt
  processRefund = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const refund = await refundService.processRefund(
      req.params.refundId as string,
      req.user as User,
      req.body
    );
    res.send(refund);
  });
}

export const refundController = new RefundController();
