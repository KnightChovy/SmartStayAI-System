import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import { hotelValidation, roomTypeValidation, roomValidation, pricingRuleValidation } from '../../validations';
import { hotelController, roomTypeController, roomController, pricingRuleController } from '../../controllers';

const router = express.Router();

// Tìm khách sạn theo thành phố (kèm kiểm tra phòng trống khi có checkIn/checkOut) — public
router.get('/', validate(hotelValidation.searchHotels), hotelController.searchHotels);

// Chi tiết một khách sạn (profile cho guest) — public, chỉ KS đang mở bán.
// '/:hotelId' khớp 1 segment nên không đụng các route '/:hotelId/...' bên dưới.
router.get('/:hotelId', validate(hotelValidation.getHotel), hotelController.getHotel);

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

// ----- Quản lý pricing rule -----
router
  .route('/:hotelId/pricing-rules')
  .get(auth(), validate(pricingRuleValidation.listRules), pricingRuleController.listRules)
  .post(auth(), validate(pricingRuleValidation.createRule), pricingRuleController.createRule);

router
  .route('/:hotelId/pricing-rules/:ruleId')
  .put(auth(), validate(pricingRuleValidation.updateRule), pricingRuleController.updateRule)
  .delete(auth(), validate(pricingRuleValidation.deleteRule), pricingRuleController.deleteRule);

export default router;
