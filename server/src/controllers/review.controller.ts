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

  // Chi tiết một đánh giá
  getReview = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const review = await reviewService.getReviewById(req.params.reviewId as string);
    res.send(review);
  });
}

export const reviewController = new ReviewController();
