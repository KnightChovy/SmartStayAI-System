import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import { bookingService, adminService } from '../services';

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

  // Tự tất toán hoa hồng đủ điều kiện (booking đã check-out + qua kỳ giữ) → ví chuyển pending→available
  settleCommissions = catchAsync(async (_req: Request, res: Response): Promise<void> => {
    const settled = await adminService.settleEligibleCommissions();
    res.send({ settled });
  });
}

export const jobController = new JobController();
