import httpStatus from 'http-status';
import { Prisma } from '@prisma/client';
import type { User } from '@prisma/client';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';
import type { CreateReviewDto, ReviewFilter, ReviewQueryOptions } from '../dto/review.dto';

// Quan hệ kèm theo khi trả review về client (kèm người viết + ảnh)
const reviewInclude = {
  customer: { select: { id: true, fullName: true } },
  images: { orderBy: { uploadedAt: 'asc' } },
} satisfies Prisma.ReviewInclude;

export class ReviewService {
  /**
   * Khách viết đánh giá sau khi đã trả phòng. Chỉ chính chủ của booking đã 'checked_out' mới được
   * viết, và mỗi booking chỉ một đánh giá (ràng buộc unique trên booking_id). hotelId lấy từ booking
   * để client không tự gán. Tạo review + ảnh kèm theo trong một lần.
   */
  createReview = async (currentUser: User, payload: CreateReviewDto) => {
    const booking = await prisma.booking.findUnique({
      where: { id: payload.bookingId },
      select: { id: true, customerId: true, hotelId: true, status: true, review: { select: { id: true } } },
    });
    if (!booking || booking.customerId !== currentUser.id) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy booking của bạn');
    }
    if (booking.status !== 'checked_out') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Chỉ đánh giá được sau khi đã trả phòng');
    }
    if (booking.review) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Booking này đã được đánh giá');
    }

    return prisma.review.create({
      data: {
        bookingId: booking.id,
        customerId: currentUser.id,
        hotelId: booking.hotelId,
        overallRating: payload.overallRating,
        cleanlinessRating: payload.cleanlinessRating,
        serviceRating: payload.serviceRating,
        locationRating: payload.locationRating,
        valueRating: payload.valueRating,
        title: payload.title || null,
        content: payload.content,
        // Khách đã thực sự lưu trú nên đánh giá đáng tin -> công khai ngay
        // (hiện chưa có luồng kiểm duyệt thủ công của manager).
        status: 'published',
        ...(payload.images?.length && {
          images: { create: payload.images.map((url) => ({ url })) },
        }),
      },
      include: reviewInclude,
    });
  };

  /** Danh sách đánh giá CÔNG KHAI của một khách sạn (chỉ status 'published'), mới nhất trước. */
  getHotelReviews = async (filter: ReviewFilter, options: ReviewQueryOptions) => {
    const limit = options.limit || 20;
    const page = options.page || 1;
    const skip = (page - 1) * limit;

    const where: Prisma.ReviewWhereInput = { hotelId: filter.hotelId, status: 'published' };

    let orderBy: Prisma.ReviewOrderByWithRelationInput = { createdAt: 'desc' };
    if (options.sortBy) {
      const [field, direction] = options.sortBy.split(':');
      orderBy = { [field]: direction === 'desc' ? 'desc' : 'asc' };
    }

    const [results, totalResults] = await prisma.$transaction([
      prisma.review.findMany({ where, skip, take: limit, orderBy, include: reviewInclude }),
      prisma.review.count({ where }),
    ]);

    return { results, page, limit, totalPages: Math.ceil(totalResults / limit), totalResults };
  };

  /** Chi tiết một đánh giá công khai. */
  getReviewById = async (reviewId: string) => {
    const review = await prisma.review.findFirst({
      where: { id: reviewId, status: 'published' },
      include: reviewInclude,
    });
    if (!review) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy đánh giá');
    }
    return review;
  };
}

export const reviewService = new ReviewService();
