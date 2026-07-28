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

// Đánh giá của chính khách đang đăng nhập (mọi trạng thái) — PHẢI đứng trước '/:reviewId'
// (nếu không '/me' sẽ khớp ':reviewId' và trượt validate uuid → 400).
router.get('/me', auth(), validate(reviewValidation.getMyReviews), reviewController.getMyReviews);
// '/featured' (literal) PHẢI đứng trước '/:reviewId' kẻo bị nuốt thành reviewId — public, không auth
router.get('/featured', validate(reviewValidation.getFeaturedReviews), reviewController.getFeaturedReviews);

// Chi tiết một đánh giá — public
router.get('/:reviewId', validate(reviewValidation.getReview), reviewController.getReview);

// Khách sửa / xoá đánh giá của CHÍNH mình (kiểm quyền sở hữu trong service)
router.patch('/:reviewId', auth(), validate(reviewValidation.updateMyReview), reviewController.updateMyReview);
router.delete('/:reviewId', auth(), validate(reviewValidation.deleteMyReview), reviewController.deleteMyReview);

export default router;
