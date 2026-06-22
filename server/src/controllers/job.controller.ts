import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import { bookingService } from '../services';

// Các handler cho CRON NGOÀI gọi (qua /v1/internal/jobs/..., đã chặn bằng cronAuth).
export class JobController {
  // Nhả các booking giữ chỗ đã quá hạn 15' (chưa thanh toán) → trả tồn kho
  releaseHolds = catchAsync(async (_req: Request, res: Response): Promise<void> => {
    const released = await bookingService.releaseExpiredHolds();
    res.send({ released });
  });

  // Đánh dấu no-show các booking đã qua kỳ ở mà không nhận phòng
  sweepNoShows = catchAsync(async (_req: Request, res: Response): Promise<void> => {
    const noShow = await bookingService.sweepNoShows();
    res.send({ noShow });
  });
}

export const jobController = new JobController();
