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
} from '../../controllers';

const router = express.Router();

// Tìm khách sạn theo thành phố (kèm kiểm tra phòng trống khi có checkIn/checkOut) — public
router.get('/', validate(hotelValidation.searchHotels), hotelController.searchHotels);

// Danh sách khách sạn của partner đang đăng nhập (lấy id từ token).
// '/mine' là literal nên PHẢI đăng ký TRƯỚC '/:hotelId' (param) để khỏi bị '/:hotelId' nuốt.
router.get('/mine', auth(), hotelController.getMyHotels);

// Chi tiết một khách sạn cho guest — public, chỉ KS đang mở bán (isActive + isListed).
router.get('/:hotelId', validate(hotelValidation.getHotel), hotelController.getHotel);

// Chi tiết khách sạn cho chủ/manager — xem được CẢ KS chưa listed/đang chờ duyệt.
// 2 segment nên không đụng '/:hotelId' (1 segment) hay '/mine' (literal).
router.get('/:hotelId/manage', auth(), validate(hotelValidation.getHotel), hotelController.getHotelForManage);

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

router.put(
  '/:hotelId/room-types/:roomTypeId',
  auth(),
  validate(roomTypeValidation.updateRoomType),
  roomTypeController.updateRoomType
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

// ----- Quản lý phòng vật lý -----
router
  .route('/:hotelId/rooms')
  .get(auth(), validate(roomValidation.listRooms), roomController.listRooms)
  .post(auth(), validate(roomValidation.createRoom), roomController.createRoom);

router.put('/:hotelId/rooms/:roomId', auth(), validate(roomValidation.updateRoom), roomController.updateRoom);

// Staff đổi nhanh trạng thái phòng (bản đồ phòng S20 / housekeeping 1-tap)
router.patch(
  '/:hotelId/rooms/:roomId/status',
  auth(),
  validate(roomValidation.updateRoomStatus),
  roomController.updateRoomStatus
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

// ----- Vận hành booking (xem + check-in/out) — chủ KS, manager, hoặc staff được phân công -----
router.get(
  '/:hotelId/bookings',
  auth(),
  validate(bookingValidation.listHotelBookings),
  bookingController.listHotelBookings
);

// Chi tiết một booking của khách sạn (staff/chủ KS) — đặt sau '/bookings' để không bị nuốt
router.get(
  '/:hotelId/bookings/:bookingId',
  auth(),
  validate(bookingValidation.getHotelBooking),
  bookingController.getHotelBooking
);

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

router.delete(
  '/:hotelId/staff/:userId',
  auth(),
  validate(staffValidation.removeStaff),
  staffController.removeStaff
);

export default router;
