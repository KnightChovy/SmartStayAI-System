import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import { adminValidation } from '../../validations';
import { adminController } from '../../controllers';

const router = express.Router();

// Tổng quan toàn sàn — admin / platform_manager (viewPlatformStats)
router.get('/overview', auth('viewPlatformStats'), adminController.getOverview);

// Doanh thu nền tảng (GMV, hoa hồng, net, so sánh kỳ trước) — viewPlatformStats
router.get('/revenue', auth('viewPlatformStats'), validate(adminValidation.getPlatformRevenue), adminController.getPlatformRevenue);
// Doanh thu CHI TIẾT theo từng đối tác / khách sạn / thành phố (drill-down) — viewPlatformStats
router.get(
  '/revenue/breakdown',
  auth('viewPlatformStats'),
  validate(adminValidation.getRevenueBreakdown),
  adminController.getRevenueBreakdown
);

// ===== Pha 3 — Hoa hồng / payout (manageCommissions) =====
router.get('/commissions', auth('manageCommissions'), validate(adminValidation.listCommissions), adminController.listCommissions);
router.patch(
  '/commissions/:commissionId/settle',
  auth('manageCommissions'),
  validate(adminValidation.settleCommission),
  adminController.settleCommission
);

// Hoàn tiền đã chuyển sang /platform-manager/refunds (platform-manager.route.ts) —
// Platform Manager là người giữ tài khoản nhận tiền nên họ thực thi chuyển khoản hoàn.

// ===== Pha 4 — Giám sát khách sạn (manageHotels) =====
router.get('/hotels', auth('manageHotels'), validate(adminValidation.listHotels), adminController.listHotels);
router.patch('/hotels/:hotelId', auth('manageHotels'), validate(adminValidation.updateHotelFlags), adminController.updateHotelFlags);

// Analytics & Performance đã tách sang /platform-manager/* (platform-manager.route.ts)

// ===== Pha 5 — Audit log (viewPlatformStats) =====
router.get('/audit-logs', auth('viewPlatformStats'), validate(adminValidation.listAuditLogs), adminController.listAuditLogs);

// ===== Pha 6 — Giao dịch thanh toán toàn sàn (viewPlatformStats) =====
router.get('/payments', auth('viewPlatformStats'), validate(adminValidation.listPayments), adminController.listPayments);

export default router;
