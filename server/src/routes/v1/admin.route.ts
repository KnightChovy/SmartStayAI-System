import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import { adminValidation, refundValidation } from '../../validations';
import { adminController, refundController } from '../../controllers';

const router = express.Router();

// Tổng quan toàn sàn — admin / platform_manager (viewPlatformStats)
router.get('/overview', auth('viewPlatformStats'), adminController.getOverview);

// Doanh thu nền tảng (GMV, hoa hồng, net, so sánh kỳ trước) — viewPlatformStats
router.get('/revenue', auth('viewPlatformStats'), validate(adminValidation.getPlatformRevenue), adminController.getPlatformRevenue);

// ===== Pha 3 — Hoa hồng / payout (manageCommissions) =====
router.get('/commissions', auth('manageCommissions'), validate(adminValidation.listCommissions), adminController.listCommissions);
router.patch(
  '/commissions/:commissionId/settle',
  auth('manageCommissions'),
  validate(adminValidation.settleCommission),
  adminController.settleCommission
);

// ===== Hoàn tiền — admin xem toàn sàn + đánh dấu đã chuyển khoản (manageCommissions) =====
// Duyệt/từ chối là việc của khách sạn (PATCH /hotels/:hotelId/refunds/:refundId/review),
// admin chỉ THỰC THI chuyển khoản cho các yêu cầu đã được duyệt.
router.get('/refunds', auth('manageCommissions'), validate(refundValidation.listAllRefunds), refundController.listAllRefunds);
router.patch(
  '/refunds/:refundId/process',
  auth('manageCommissions'),
  validate(refundValidation.processRefund),
  refundController.processRefund
);

// ===== Pha 4 — Giám sát khách sạn (manageHotels) =====
router.get('/hotels', auth('manageHotels'), validate(adminValidation.listHotels), adminController.listHotels);
router.patch('/hotels/:hotelId', auth('manageHotels'), validate(adminValidation.updateHotelFlags), adminController.updateHotelFlags);

// Analytics & Performance đã tách sang /platform-manager/* (platform-manager.route.ts)

// ===== Pha 5 — Audit log (viewPlatformStats) =====
router.get('/audit-logs', auth('viewPlatformStats'), validate(adminValidation.listAuditLogs), adminController.listAuditLogs);

// ===== Pha 6 — Giao dịch thanh toán toàn sàn (viewPlatformStats) =====
router.get('/payments', auth('viewPlatformStats'), validate(adminValidation.listPayments), adminController.listPayments);

export default router;
