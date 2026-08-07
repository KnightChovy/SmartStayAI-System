import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Prisma } from '@prisma/client';
import type { User } from '@prisma/client';
import pick from '../utils/pick';
import catchAsync from '../utils/catchAsync';
import { payoutService } from '../services';

export class PayoutController {
  // [Chủ KS] Tạo yêu cầu rút tiền từ số dư khả dụng
  requestPayout = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const amount = new Prisma.Decimal(req.body.amount);
    const result = await payoutService.requestPayout(req.params.hotelId as string, req.user as User, amount);
    res.status(httpStatus.CREATED).send(result);
  });

  // [Chủ KS] Đổi/tạo tài khoản nhận tiền (chính) của khách sạn
  updatePayoutAccount = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const body = pick(req.body, [
      'accountHolder',
      'bankName',
      'accountNumber',
      'bankBranch',
      'swiftCode',
      'taxIdVatNumber',
      'registeredBusinessAddress',
    ]);
    const result = await payoutService.updatePayoutAccount(
      req.params.hotelId as string,
      req.user as User,
      body as Parameters<typeof payoutService.updatePayoutAccount>[2]
    );
    res.send(result);
  });

  // [Chủ KS / manager] Lịch sử yêu cầu rút của khách sạn
  listHotelPayouts = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const options = pick(req.query, ['status', 'page', 'limit']);
    const result = await payoutService.listHotelPayouts(req.params.hotelId as string, req.user as User, options);
    res.send(result);
  });

  // [Platform Manager] Danh sách yêu cầu rút toàn sàn
  listPlatformPayouts = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const options = pick(req.query, ['status', 'page', 'limit']);
    const result = await payoutService.listPlatformPayouts(options);
    res.send(result);
  });

  // [Platform Manager] Chi tiết 1 yêu cầu rút kèm số tài khoản (đã giải mã) để chuyển khoản
  getPayout = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const result = await payoutService.getPayoutForManager(req.params.payoutId as string);
    res.send(result);
  });

  // [Platform Manager] Duyệt / từ chối 1 yêu cầu rút
  reviewPayout = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const input = pick(req.body, ['payoutTransactionId', 'notes']);
    const result = await payoutService.reviewPayout(req.params.payoutId as string, req.body.decision, input);
    res.send(result);
  });
}

export const payoutController = new PayoutController();
