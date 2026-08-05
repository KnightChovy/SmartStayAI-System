import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import {
  platformManagerValidation,
  bookingValidation,
  refundValidation,
  commissionRateValidation,
} from '../../validations';
import {
  platformManagerController,
  bookingController,
  refundController,
  commissionRateController,
} from '../../controllers';

const router = express.Router();

// Tất cả endpoint dưới đây dành cho Platform Manager (quyền viewPlatformStats; admin cũng có quyền này).

// Danh sách toàn bộ đối tác (hotel_partner)
router.get(
  '/partners',
  auth('viewPlatformStats'),
  validate(platformManagerValidation.listPartners),
  platformManagerController.listPartners
);

// Đình chỉ / khôi phục đối tác — biện pháp xử lý vi phạm, KHÔNG dùng để can thiệp mức hoa hồng
// đã cam kết (thoả thuận còn hiệu lực là bất khả xâm phạm).
router.patch(
  '/partners/:partnerId/status',
  auth('manageHotels'),
  validate(platformManagerValidation.setPartnerStatus),
  platformManagerController.setPartnerStatus
);

// Toàn bộ booking toàn sàn (lọc theo KS/đối tác/trạng thái/ngày + tìm kiếm)
router.get(
  '/bookings',
  auth('viewPlatformStats'),
  validate(bookingValidation.listPlatformBookings),
  bookingController.listPlatformBookings
);

// Báo cáo analytics toàn sàn
router.get(
  '/analytics',
  auth('viewPlatformStats'),
  validate(platformManagerValidation.getAnalytics),
  platformManagerController.getAnalytics
);

// Bảng xếp hạng hiệu suất toàn sàn
router.get(
  '/performance',
  auth('viewPlatformStats'),
  validate(platformManagerValidation.getPerformanceLeaderboard),
  platformManagerController.getPerformanceLeaderboard
);

// Hiệu suất + điểm chi tiết của 1 khách sạn
router.get(
  '/hotels/:hotelId/performance',
  auth('viewPlatformStats'),
  validate(platformManagerValidation.getHotelPerformance),
  platformManagerController.getHotelPerformance
);

// ===== Hoàn tiền (manageCommissions) =====
// Khách sạn là bên DUYỆT/TỪ CHỐI (PATCH /hotels/:hotelId/refunds/:refundId/review).
// Platform Manager là bên THỰC THI chuyển khoản, vì tiền khách trả nằm ở tài khoản của platform
// (mô hình escrow) chứ không nằm ở khách sạn — khách sạn không có tiền để tự hoàn.
router.get(
  '/refunds',
  auth('manageCommissions'),
  validate(refundValidation.listAllRefunds),
  refundController.listAllRefunds
);
router.patch(
  '/refunds/:refundId/process',
  auth('manageCommissions'),
  validate(refundValidation.processRefund),
  refundController.processRefund
);

// ===== Mức hoa hồng (manageCommissions) =====
// Đối tác nộp đơn xin giảm cho từng khách sạn (POST /hotels/:hotelId/commission-requests);
// Platform Manager duyệt tại đây, và là bên duy nhất đặt được mức hoa hồng nền cho toàn sàn.
router.get(
  '/commission-requests',
  auth('manageCommissions'),
  validate(commissionRateValidation.listRequests),
  commissionRateController.listRequests
);
router.patch(
  '/commission-requests/:requestId/review',
  auth('manageCommissions'),
  validate(commissionRateValidation.reviewRequest),
  commissionRateController.reviewRequest
);
router
  .route('/commission-rate')
  .get(auth('manageCommissions'), commissionRateController.getBaseRate)
  .put(auth('manageCommissions'), validate(commissionRateValidation.setBaseRate), commissionRateController.setBaseRate);

export default router;
