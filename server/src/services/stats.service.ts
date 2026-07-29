import prisma from '../config/prisma';

// Điều kiện "khách sạn đang mở bán" — dùng chung cho các thống kê công khai
const listedHotel = { isActive: true, isListed: true, deletedAt: null };

export class StatsService {
  /**
   * [Public] Số liệu tổng cho trang chủ (hero). Số đổi chậm nên FE có thể cache.
   * Chỉ đếm khách sạn ĐANG MỞ BÁN; avgRating null-safe khi sàn chưa có đánh giá nào.
   */
  getPublicStats = async () => {
    const [totalHotels, cities, reviewAgg] = await Promise.all([
      prisma.hotel.count({ where: listedHotel }),
      prisma.hotel.findMany({ where: listedHotel, select: { city: true }, distinct: ['city'] }),
      prisma.review.aggregate({ where: { status: 'published' }, _avg: { overallRating: true }, _count: { _all: true } }),
    ]);
    return {
      totalHotels,
      totalCities: cities.length,
      // Thang 10 (khách chấm trực tiếp 1–10), làm tròn 1 chữ số như mọi chỗ khác; null khi chưa có
      // review (không phải 0)
      avgRating: reviewAgg._avg.overallRating === null ? null : Math.round(reviewAgg._avg.overallRating * 10) / 10,
      totalReviews: reviewAgg._count._all,
    };
  };
}

export const statsService = new StatsService();
