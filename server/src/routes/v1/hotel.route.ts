import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import {
  hotelValidation,
  roomTypeValidation,
  roomValidation,
  pricingRuleValidation,
  bookingValidation,
  staffValidation,
  housekeepingValidation,
  conversationValidation,
  reviewValidation,
  revenueValidation,
  refundValidation,
  commissionRateValidation,
  payoutValidation,
} from '../../validations';
import {
  hotelController,
  roomTypeController,
  roomController,
  pricingRuleController,
  bookingController,
  staffController,
  housekeepingController,
  conversationController,
  reviewController,
  revenueController,
  refundController,
  commissionRateController,
  payoutController,
} from '../../controllers';

const router = express.Router();

// Tìm khách sạn theo thành phố (kèm kiểm tra phòng trống khi có checkIn/checkOut) — public
router.get('/', validate(hotelValidation.searchHotels), hotelController.searchHotels);

// Danh sách khách sạn của partner đang đăng nhập (lấy id từ token).
// '/mine' là literal nên PHẢI đăng ký TRƯỚC '/:hotelId' (param) để khỏi bị '/:hotelId' nuốt.
router.get('/mine', auth(), hotelController.getMyHotels);

// Khách sạn staff được phân công (bản của staff, tương tự '/mine' của partner) — literal 2 segment
router.get('/staff/mine', auth(), hotelController.getMyStaffHotels);

// Preset chính sách huỷ — public, literal nên đặt TRƯỚC '/:hotelId' để khỏi bị param nuốt.
router.get('/cancellation-presets', hotelController.getCancellationPresets);

// Chi tiết một khách sạn cho guest — public, chỉ KS đang mở bán (isActive + isListed).
router.get('/:hotelId', validate(hotelValidation.getHotel), hotelController.getHotel);

// Chi tiết khách sạn cho chủ/manager — xem được CẢ KS chưa listed/đang chờ duyệt.
// 2 segment nên không đụng '/:hotelId' (1 segment) hay '/mine' (literal).
router.get('/:hotelId/manage', auth(), validate(hotelValidation.getHotel), hotelController.getHotelForManage);

// Báo cáo doanh thu + ví của khách sạn (chủ KS / manager; service kiểm quyền qua getOperableHotel).
router.get('/:hotelId/revenue', auth(), validate(revenueValidation.getHotelRevenue), revenueController.getHotelRevenue);
router.get('/:hotelId/wallet', auth(), validate(revenueValidation.getHotelWallet), revenueController.getHotelWallet);
router.get('/:hotelId/analytics', auth(), validate(revenueValidation.getHotelAnalytics), revenueController.getHotelAnalytics);

// Rút tiền: CHỦ KS tạo yêu cầu rút từ số dư khả dụng + xem lịch sử (service kiểm đúng owner).
// Platform Manager là bên DUYỆT + chuyển khoản (xem routes/platform-manager.route.ts).
router.post('/:hotelId/payouts', auth(), validate(payoutValidation.requestPayout), payoutController.requestPayout);
router.get('/:hotelId/payouts', auth(), validate(payoutValidation.listHotelPayouts), payoutController.listHotelPayouts);

// Mức hoa hồng nền tảng thu của khách sạn + đơn xin giảm (chủ KS; service kiểm qua getManagedHotel).
// Đơn nộp ở đây, còn duyệt nằm bên /platform-manager/commission-requests.
router.get(
  '/:hotelId/commission-rate',
  auth(),
  validate(commissionRateValidation.getHotelRate),
  commissionRateController.getHotelRate
);
router
  .route('/:hotelId/commission-requests')
  .get(auth(), validate(commissionRateValidation.listHotelRequests), commissionRateController.listHotelRequests)
  .post(auth(), validate(commissionRateValidation.createRequest), commissionRateController.createRequest);

// Partner tự bật/tắt mở bán (publish) khách sạn của mình — chủ KS hoặc quyền manageHotels (service tự kiểm)
router.patch(
  '/:hotelId/publish',
  auth(),
  validate(hotelValidation.setHotelListing),
  hotelController.setHotelListing
);

// Partner cập nhật hồ sơ khách sạn (PATCH /:hotelId khác method với GET /:hotelId public)
router.patch('/:hotelId', auth(), validate(hotelValidation.updateHotel), hotelController.updateHotel);

// ----- Quản lý ảnh khách sạn (chủ KS / manageHotels) -----
router.post(
  '/:hotelId/images',
  auth(),
  validate(hotelValidation.addHotelImages),
  hotelController.addHotelImages
);

router.delete(
  '/:hotelId/images/:imageId',
  auth(),
  validate(hotelValidation.hotelImageId),
  hotelController.deleteHotelImage
);

router.patch(
  '/:hotelId/images/:imageId/primary',
  auth(),
  validate(hotelValidation.hotelImageId),
  hotelController.setPrimaryHotelImage
);

// ----- Quản lý tiện nghi khách sạn (chủ KS / manageHotels) -----
router
  .route('/:hotelId/amenities')
  // Danh sách tiện nghi đã gán cho KS (màn quản trị) — chỉ kiểm params
  .get(auth(), validate(hotelValidation.getHotel), hotelController.getHotelAmenities)
  // Gán lại toàn bộ tiện nghi của KS (replace, kèm isFree/quantity)
  .put(auth(), validate(hotelValidation.setHotelAmenities), hotelController.setHotelAmenities);

// ----- Liên hệ / chính sách / địa điểm lân cận của khách sạn (chủ KS / manageHotels) -----
router
  .route('/:hotelId/contacts')
  .get(auth(), validate(hotelValidation.hotelIdParam), hotelController.getHotelContacts)
  .put(auth(), validate(hotelValidation.setHotelContacts), hotelController.setHotelContacts);

// Điều khoản = văn bản cho khách đọc, KHÔNG ảnh hưởng tiền
router
  .route('/:hotelId/policies')
  .get(auth(), validate(hotelValidation.hotelIdParam), hotelController.getHotelPolicies)
  .put(auth(), validate(hotelValidation.setHotelPolicies), hotelController.setHotelPolicies);

// Khoản thu (thuế/phí) = con số cộng vào tiền đơn. Tách khỏi /policies có chủ đích: sửa câu chữ
// và sửa tiền là hai việc khác nhau, không nên nằm chung một form.
router
  .route('/:hotelId/charges')
  .get(auth(), validate(hotelValidation.hotelIdParam), hotelController.getHotelCharges)
  .put(auth(), validate(hotelValidation.setHotelCharges), hotelController.setHotelCharges);

router
  .route('/:hotelId/nearby-places')
  .get(auth(), validate(hotelValidation.hotelIdParam), hotelController.getHotelNearbyPlaces)
  .put(auth(), validate(hotelValidation.setHotelNearbyPlaces), hotelController.setHotelNearbyPlaces);

// ----- Quản lý loại phòng (chủ khách sạn hoặc quyền manageHotels — service tự kiểm) -----
router
  .route('/:hotelId/room-types')
  // Tìm loại phòng theo bộ lọc — public (chỉ thấy loại đang bán)
  .get(validate(hotelValidation.getRoomTypes), hotelController.getRoomTypes)
  .post(auth(), validate(roomTypeValidation.createRoomType), roomTypeController.createRoomType);

// Danh sách quản trị: thấy cả loại phòng đã tắt + số phòng vật lý
router.get(
  '/:hotelId/room-types/manage',
  auth(),
  validate(roomTypeValidation.listRoomTypes),
  roomTypeController.listRoomTypes
);

// Chi tiết một loại phòng cho guest — public. Đặt SAU '/manage' (literal) để param không nuốt route đó.
router.get('/:hotelId/room-types/:roomTypeId', validate(hotelValidation.getRoomType), hotelController.getRoomType);

router.put(
  '/:hotelId/room-types/:roomTypeId',
  auth(),
  validate(roomTypeValidation.updateRoomType),
  roomTypeController.updateRoomType
);

// Xoá loại phòng — chỉ khi chưa có phòng/booking (đã dùng thì tắt bằng isActive=false)
router.delete(
  '/:hotelId/room-types/:roomTypeId',
  auth(),
  validate(roomTypeValidation.deleteRoomType),
  roomTypeController.deleteRoomType
);

// Thêm ảnh (URL đã upload qua POST /v1/uploads trước)
router.post(
  '/:hotelId/room-types/:roomTypeId/images',
  auth(),
  validate(roomTypeValidation.addImages),
  roomTypeController.addImages
);

// Gán lại toàn bộ tiện nghi (N-N, thay thế danh sách cũ)
router.put(
  '/:hotelId/room-types/:roomTypeId/amenities',
  auth(),
  validate(roomTypeValidation.setAmenities),
  roomTypeController.setAmenities
);

// Cấu hình giường của loại phòng (xem + gán lại toàn bộ)
router
  .route('/:hotelId/room-types/:roomTypeId/beds')
  .get(auth(), validate(roomTypeValidation.getBeds), roomTypeController.getBeds)
  .put(auth(), validate(roomTypeValidation.setBeds), roomTypeController.setBeds);

// ----- Quản lý phòng vật lý -----
router
  .route('/:hotelId/rooms')
  .get(auth(), validate(roomValidation.listRooms), roomController.listRooms)
  .post(auth(), validate(roomValidation.createRoom), roomController.createRoom);

router.put('/:hotelId/rooms/:roomId', auth(), validate(roomValidation.updateRoom), roomController.updateRoom);

// Xoá phòng vật lý — chỉ khi phòng chưa từng được đặt
router.delete('/:hotelId/rooms/:roomId', auth(), validate(roomValidation.deleteRoom), roomController.deleteRoom);

// Lối vào CŨ của bản đồ phòng — giữ để FE hiện tại không gãy. Service dịch từng giá trị về đúng
// chiều của nó và từ chối 'occupied'. Nên chuyển dần sang hai endpoint bên dưới.
router.patch(
  '/:hotelId/rooms/:roomId/status',
  auth(),
  validate(roomValidation.updateRoomStatus),
  roomController.updateRoomStatus
);

// Buồng phòng đổi trạng thái dọn phòng (dirty/cleaning/clean/inspected)
router.patch(
  '/:hotelId/rooms/:roomId/housekeeping',
  auth(),
  validate(roomValidation.updateHousekeeping),
  roomController.updateHousekeeping
);

// Lịch tồn kho theo từng đêm — nguồn DUY NHẤT cho màn "Rooms & inventory" của staff, thay cho việc
// FE tự ghép rooms + room-blocks + bookings rồi tính lại công thức của BE.
router.get(
  '/:hotelId/inventory/calendar',
  auth(),
  validate(roomValidation.getInventoryCalendar),
  roomController.getInventoryCalendar
);

// ----- Đợt chặn phòng (bảo trì theo khoảng ngày) -----
// Danh sách phải đứng TRƯỚC '/:roomId/blocks' để param không nuốt mất route này
router.get('/:hotelId/room-blocks', auth(), validate(roomValidation.listBlocks), roomController.listBlocks);

// POST ...?dryRun=true chỉ kiểm tra xung đột, không ghi gì
router.post('/:hotelId/rooms/:roomId/blocks', auth(), validate(roomValidation.createBlock), roomController.createBlock);

// Sửa đợt chặn đang mở (gia hạn / rút ngắn ngày kết thúc, sửa lý do, chi phí dự kiến)
router.patch(
  '/:hotelId/rooms/:roomId/blocks/:blockId',
  auth(),
  validate(roomValidation.updateBlock),
  roomController.updateBlock
);

// Đánh dấu đã sửa xong (không xoá bản ghi — còn dùng để thống kê chi phí sự cố)
router.delete(
  '/:hotelId/rooms/:roomId/blocks/:blockId',
  auth(),
  validate(roomValidation.resolveBlock),
  roomController.resolveBlock
);

// ----- Quản lý pricing rule -----
router
  .route('/:hotelId/pricing-rules')
  .get(auth(), validate(pricingRuleValidation.listRules), pricingRuleController.listRules)
  .post(auth(), validate(pricingRuleValidation.createRule), pricingRuleController.createRule);

router
  .route('/:hotelId/pricing-rules/:ruleId')
  .put(auth(), validate(pricingRuleValidation.updateRule), pricingRuleController.updateRule)
  .delete(auth(), validate(pricingRuleValidation.deleteRule), pricingRuleController.deleteRule);

// ----- Yêu cầu hoàn tiền của khách sạn — chủ KS, manager, hoặc staff được phân công duyệt -----
router.get(
  '/:hotelId/refunds',
  auth(),
  validate(refundValidation.listHotelRefunds),
  refundController.listHotelRefunds
);
router.patch(
  '/:hotelId/refunds/:refundId/review',
  auth(),
  validate(refundValidation.reviewRefund),
  refundController.reviewRefund
);

// ----- Vận hành booking (xem + check-in/out) — chủ KS, manager, hoặc staff được phân công -----
router.get(
  '/:hotelId/bookings',
  auth(),
  validate(bookingValidation.listHotelBookings),
  bookingController.listHotelBookings
);

// Staff quét QR / nhập mã voucher để tra booking — đặt TRƯỚC '/:bookingId' để literal không bị nuốt
router.get(
  '/:hotelId/bookings/lookup',
  auth(),
  validate(bookingValidation.lookupBookingByVoucher),
  bookingController.lookupByVoucher
);

// Chi tiết một booking của khách sạn (staff/chủ KS) — đặt sau '/bookings' để không bị nuốt
router.get(
  '/:hotelId/bookings/:bookingId',
  auth(),
  validate(bookingValidation.getHotelBooking),
  bookingController.getHotelBooking
);

// Chốt phòng vật lý TRƯỚC khi khách tới (đơn confirmed). Không đổi rooms.status — phòng chỉ thật sự
// chuyển sang 'occupied' lúc check-in.
router
  .route('/:hotelId/bookings/:bookingId/assign-room')
  .post(auth(), validate(bookingValidation.assignRoom), bookingController.assignRoom)
  .delete(auth(), validate(bookingValidation.releaseAssignedRoom), bookingController.releaseAssignedRoom);

router.post(
  '/:hotelId/bookings/:bookingId/check-in',
  auth(),
  validate(bookingValidation.checkInBooking),
  bookingController.checkIn
);

router.post(
  '/:hotelId/bookings/:bookingId/check-out',
  auth(),
  validate(bookingValidation.checkOutBooking),
  bookingController.checkOut
);

// Staff thu tiền mặt cho booking trả tại khách sạn (đánh dấu đã thanh toán + ghi hoa hồng)
router.post(
  '/:hotelId/bookings/:bookingId/record-cash-payment',
  auth(),
  validate(bookingValidation.recordCashPayment),
  bookingController.recordCashPayment
);

// Staff đánh dấu khách no-show (không đến nhận phòng)
router.post(
  '/:hotelId/bookings/:bookingId/no-show',
  auth(),
  validate(bookingValidation.markNoShow),
  bookingController.markNoShow
);

// ----- Housekeeping (S22) — staff được phân công xem + hoàn thành task dọn phòng -----
router.get(
  '/:hotelId/housekeeping',
  auth(),
  validate(housekeepingValidation.listTasks),
  housekeepingController.listTasks
);

router.post(
  '/:hotelId/housekeeping/:taskId/complete',
  auth(),
  validate(housekeepingValidation.completeTask),
  housekeepingController.completeTask
);

// ----- Hộp thư hội thoại (S04) — nhân viên xem & trả lời, đặc biệt các hội thoại 'escalated' -----
router.get(
  '/:hotelId/conversations',
  auth(),
  validate(conversationValidation.listHotelConversations),
  conversationController.listHotelConversations
);

// Chi tiết 1 hội thoại — đặt sau '/conversations' để '/:conversationId' không nuốt route danh sách
router.get(
  '/:hotelId/conversations/:conversationId',
  auth(),
  validate(conversationValidation.getHotelConversation),
  conversationController.getHotelConversation
);

router.post(
  '/:hotelId/conversations/:conversationId/reply',
  auth(),
  validate(conversationValidation.replyConversation),
  conversationController.replyConversation
);

router.post(
  '/:hotelId/conversations/:conversationId/resolve',
  auth(),
  validate(conversationValidation.resolveConversation),
  conversationController.resolveConversation
);

// ----- Quản lý tài khoản nhân viên (S08) — chỉ chủ KS / manager -----
router
  .route('/:hotelId/staff')
  .get(auth(), validate(staffValidation.listStaff), staffController.listStaff)
  .post(auth(), validate(staffValidation.addStaff), staffController.addStaff);

// Chi tiết một nhân viên của khách sạn (chủ KS / manageHotels)
router.get('/:hotelId/staff/:userId', auth(), validate(staffValidation.getStaff), staffController.getStaff);

router.delete(
  '/:hotelId/staff/:userId',
  auth(),
  validate(staffValidation.removeStaff),
  staffController.removeStaff
);

// Thống kê đánh giá cho trang chi tiết của KHÁCH — public, không cần đăng nhập.
// Số liệu giống hệt '/reviews/stats' của partner (cùng một hàm tính, chỉ đếm review đã published);
// tách endpoint riêng vì phạm vi xem khác nhau: bản này CHỈ trả khách sạn đang mở bán, còn bản
// partner cho chủ KS xem cả khách sạn chưa lên sàn.
router.get(
  '/:hotelId/review-stats',
  validate(reviewValidation.getPublicHotelReviewStats),
  reviewController.getPublicHotelReviewStats
);

// ----- Đánh giá của khách sạn (partner xem review KS mình + thống kê) -----
// '/reviews/stats' (literal) đặt TRƯỚC '/reviews' cho rõ ràng; cả hai chỉ GET, chủ KS / manageHotels.
router.get(
  '/:hotelId/reviews/stats',
  auth(),
  validate(reviewValidation.getHotelReviewStats),
  reviewController.getHotelReviewStats
);
router.get(
  '/:hotelId/reviews',
  auth(),
  validate(reviewValidation.getHotelReviewsForPartner),
  reviewController.getHotelReviewsForPartner
);

export default router;
