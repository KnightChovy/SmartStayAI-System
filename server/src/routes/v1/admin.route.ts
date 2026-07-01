import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import { adminValidation } from '../../validations';
import { adminController } from '../../controllers';

const router = express.Router();

// Tổng quan toàn sàn — admin / platform_manager (viewPlatformStats)
router.get('/overview', auth('viewPlatformStats'), adminController.getOverview);

// ===== Pha 3 — Hoa hồng / payout (manageCommissions) =====
router.get('/commissions', auth('manageCommissions'), validate(adminValidation.listCommissions), adminController.listCommissions);
router.patch(
  '/commissions/:commissionId/settle',
  auth('manageCommissions'),
  validate(adminValidation.settleCommission),
  adminController.settleCommission
);

// ===== Pha 4 — Giám sát khách sạn (manageHotels) =====
router.get('/hotels', auth('manageHotels'), validate(adminValidation.listHotels), adminController.listHotels);
router.patch('/hotels/:hotelId', auth('manageHotels'), validate(adminValidation.updateHotelFlags), adminController.updateHotelFlags);

// ===== Analytics & Performance (viewPlatformStats) — Platform Manager =====
router.get('/analytics', auth('viewPlatformStats'), validate(adminValidation.getAnalytics), adminController.getAnalytics);
// Bảng xếp hạng hiệu suất toàn sàn
router.get('/performance', auth('viewPlatformStats'), validate(adminValidation.getPerformanceLeaderboard), adminController.getPerformanceLeaderboard);
// Hiệu suất + điểm chi tiết của 1 khách sạn
router.get(
  '/hotels/:hotelId/performance',
  auth('viewPlatformStats'),
  validate(adminValidation.getHotelPerformance),
  adminController.getHotelPerformance
);

// ===== Pha 5 — Audit log (viewPlatformStats) =====
router.get('/audit-logs', auth('viewPlatformStats'), validate(adminValidation.listAuditLogs), adminController.listAuditLogs);

export default router;
