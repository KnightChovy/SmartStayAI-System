import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import { reviewValidation } from '../../validations';
import { reviewController } from '../../controllers';

const router = express.Router();

// Khách (đã đăng nhập) viết đánh giá sau khi trả phòng
router.post('/', auth(), validate(reviewValidation.createReview), reviewController.createReview);

// Danh sách đánh giá công khai của một khách sạn (?hotelId=...) — public
router.get('/', validate(reviewValidation.getHotelReviews), reviewController.getHotelReviews);

// Chi tiết một đánh giá — public
router.get('/:reviewId', validate(reviewValidation.getReview), reviewController.getReview);

export default router;
