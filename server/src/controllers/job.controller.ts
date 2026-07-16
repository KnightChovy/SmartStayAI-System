import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import { bookingService, adminService, refundService } from '../services';

// Các handler kích TAY các job nền (qua /v1/internal/jobs/..., chặn bằng cronAuth).
// Các job này đã tự chạy theo lịch trong config/scheduler.ts — đây chỉ là nút bấm khi cần chạy ngay.
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

  // Tự duyệt yêu cầu hoàn tiền khách sạn để quá hạn không phản hồi → chuyển sang chờ PM chuyển khoản
  autoApproveRefunds = catchAsync(async (_req: Request, res: Response): Promise<void> => {
    const approved = await refundService.autoApproveStaleRefunds();
    res.send({ approved });
  });
}

export const jobController = new JobController();
