import cron from 'node-cron';
import config from './config';
import logger from './logger';
import { bookingService } from '../services/booking.service';
import { adminService } from '../services/admin.service';
import { refundService } from '../services/refund.service';

// Giờ Việt Nam để lịch chạy khớp với nghiệp vụ (Render chạy UTC).
const TIMEZONE = 'Asia/Ho_Chi_Minh';

/**
 * Chạy một job định kỳ, nuốt lỗi để một job hỏng không làm chết tiến trình
 * (cron chạy ngoài vòng request nên không có error handler nào đỡ).
 */
const runJob = async (name: string, job: () => Promise<number>): Promise<void> => {
  try {
    const affected = await job();
    if (affected > 0) {
      logger.info(`[Cron] ${name}: xử lý ${affected} bản ghi`);
    }
  } catch (error) {
    logger.error(`[Cron] ${name} lỗi: ${(error as Error).message}`);
  }
};

/**
 * Khởi động các job chạy nền. Gọi một lần khi app start.
 *
 * Vì sao chạy trong app thay vì cron ngoài: cấu hình cron ngoài nằm ngoài repo nên rất dễ quên/mất
 * khi tạo lại service — và đó chính là điều đã xảy ra (settle-commissions chưa từng chạy, tiền khách
 * sạn kẹt ở balancePending). Để trong code thì deploy là chạy, không ai phải nhớ.
 *
 * Endpoint /internal/jobs/* vẫn giữ để kích tay khi cần (idempotent nên chạy chồng vô hại).
 *
 * Lưu ý Render free: tiến trình ngủ khi không có traffic nên job có thể lỡ nhịp. Không sao —
 * cả 3 job đều quét theo ĐIỀU KIỆN dữ liệu (không theo "đã chạy lần nào chưa") và update có điều
 * kiện, nên chạy trễ vẫn đúng, chỉ là xử lý muộn hơn.
 */
export const startScheduler = (): void => {
  if (!config.scheduler.enabled) {
    logger.info('[Cron] Scheduler đang TẮT (SCHEDULER_ENABLED=false)');
    return;
  }

  // Nhả tồn kho của booking quá hạn giữ chỗ — 5 phút/lần.
  // createBooking cũng gọi lười hàm này, nhưng nếu không ai đặt phòng thì phòng hết hạn vẫn bị
  // khoá và biến mất khỏi kết quả tìm kiếm ⇒ vẫn cần quét định kỳ.
  cron.schedule('*/5 * * * *', () => runJob('release-holds', () => bookingService.releaseExpiredHolds()), {
    timezone: TIMEZONE,
  });

  // Đánh dấu no-show cho booking đã qua kỳ ở mà không nhận phòng — 02:00 hằng ngày.
  cron.schedule('0 2 * * *', () => runJob('sweep-no-shows', () => bookingService.sweepNoShows()), {
    timezone: TIMEZONE,
  });

  // Tất toán hoa hồng đủ điều kiện (đã trả phòng + qua kỳ giữ) ⇒ nhả tiền pending→available cho
  // khách sạn — 03:00 hằng ngày. Đây là job DUY NHẤT không có đường thoát nào khác.
  cron.schedule('0 3 * * *', () => runJob('settle-commissions', () => adminService.settleEligibleCommissions()), {
    timezone: TIMEZONE,
  });

  // Tự duyệt yêu cầu hoàn tiền khách sạn để quá hạn không phản hồi — 04:00 hằng ngày.
  // Không có job này thì khách sạn chỉ cần im lặng là khách không bao giờ nhận được tiền.
  cron.schedule('0 4 * * *', () => runJob('auto-approve-refunds', () => refundService.autoApproveStaleRefunds()), {
    timezone: TIMEZONE,
  });

  // Cộng vào ví các khoản hoàn ĐÃ DUYỆT mà khách chọn nhận qua ví — 04:10, ngay sau job tự duyệt.
  // Yêu cầu do cron tự duyệt không đi qua reviewRefund nên không được cộng ngay; thiếu job này thì
  // chúng treo ở 'approved' vĩnh viễn, vì hoàn vào ví vốn không cần Platform Manager động tay.
  cron.schedule('10 4 * * *', () => runJob('credit-wallet-refunds', () => refundService.processApprovedWalletRefunds()), {
    timezone: TIMEZONE,
  });

  logger.info(
    `[Cron] Đã bật scheduler (${TIMEZONE}): release-holds mỗi 5', sweep-no-shows 02:00, ` +
      `settle-commissions 03:00, auto-approve-refunds 04:00, credit-wallet-refunds 04:10`
  );
};
