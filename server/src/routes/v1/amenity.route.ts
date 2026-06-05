import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import { amenityValidation } from '../../validations';
import { amenityController } from '../../controllers';

const router = express.Router();

router
  .route('/')
  // Danh sách tiện nghi — public (client render bộ lọc / form gán tiện nghi)
  .get(validate(amenityValidation.listAmenities), amenityController.listAmenities)
  // Tạo tiện nghi mới — chỉ admin (quyền manageAmenities)
  .post(auth('manageAmenities'), validate(amenityValidation.createAmenity), amenityController.createAmenity);

export default router;
