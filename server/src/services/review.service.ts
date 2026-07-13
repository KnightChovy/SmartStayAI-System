import httpStatus from 'http-status';
import { Prisma } from '@prisma/client';
import type { User } from '@prisma/client';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';
import { hotelService } from './hotel.service';
import type {
  CreateReviewDto,
  UpdateReviewDto,
  ReviewFilter,
  PartnerReviewFilter,
  ReviewQueryOptions,
} from '../dto/review.dto';

// Quan hệ kèm theo khi trả review về client (kèm người viết + ảnh)
const reviewInclude = {
  customer: { select: { id: true, fullName: true } },
  images: { orderBy: { uploadedAt: 'asc' } },
} satisfies Prisma.ReviewInclude;

// Include cho trang "đánh giá của tôi": kèm tên khách sạn + mã booking để hiển thị.
// Không cần 'customer' (chính là người đang xem); managerResponse/status là cột nên tự trả về.
const myReviewInclude = {
  hotel: { select: { id: true, name: true } },
  booking: { select: { bookingCode: true } },
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

  /**
   * Danh sách đánh giá của CHÍNH khách đang đăng nhập, mới nhất trước. Trả về MỌI trạng thái
   * (kể cả pending/hidden) vì đây là đánh giá của chính họ; kèm tên khách sạn + mã booking.
   */
  getMyReviews = async (currentUser: User, options: ReviewQueryOptions) => {
    const limit = options.limit || 20;
    const page = options.page || 1;
    const skip = (page - 1) * limit;

    const where: Prisma.ReviewWhereInput = { customerId: currentUser.id };

    let orderBy: Prisma.ReviewOrderByWithRelationInput = { createdAt: 'desc' };
    if (options.sortBy) {
      const [field, direction] = options.sortBy.split(':');
      orderBy = { [field]: direction === 'desc' ? 'desc' : 'asc' };
    }

    const [results, totalResults] = await prisma.$transaction([
      prisma.review.findMany({ where, skip, take: limit, orderBy, include: myReviewInclude }),
      prisma.review.count({ where }),
    ]);

    return { results, page, limit, totalPages: Math.ceil(totalResults / limit), totalResults };
  };

  /**
   * Khách sửa lại đánh giá của CHÍNH mình. Chỉ chủ đánh giá mới sửa được (kiểm bằng customerId).
   * Cho sửa điểm/tiêu đề/nội dung/ảnh; KHÔNG cho đổi booking/khách sạn/trạng thái. Khi client gửi
   * `images` (kể cả mảng rỗng) thì thay toàn bộ ảnh cũ bằng danh sách mới trong cùng một lần cập nhật.
   */
  updateMyReview = async (currentUser: User, reviewId: string, payload: UpdateReviewDto) => {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, customerId: true },
    });
    if (!review || review.customerId !== currentUser.id) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy đánh giá của bạn');
    }

    const data: Prisma.ReviewUpdateInput = {
      ...(payload.overallRating !== undefined && { overallRating: payload.overallRating }),
      ...(payload.cleanlinessRating !== undefined && { cleanlinessRating: payload.cleanlinessRating }),
      ...(payload.serviceRating !== undefined && { serviceRating: payload.serviceRating }),
      ...(payload.locationRating !== undefined && { locationRating: payload.locationRating }),
      ...(payload.valueRating !== undefined && { valueRating: payload.valueRating }),
      ...(payload.title !== undefined && { title: payload.title || null }),
      ...(payload.content !== undefined && { content: payload.content }),
      ...(payload.images !== undefined && {
        images: { deleteMany: {}, create: payload.images.map((url) => ({ url })) },
      }),
    };

    return prisma.review.update({ where: { id: reviewId }, data, include: myReviewInclude });
  };

  /**
   * Khách xoá đánh giá của CHÍNH mình. Chỉ chủ đánh giá mới xoá được. Ảnh kèm theo tự xoá theo
   * ràng buộc onDelete: Cascade trên ReviewImage.
   */
  deleteMyReview = async (currentUser: User, reviewId: string) => {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, customerId: true },
    });
    if (!review || review.customerId !== currentUser.id) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy đánh giá của bạn');
    }
    await prisma.review.delete({ where: { id: reviewId } });
  };

  /**
   * [Partner] Danh sách đánh giá của CHÍNH khách sạn mình — khác endpoint public ở chỗ trả về MỌI
   * trạng thái (kể cả pending/hidden) và có thể lọc theo status. Quyền kiểm qua getManagedHotel.
   */
  getHotelReviewsForPartner = async (
    hotelId: string,
    currentUser: User,
    filter: PartnerReviewFilter,
    options: ReviewQueryOptions
  ) => {
    await hotelService.getManagedHotel(hotelId, currentUser);
    const limit = options.limit || 20;
    const page = options.page || 1;
    const skip = (page - 1) * limit;

    const where: Prisma.ReviewWhereInput = { hotelId };
    if (filter.status) {
      where.status = filter.status;
    }

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

  /**
   * [Partner] Thống kê đánh giá của khách sạn: tổng số, điểm trung bình từng tiêu chí và phân bố theo
   * số sao (overall). Tính trên các đánh giá đã công khai (published) — đây là điểm hiển thị cho khách.
   */
  getHotelReviewStats = async (hotelId: string, currentUser: User) => {
    await hotelService.getManagedHotel(hotelId, currentUser);
    const where: Prisma.ReviewWhereInput = { hotelId, status: 'published' };

    const [agg, byRating] = await prisma.$transaction([
      prisma.review.aggregate({
        where,
        _count: { _all: true },
        _avg: {
          overallRating: true,
          cleanlinessRating: true,
          serviceRating: true,
          locationRating: true,
          valueRating: true,
        },
      }),
      prisma.review.groupBy({ by: ['overallRating'], where, _count: { _all: true } }),
    ]);

    // Chuẩn hoá phân bố 1..5 sao, điền 0 cho mức sao chưa có đánh giá
    const countByStar: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const row of byRating) {
      countByStar[row.overallRating] = row._count._all;
    }

    return {
      total: agg._count._all,
      average: {
        overall: agg._avg.overallRating,
        cleanliness: agg._avg.cleanlinessRating,
        service: agg._avg.serviceRating,
        location: agg._avg.locationRating,
        value: agg._avg.valueRating,
      },
      countByStar,
    };
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
