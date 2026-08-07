import httpStatus from 'http-status';
import type { BookingStatus, PartnerStatus, Prisma, User } from '@prisma/client';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';
import { auditService } from './audit.service';
import type { AnalyticsQuery, PerformanceQuery, SetPartnerStatusDto } from '../dto/platform-manager.dto';

// Booking được coi là "đã chốt" (đã thanh toán / đã đến): dùng cho conversion rate & GMV
const CONFIRMED_STATUSES: BookingStatus[] = ['confirmed', 'checked_in', 'checked_out'];

// Trọng số chấm điểm khách sạn (chốt với FE: rating 40% / occupancy 25% / cancel 20% / response 15%)
const SCORE_WEIGHTS = { rating: 0.4, occupancy: 0.25, cancellation: 0.2, response: 0.15 };

// ===== Helpers chuẩn hoá từng chỉ số về thang điểm 0..100 =====

const ratingToScore = (avg: number | null): number | null => (avg === null ? null : Math.round((avg / 10) * 100));
const occupancyToScore = (rate: number | null): number | null => (rate === null ? null : Math.round(rate * 100));
// Huỷ càng ít điểm càng cao
const cancellationToScore = (rate: number | null): number | null => (rate === null ? null : Math.round((1 - rate) * 100));
// Thời gian phản hồi TB (phút) → điểm: ≤15p = 100, ≥24h = 0, tuyến tính ở giữa
const responseMinutesToScore = (minutes: number | null): number | null => {
  if (minutes === null) return null;
  if (minutes <= 15) return 100;
  if (minutes >= 1440) return 0;
  return Math.round(100 * (1 - (minutes - 15) / (1440 - 15)));
};

// Điểm tổng = trung bình có trọng số các thành phần CÓ dữ liệu (chuẩn hoá lại trọng số để không phạt
// oan khách sạn thiếu dữ liệu ở một chỉ số). Không có chỉ số nào → null.
const computeScore = (parts: { weight: number; score: number | null }[]): number | null => {
  const available = parts.filter((p): p is { weight: number; score: number } => p.score !== null);
  if (available.length === 0) return null;
  const totalWeight = available.reduce((sum, p) => sum + p.weight, 0);
  const weighted = available.reduce((sum, p) => sum + p.weight * p.score, 0);
  return Math.round(weighted / totalWeight);
};

// Cửa sổ thời gian mặc định cho performance = 90 ngày gần nhất
const resolveWindow = (query: PerformanceQuery): { from: Date; to: Date } => {
  const to = query.to ? new Date(query.to) : new Date();
  const from = query.from ? new Date(query.from) : new Date(to.getTime() - 90 * 24 * 60 * 60 * 1000);
  return { from, to };
};

// Sinh danh sách chuỗi kỳ liên tục ('YYYY-MM' hoặc 'YYYY') từ mốc start để lấp khoảng trống time-series
const generatePeriods = (period: 'month' | 'year', start: Date, range: number): string[] => {
  const periods: string[] = [];
  for (let i = 0; i < range; i += 1) {
    if (period === 'year') {
      periods.push(String(start.getUTCFullYear() + i));
    } else {
      const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1));
      periods.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
    }
  }
  return periods;
};

export class PlatformManagerService {
  /**
   * [Platform Manager] Liệt kê MỌI đối tác (hotel_partner) toàn sàn, lọc theo trạng thái +
   * tìm theo tên doanh nghiệp/email. Kèm thông tin chủ tài khoản (owner) và số khách sạn của partner.
   */
  listPartners = async (
    filter: { search?: string; status?: PartnerStatus },
    options: { limit?: number; page?: number }
  ) => {
    const limit = options.limit || 20;
    const page = options.page || 1;
    const skip = (page - 1) * limit;

    const where: Prisma.HotelPartnerWhereInput = { deletedAt: null };
    if (filter.status) where.status = filter.status;
    if (filter.search) {
      where.OR = [
        { businessName: { contains: filter.search, mode: 'insensitive' } },
        { contactEmail: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const [rows, totalResults] = await prisma.$transaction([
      prisma.hotelPartner.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          businessName: true,
          status: true,
          commissionRate: true,
          contactEmail: true,
          contactPhone: true,
          approvedAt: true,
          createdAt: true,
          ownerUser: { select: { id: true, fullName: true, email: true } },
          _count: { select: { hotels: true } },
        },
      }),
      prisma.hotelPartner.count({ where }),
    ]);

    // Đổi tên quan hệ ownerUser -> owner cho FE dễ đọc
    const results = rows.map(({ ownerUser, ...partner }) => ({ ...partner, owner: ownerUser }));
    return { results, page, limit, totalPages: Math.ceil(totalResults / limit), totalResults };
  };

  /**
   * [Platform Manager] Đình chỉ hoặc khôi phục một đối tác.
   *
   * Đây là biện pháp xử lý vi phạm nghiêm trọng — KHÔNG dùng để can thiệp vào mức hoa hồng đã cam
   * kết. Thoả thuận hoa hồng còn hiệu lực vẫn bất khả xâm phạm; nếu đối tác gian lận thì dừng hẳn
   * hoạt động của họ, chứ không sửa rate giữa kỳ.
   *
   * Đình chỉ ⇒ gỡ niêm yết TẤT CẢ khách sạn của đối tác (ngừng bán ngay) và chặn mọi thao tác quản
   * lý của họ qua getManagedHotel. Booking đã đặt KHÔNG bị huỷ — khách vẫn được ở, và đối tác vẫn
   * phải phục vụ; đó là việc của luồng vận hành (getOperableHotel), không phải luồng quản lý.
   *
   * Khôi phục ⇒ trả về approved nhưng CỐ Ý không tự bật lại niêm yết: đối tác tự publish lại từng
   * khách sạn sau khi rà soát, an toàn hơn là bật hàng loạt.
   */
  setPartnerStatus = async (partnerId: string, currentUser: User, payload: SetPartnerStatusDto) => {
    const partner = await prisma.hotelPartner.findFirst({
      where: { id: partnerId, deletedAt: null },
      select: { id: true, businessName: true, status: true, ownerId: true },
    });
    if (!partner) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Partner not found');
    }

    const suspending = payload.action === 'suspend';
    if (suspending && partner.status !== 'approved') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Only active partners can be suspended');
    }
    if (!suspending && partner.status !== 'suspended') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'This partner is not in a suspended state');
    }

    const now = new Date();
    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.hotelPartner.update({
        where: { id: partnerId },
        data: suspending
          ? { status: 'suspended', rejectionReason: payload.reason ?? null }
          : { status: 'approved', rejectionReason: null },
      });

      let unlisted = 0;
      if (suspending) {
        const result = await tx.hotel.updateMany({
          where: { partnerId, isListed: true, deletedAt: null },
          data: { isListed: false },
        });
        unlisted = result.count;
      }

      await tx.notification.create({
        data: {
          userId: partner.ownerId,
          type: 'alert',
          title: suspending ? 'Partner account suspended' : 'Partner account reactivated',
          body: suspending
            ? `${partner.businessName} has been suspended. Reason: ${payload.reason ?? 'not specified'}. ` +
              `${unlisted} hotel(s) have been removed from sale.`
            : `${partner.businessName} has been reactivated. You need to re-list each hotel yourself in the management section.`,
          data: { partnerId, action: payload.action },
          channel: 'in_app',
          status: 'sent',
          sentAt: now,
        },
      });
      return { row, unlisted };
    });

    await auditService.log({
      userId: currentUser.id,
      action: suspending ? 'partner.suspend' : 'partner.reactivate',
      entityType: 'hotel_partner',
      entityId: partnerId,
      oldValue: { status: partner.status },
      newValue: {
        status: updated.row.status,
        reason: payload.reason ?? null,
        unlistedHotels: updated.unlisted,
      },
    });

    return { partner: updated.row, unlistedHotels: updated.unlisted };
  };

  /**
   * [Platform Manager] Báo cáo analytics toàn sàn: tổng booking/user, conversion rate (confirmed/tổng),
   * time-series so sánh theo tháng/năm, và top thành phố / top khách sạn được đặt nhiều nhất.
   */
  getPlatformAnalytics = async (query: AnalyticsQuery) => {
    const period: 'month' | 'year' = query.period === 'year' ? 'year' : 'month';
    const range = query.range && query.range > 0 ? query.range : period === 'year' ? 5 : 12;
    const topLimit = query.topLimit && query.topLimit > 0 ? query.topLimit : 5;

    const now = new Date();
    const start =
      period === 'year'
        ? new Date(Date.UTC(now.getUTCFullYear() - (range - 1), 0, 1))
        : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (range - 1), 1));

    const [totalBookings, confirmedBookings, totalUsers] = await prisma.$transaction([
      prisma.booking.count(),
      prisma.booking.count({ where: { status: { in: CONFIRMED_STATUSES } } }),
      prisma.user.count({ where: { deletedAt: null } }),
    ]);
    const conversionRate = totalBookings > 0 ? confirmedBookings / totalBookings : 0;

    const [timeSeries, topCities, topHotels] = await Promise.all([
      this.buildTimeSeries(period, start, range),
      this.topCitiesByBookings(topLimit),
      this.topHotelsByBookings(topLimit),
    ]);

    return {
      totals: { totalBookings, confirmedBookings, conversionRate, totalUsers },
      period,
      range,
      timeSeries,
      topCities,
      topHotels,
    };
  };

  // Time-series booking/user theo tháng hoặc năm (dùng date_trunc; Prisma không group theo kỳ được)
  private buildTimeSeries = async (period: 'month' | 'year', start: Date, range: number) => {
    const trunc = period === 'year' ? 'year' : 'month'; // whitelist, không phải input tự do
    const fmt = period === 'year' ? 'YYYY' : 'YYYY-MM';

    const bookingRows = await prisma.$queryRawUnsafe<{ period: string; bookings: number; confirmed: number }[]>(
      `SELECT to_char(date_trunc('${trunc}', created_at), '${fmt}') AS period,
              count(*)::int AS bookings,
              count(*) FILTER (WHERE status IN ('confirmed','checked_in','checked_out'))::int AS confirmed
       FROM bookings WHERE created_at >= $1 GROUP BY 1`,
      start
    );
    const userRows = await prisma.$queryRawUnsafe<{ period: string; new_users: number }[]>(
      `SELECT to_char(date_trunc('${trunc}', created_at), '${fmt}') AS period, count(*)::int AS new_users
       FROM users WHERE deleted_at IS NULL AND created_at >= $1 GROUP BY 1`,
      start
    );

    const bookingByPeriod = new Map(bookingRows.map((r) => [r.period, r]));
    const usersByPeriod = new Map(userRows.map((r) => [r.period, r.new_users]));

    return generatePeriods(period, start, range).map((p) => ({
      period: p,
      bookings: bookingByPeriod.get(p)?.bookings ?? 0,
      confirmedBookings: bookingByPeriod.get(p)?.confirmed ?? 0,
      newUsers: usersByPeriod.get(p) ?? 0,
    }));
  };

  private topCitiesByBookings = (limit: number) =>
    prisma.$queryRaw<{ city: string; bookings: number }[]>`
      SELECT h.city, count(b.id)::int AS bookings
      FROM bookings b JOIN hotels h ON h.id = b.hotel_id
      GROUP BY h.city ORDER BY bookings DESC LIMIT ${limit}`;

  private topHotelsByBookings = (limit: number) =>
    prisma.$queryRaw<{ hotelId: string; name: string; bookings: number }[]>`
      SELECT b.hotel_id AS "hotelId", h.name, count(b.id)::int AS bookings
      FROM bookings b JOIN hotels h ON h.id = b.hotel_id
      GROUP BY b.hotel_id, h.name ORDER BY bookings DESC LIMIT ${limit}`;

  /**
   * [Platform Manager] Chỉ số hiệu suất + điểm của MỘT khách sạn trong khoảng thời gian (mặc định 90 ngày).
   * occupancy/cancellation/response tính trong cửa sổ; rating tính trên toàn bộ review đã công khai.
   */
  getHotelPerformance = async (hotelId: string, query: PerformanceQuery) => {
    const hotel = await prisma.hotel.findFirst({
      where: { id: hotelId, deletedAt: null },
      select: { id: true, name: true, city: true },
    });
    if (!hotel) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Hotel not found');
    }
    const { from, to } = resolveWindow(query);

    const [occ, totalBookings, cancelledBookings, ratingAgg] = await prisma.$transaction([
      prisma.roomAvailability.aggregate({
        where: { hotelId, date: { gte: from, lte: to } },
        _sum: { bookedRooms: true, totalRooms: true },
      }),
      prisma.booking.count({ where: { hotelId, createdAt: { gte: from, lte: to } } }),
      prisma.booking.count({ where: { hotelId, status: 'cancelled', createdAt: { gte: from, lte: to } } }),
      prisma.review.aggregate({ where: { hotelId, status: 'published' }, _avg: { overallRating: true }, _count: { _all: true } }),
    ]);

    const totalRoomsSum = occ._sum.totalRooms ?? 0;
    const occupancyRate = totalRoomsSum > 0 ? (occ._sum.bookedRooms ?? 0) / totalRoomsSum : null;
    const cancellationRate = totalBookings > 0 ? cancelledBookings / totalBookings : null;
    // Thang 10 (khách chấm trực tiếp 1–10), làm tròn 1 chữ số — đồng bộ với rating hiển thị toàn sàn
    const avgRating = ratingAgg._count._all > 0 ? Math.round(Number(ratingAgg._avg.overallRating) * 10) / 10 : null;
    const avgResponseMinutes = await avgResponseMinutesForHotel(hotelId, from, to);

    const scores = {
      rating: ratingToScore(avgRating),
      occupancy: occupancyToScore(occupancyRate),
      cancellation: cancellationToScore(cancellationRate),
      response: responseMinutesToScore(avgResponseMinutes),
    };
    const score = computeScore([
      { weight: SCORE_WEIGHTS.rating, score: scores.rating },
      { weight: SCORE_WEIGHTS.occupancy, score: scores.occupancy },
      { weight: SCORE_WEIGHTS.cancellation, score: scores.cancellation },
      { weight: SCORE_WEIGHTS.response, score: scores.response },
    ]);

    return {
      hotelId: hotel.id,
      hotelName: hotel.name,
      city: hotel.city,
      window: { from, to },
      metrics: {
        occupancyRate,
        cancellationRate,
        avgRating,
        avgResponseMinutes,
        totalBookings,
        cancelledBookings,
        reviewCount: ratingAgg._count._all,
      },
      scores,
      score,
    };
  };

  /**
   * [Platform Manager] Bảng xếp hạng khách sạn theo điểm hiệu suất trong cửa sổ thời gian.
   * Tính gộp cho tất cả khách sạn bằng vài truy vấn group-by (thay vì lặp từng KS).
   */
  getPerformanceLeaderboard = async (query: PerformanceQuery) => {
    const { from, to } = resolveWindow(query);
    const hotels = await prisma.hotel.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, city: true },
    });

    const [occByHotel, totalByHotel, cancelledByHotel, ratingByHotel, responseByHotel] = await Promise.all([
      prisma.roomAvailability.groupBy({
        by: ['hotelId'],
        where: { date: { gte: from, lte: to } },
        _sum: { bookedRooms: true, totalRooms: true },
      }),
      prisma.booking.groupBy({ by: ['hotelId'], where: { createdAt: { gte: from, lte: to } }, _count: { _all: true } }),
      prisma.booking.groupBy({
        by: ['hotelId'],
        where: { status: 'cancelled', createdAt: { gte: from, lte: to } },
        _count: { _all: true },
      }),
      prisma.review.groupBy({ by: ['hotelId'], where: { status: 'published' }, _avg: { overallRating: true }, _count: { _all: true } }),
      avgResponseMinutesByHotel(from, to),
    ]);

    const occMap = new Map(occByHotel.map((o) => [o.hotelId, o._sum]));
    const totalMap = new Map(totalByHotel.map((t) => [t.hotelId, t._count._all]));
    const cancelledMap = new Map(cancelledByHotel.map((c) => [c.hotelId, c._count._all]));
    const ratingMap = new Map(ratingByHotel.map((r) => [r.hotelId, { avg: r._avg.overallRating, count: r._count._all }]));
    const responseMap = new Map(responseByHotel.map((r) => [r.hotelId, r.avgMinutes]));

    const rows = hotels.map((h) => {
      const occSum = occMap.get(h.id);
      const totalRoomsSum = occSum?.totalRooms ?? 0;
      const occupancyRate = totalRoomsSum > 0 ? (occSum?.bookedRooms ?? 0) / totalRoomsSum : null;
      const total = totalMap.get(h.id) ?? 0;
      const cancelled = cancelledMap.get(h.id) ?? 0;
      const cancellationRate = total > 0 ? cancelled / total : null;
      const rating = ratingMap.get(h.id);
      const avgRating = rating && rating.count > 0 ? Math.round(Number(rating.avg) * 10) / 10 : null;
      const responseRaw = responseMap.get(h.id);
      const avgResponseMinutes = responseRaw === undefined || responseRaw === null ? null : Number(responseRaw);

      const score = computeScore([
        { weight: SCORE_WEIGHTS.rating, score: ratingToScore(avgRating) },
        { weight: SCORE_WEIGHTS.occupancy, score: occupancyToScore(occupancyRate) },
        { weight: SCORE_WEIGHTS.cancellation, score: cancellationToScore(cancellationRate) },
        { weight: SCORE_WEIGHTS.response, score: responseMinutesToScore(avgResponseMinutes) },
      ]);

      return {
        hotelId: h.id,
        hotelName: h.name,
        city: h.city,
        score,
        occupancyRate,
        cancellationRate,
        avgRating,
        avgResponseMinutes,
      };
    });

    // Điểm cao trước; khách sạn chưa đủ dữ liệu (score null) xếp cuối
    rows.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
    return { window: { from, to }, hotels: rows };
  };
}

// Thời gian phản hồi TB (phút) của MỘT khách sạn: khoảng cách từ tin của khách tới tin staff trả lời
// ngay sau đó trong cùng hội thoại. Dùng window function LEAD nên viết raw SQL.
const avgResponseMinutesForHotel = async (hotelId: string, from: Date, to: Date): Promise<number | null> => {
  const rows = await prisma.$queryRaw<{ avg_minutes: number | null }[]>`
    WITH m AS (
      SELECT sender_type, created_at,
        LEAD(created_at) OVER (PARTITION BY conversation_id ORDER BY created_at) AS next_at,
        LEAD(sender_type) OVER (PARTITION BY conversation_id ORDER BY created_at) AS next_sender
      FROM messages
      WHERE conversation_id IN (SELECT id FROM conversations WHERE hotel_id = ${hotelId}::uuid)
        AND created_at BETWEEN ${from} AND ${to}
    )
    SELECT AVG(EXTRACT(EPOCH FROM (next_at - created_at)) / 60.0)::float8 AS avg_minutes
    FROM m WHERE sender_type = 'user' AND next_sender = 'staff'`;
  const value = rows[0]?.avg_minutes;
  return value === undefined || value === null ? null : Number(value);
};

// Bản gộp theo từng khách sạn cho bảng xếp hạng
const avgResponseMinutesByHotel = (from: Date, to: Date) =>
  prisma.$queryRaw<{ hotelId: string; avgMinutes: number | null }[]>`
    WITH m AS (
      SELECT c.hotel_id, msg.sender_type, msg.created_at,
        LEAD(msg.created_at) OVER (PARTITION BY msg.conversation_id ORDER BY msg.created_at) AS next_at,
        LEAD(msg.sender_type) OVER (PARTITION BY msg.conversation_id ORDER BY msg.created_at) AS next_sender
      FROM messages msg JOIN conversations c ON c.id = msg.conversation_id
      WHERE msg.created_at BETWEEN ${from} AND ${to}
    )
    SELECT hotel_id AS "hotelId", AVG(EXTRACT(EPOCH FROM (next_at - created_at)) / 60.0)::float8 AS "avgMinutes"
    FROM m WHERE sender_type = 'user' AND next_sender = 'staff' GROUP BY hotel_id`;

export const platformManagerService = new PlatformManagerService();
