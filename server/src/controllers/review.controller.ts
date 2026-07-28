import httpStatus from 'http-status';
import { Request, Response } from 'express';
import type { User } from '@prisma/client';
import pick from '../utils/pick';
import catchAsync from '../utils/catchAsync';
import { reviewService } from '../services';

export class ReviewController {
  // Khách viết đánh giá sau khi trả phòng
  createReview = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const review = await reviewService.createReview(req.user as User, req.body);
    res.status(httpStatus.CREATED).send(review);
  });

  // Danh sách đánh giá công khai của một khách sạn
  getHotelReviews = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const filter = pick(req.query, ['hotelId']) as { hotelId: string };
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await reviewService.getHotelReviews(filter, options);
    res.send(result);
  });

  // [Public] Đánh giá tiêu biểu cho carousel trang chủ
  getFeaturedReviews = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const result = await reviewService.getFeaturedReviews(limit);
    res.send(result);
  });

  // Đánh giá của chính khách đang đăng nhập (mọi trạng thái)
  getMyReviews = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await reviewService.getMyReviews(req.user as User, options);
    res.send(result);
  });

  // Khách sửa đánh giá của chính mình
  updateMyReview = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const review = await reviewService.updateMyReview(req.user as User, req.params.reviewId as string, req.body);
    res.send(review);
  });

  // Khách xoá đánh giá của chính mình
  deleteMyReview = catchAsync(async (req: Request, res: Response): Promise<void> => {
    await reviewService.deleteMyReview(req.user as User, req.params.reviewId as string);
    res.status(httpStatus.NO_CONTENT).send();
  });

  // [Partner] Đánh giá của chính khách sạn mình (mọi trạng thái)
  getHotelReviewsForPartner = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const filter = pick(req.query, ['status']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await reviewService.getHotelReviewsForPartner(
      req.params.hotelId as string,
      req.user as User,
      filter,
      options
    );
    res.send(result);
  });

  // [Partner] Thống kê đánh giá của khách sạn
  getHotelReviewStats = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const stats = await reviewService.getHotelReviewStats(req.params.hotelId as string, req.user as User);
    res.send(stats);
  });

  // [Public] Thống kê đánh giá cho trang chi tiết khách sạn
  getPublicHotelReviewStats = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const stats = await reviewService.getPublicHotelReviewStats(req.params.hotelId as string);
    res.send(stats);
  });

  // Chi tiết một đánh giá
  getReview = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const review = await reviewService.getReviewById(req.params.reviewId as string);
    res.send(review);
  });
}

export const reviewController = new ReviewController();
