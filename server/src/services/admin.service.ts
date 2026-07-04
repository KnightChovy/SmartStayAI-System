import httpStatus from 'http-status';
import { Prisma } from '@prisma/client';
import type { User, CommissionStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';
import { auditService } from './audit.service';
import { walletService } from './wallet.service';

export class AdminService {
  /**
   * [Admin/Platform_manager] Tổng quan toàn sàn: user, khách sạn, booking, doanh thu.
   * Tính TRỰC TIẾP bằng aggregate trong MỘT transaction (ảnh chụp nhất quán) — không phụ thuộc
   * bảng thống kê tiền-tính-sẵn nào, nên luôn đúng thời điểm gọi.
   */
  getOverview = async () => {
    // Mốc đầu tháng theo UTC (khớp toUtcDate toàn hệ thống) để đếm "tháng này"
    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    const [
      userTotal,
      usersByRole,
      suspendedUsers,
      newUsersThisMonth,
      hotelTotal,
      hotelListed,
      bookingTotal,
      bookingsByStatus,
      bookingsThisMonth,
      gmvAgg,
      commissionByStatus,
      refundAgg,
    ] = await prisma.$transaction([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.groupBy({ by: ['role'], where: { deletedAt: null }, _count: { _all: true } }),
      prisma.user.count({ where: { deletedAt: null, status: 'suspended' } }),
      prisma.user.count({ where: { deletedAt: null, createdAt: { gte: startOfMonth } } }),
      prisma.hotel.count({ where: { deletedAt: null } }),
      prisma.hotel.count({ where: { deletedAt: null, isListed: true } }),
      prisma.booking.count(),
      prisma.booking.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.booking.count({ where: { createdAt: { gte: startOfMonth } } }),
      // GMV = tổng tiền các booking ĐÃ chốt (confirmed trở đi); bỏ pending/cancelled/no_show
      prisma.booking.aggregate({
        _sum: { totalAmount: true },
        where: { status: { in: ['confirmed', 'checked_in', 'checked_out'] } },
      }),
      prisma.platformCommission.groupBy({ by: ['status'], _sum: { commissionAmount: true } }),
      prisma.refund.aggregate({ _sum: { amount: true } }),
    ]);

    // groupBy → object {key: số} cho dễ đọc ở client
    const byRole: Record<string, number> = {};
    for (const r of usersByRole) byRole[r.role] = r._count._all;
    const byStatus: Record<string, number> = {};
    for (const r of bookingsByStatus) byStatus[r.status] = r._count._all;
    const commission: Record<string, string> = {};
    for (const r of commissionByStatus) commission[r.status] = (r._sum.commissionAmount ?? 0).toString();

    return {
      users: {
        total: userTotal,
        byRole,
        suspended: suspendedUsers,
        newThisMonth: newUsersThisMonth,
      },
      hotels: {
        total: hotelTotal,
        listed: hotelListed,
        unlisted: hotelTotal - hotelListed,
      },
      bookings: {
        total: bookingTotal,
        byStatus,
        thisMonth: bookingsThisMonth,
      },
      revenue: {
        // tiền dạng chuỗi để khỏi sai số số thực với Decimal
        gmv: (gmvAgg._sum.totalAmount ?? 0).toString(),
        commissionPending: commission.pending ?? '0',
        commissionSettled: commission.settled ?? '0',
        refundedTotal: (refundAgg._sum.amount ?? 0).toString(),
      },
    };
  };

  /**
   * [Admin/PM] Doanh thu NỀN TẢNG theo khoảng [from, to]: GMV (tổng tiền booking đã chốt),
   * hoa hồng pending/settled, tiền hoàn, và net platform revenue (= tổng hoa hồng). Kèm chuỗi
   * thời gian day/month và so sánh % với kỳ trước liền kề (chỉ khi truyền đủ from + to).
   * Rule GMV giống getOverview. Tiền trả dạng chuỗi (Decimal).
   */
  getPlatformRevenue = async (query: { from?: Date; to?: Date; groupBy?: 'day' | 'month' }) => {
    const groupBy = query.groupBy ?? 'month';
    const from = query.from;
    // 'to' là mốc NGÀY (gồm cả ngày đó) ⇒ chặn trên lấy 00:00 ngày kế tiếp → nửa khoảng [from, toExclusive)
    const toExclusive = query.to ? new Date(query.to.getTime() + 24 * 60 * 60 * 1000) : undefined;
    const dateWhere = this.buildDateWhere(from, toExclusive);

    const [bookingAgg, commissionByStatus, refundAgg] = await prisma.$transaction([
      prisma.booking.aggregate({
        _sum: { totalAmount: true },
        _count: { _all: true },
        where: { status: { in: ['confirmed', 'checked_in', 'checked_out'] }, ...dateWhere },
      }),
      prisma.platformCommission.groupBy({
        by: ['status'],
        _sum: { commissionAmount: true },
        where: dateWhere,
      }),
      prisma.refund.aggregate({ _sum: { amount: true }, where: dateWhere }),
    ]);

    const commissionMap: Record<string, Prisma.Decimal> = {};
    for (const r of commissionByStatus) commissionMap[r.status] = r._sum.commissionAmount ?? new Prisma.Decimal(0);
    const commissionPending = commissionMap.pending ?? new Prisma.Decimal(0);
    const commissionSettled = commissionMap.settled ?? new Prisma.Decimal(0);
    // Doanh thu thật của sàn = hoa hồng đã ghi nhận (pending + settled); disputed không tính
    const netPlatformRevenue = commissionPending.add(commissionSettled);

    const gmv = bookingAgg._sum.totalAmount ?? new Prisma.Decimal(0);
    const series = await this.buildPlatformSeries(groupBy, from, toExclusive);
    const comparison = await this.buildPeriodComparison(from, toExclusive, gmv, netPlatformRevenue);

    return {
      summary: {
        gmv: gmv.toString(),
        commissionPending: commissionPending.toString(),
        commissionSettled: commissionSettled.toString(),
        refunded: (refundAgg._sum.amount ?? new Prisma.Decimal(0)).toString(),
        netPlatformRevenue: netPlatformRevenue.toString(),
        bookingCount: bookingAgg._count._all,
      },
      groupBy,
      series,
      comparison,
    };
  };

  // Chuỗi thời gian GMV + hoa hồng toàn sàn theo kỳ (raw SQL vì Prisma không group theo date_trunc được).
  private buildPlatformSeries = async (groupBy: 'day' | 'month', from?: Date, toExclusive?: Date) => {
    const trunc = groupBy === 'day' ? 'day' : 'month'; // whitelist, không phải input tự do
    const fmt = groupBy === 'day' ? 'YYYY-MM-DD' : 'YYYY-MM';
    const fromParam = from ?? null;
    const toParam = toExclusive ?? null;

    const gmvRows = await prisma.$queryRawUnsafe<{ period: string; bookingCount: number; gmv: string }[]>(
      `SELECT to_char(date_trunc('${trunc}', created_at), '${fmt}') AS period,
              count(*)::int AS "bookingCount",
              coalesce(sum(total_amount), 0)::text AS gmv
       FROM bookings
       WHERE status IN ('confirmed', 'checked_in', 'checked_out')
         AND ($1::timestamptz IS NULL OR created_at >= $1)
         AND ($2::timestamptz IS NULL OR created_at < $2)
       GROUP BY 1`,
      fromParam,
      toParam
    );
    const commissionRows = await prisma.$queryRawUnsafe<{ period: string; commission: string }[]>(
      `SELECT to_char(date_trunc('${trunc}', created_at), '${fmt}') AS period,
              coalesce(sum(commission_amount), 0)::text AS commission
       FROM platform_commissions
       WHERE ($1::timestamptz IS NULL OR created_at >= $1)
         AND ($2::timestamptz IS NULL OR created_at < $2)
       GROUP BY 1`,
      fromParam,
      toParam
    );

    const commissionByPeriod = new Map(commissionRows.map((r) => [r.period, r.commission]));
    return gmvRows
      .sort((a, b) => a.period.localeCompare(b.period))
      .map((r) => {
        const commission = new Prisma.Decimal(commissionByPeriod.get(r.period) ?? 0);
        return {
          period: r.period,
          gmv: new Prisma.Decimal(r.gmv).toString(),
          commission: commission.toString(),
          netPlatformRevenue: commission.toString(),
          bookingCount: r.bookingCount,
        };
      });
  };

  // So sánh với kỳ trước liền kề (cùng độ dài, dịch lùi). Chỉ tính khi có đủ from + to.
  private buildPeriodComparison = async (
    from: Date | undefined,
    toExclusive: Date | undefined,
    curGmv: Prisma.Decimal,
    curNet: Prisma.Decimal
  ) => {
    if (!from || !toExclusive) return null;
    const windowMs = toExclusive.getTime() - from.getTime();
    const prevFrom = new Date(from.getTime() - windowMs);
    const prevToExclusive = from; // kỳ trước kết thúc ngay khi kỳ này bắt đầu
    const prevWhere = this.buildDateWhere(prevFrom, prevToExclusive);

    const [prevBooking, prevCommission] = await prisma.$transaction([
      prisma.booking.aggregate({
        _sum: { totalAmount: true },
        where: { status: { in: ['confirmed', 'checked_in', 'checked_out'] }, ...prevWhere },
      }),
      prisma.platformCommission.aggregate({
        _sum: { commissionAmount: true },
        where: { status: { in: ['pending', 'settled'] }, ...prevWhere },
      }),
    ]);
    const prevGmv = prevBooking._sum.totalAmount ?? new Prisma.Decimal(0);
    const prevNet = prevCommission._sum.commissionAmount ?? new Prisma.Decimal(0);

    return {
      previous: { gmv: prevGmv.toString(), netPlatformRevenue: prevNet.toString() },
      change: {
        gmvPct: this.pctChange(curGmv, prevGmv),
        netRevenuePct: this.pctChange(curNet, prevNet),
      },
    };
  };

  // % thay đổi so kỳ trước; null nếu kỳ trước = 0 (không chia được / không có nền so sánh).
  private pctChange = (current: Prisma.Decimal, previous: Prisma.Decimal): number | null => {
    if (previous.isZero()) return null;
    return current.sub(previous).div(previous).mul(100).toDecimalPlaces(2).toNumber();
  };

  private buildDateWhere = (from?: Date, toExclusive?: Date) => {
    if (!from && !toExclusive) return {};
    const createdAt: Prisma.DateTimeFilter = {};
    if (from) createdAt.gte = from;
    if (toExclusive) createdAt.lt = toExclusive;
    return { createdAt };
  };

  // ===== Pha 3 — Hoa hồng / payout =====

  /** [Admin/PM] Liệt kê hoa hồng nền tảng, lọc theo trạng thái + đối tác, kèm tên đối tác + mã booking. */
  listCommissions = async (
    filter: { status?: CommissionStatus; partnerId?: string },
    options: { limit?: number; page?: number }
  ) => {
    const limit = options.limit || 20;
    const page = options.page || 1;
    const skip = (page - 1) * limit;

    const where: Prisma.PlatformCommissionWhereInput = {};
    if (filter.status) where.status = filter.status;
    if (filter.partnerId) where.partnerId = filter.partnerId;

    const [results, totalResults] = await prisma.$transaction([
      prisma.platformCommission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          partner: { select: { id: true, businessName: true } },
          booking: { select: { bookingCode: true, totalAmount: true } },
        },
      }),
      prisma.platformCommission.count({ where }),
    ]);
    return { results, page, limit, totalPages: Math.ceil(totalResults / limit), totalResults };
  };

  /** [Admin/PM] Đánh dấu đã tất toán (payout) 1 khoản hoa hồng. Chỉ khoản chưa settled mới được. */
  settleCommission = async (commissionId: string, currentUser: User) => {
    const commission = await prisma.platformCommission.findUnique({
      where: { id: commissionId },
      include: { booking: { select: { hotelId: true, totalAmount: true } } },
    });
    if (!commission) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy khoản hoa hồng');
    }
    if (commission.status === 'settled') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Khoản hoa hồng này đã được tất toán');
    }
    // Net khách sạn thực nhận = tổng booking − hoa hồng; tất toán chuyển khoản này pending → available
    const net = commission.booking.totalAmount.sub(commission.commissionAmount);
    const updated = await prisma.$transaction(async (tx) => {
      const settled = await tx.platformCommission.update({
        where: { id: commissionId },
        data: { status: 'settled', settledAt: new Date() },
      });
      await walletService.settle(tx, commission.booking.hotelId, net, commissionId);
      return settled;
    });
    await auditService.log({
      userId: currentUser.id,
      action: 'commission.settle',
      entityType: 'commission',
      entityId: commissionId,
      oldValue: { status: commission.status },
      newValue: { status: 'settled' },
    });
    return updated;
  };

  // ===== Pha 4 — Giám sát khách sạn toàn sàn =====

  /** [Admin/PM] Liệt kê MỌI khách sạn (kể cả chưa listed / bị khoá), lọc theo listed/active + tìm tên-thành phố. */
  listHotels = async (
    filter: { search?: string; isListed?: boolean; isActive?: boolean },
    options: { limit?: number; page?: number }
  ) => {
    const limit = options.limit || 20;
    const page = options.page || 1;
    const skip = (page - 1) * limit;

    const where: Prisma.HotelWhereInput = { deletedAt: null };
    if (filter.isListed !== undefined) where.isListed = filter.isListed;
    if (filter.isActive !== undefined) where.isActive = filter.isActive;
    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { city: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const [results, totalResults] = await prisma.$transaction([
      prisma.hotel.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          city: true,
          starRating: true,
          isActive: true,
          isListed: true,
          createdAt: true,
          partner: { select: { id: true, businessName: true } },
        },
      }),
      prisma.hotel.count({ where }),
    ]);
    return { results, page, limit, totalPages: Math.ceil(totalResults / limit), totalResults };
  };

  /** [Admin/PM] Bật/tắt listing (duyệt/gỡ) hoặc active (đình chỉ) 1 khách sạn. */
  setHotelFlags = async (hotelId: string, flags: { isListed?: boolean; isActive?: boolean }, currentUser: User) => {
    const hotel = await prisma.hotel.findFirst({ where: { id: hotelId, deletedAt: null } });
    if (!hotel) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy khách sạn');
    }
    const data: Prisma.HotelUpdateInput = {};
    if (flags.isListed !== undefined) data.isListed = flags.isListed;
    if (flags.isActive !== undefined) data.isActive = flags.isActive;

    const updated = await prisma.hotel.update({ where: { id: hotelId }, data });
    await auditService.log({
      userId: currentUser.id,
      action: 'hotel.update_flags',
      entityType: 'hotel',
      entityId: hotelId,
      oldValue: { isListed: hotel.isListed, isActive: hotel.isActive },
      newValue: { isListed: updated.isListed, isActive: updated.isActive },
    });
    return updated;
  };

  // ===== Pha 6 — Giao dịch thanh toán toàn sàn =====

  /**
   * [Admin/PM] Liệt kê tình trạng thanh toán của MỌI booking toàn sàn.
   * Đi từ `Booking` (luôn tồn tại) chứ không đi từ `Payment` — vì `Payment` chỉ được ghi khi có
   * hành động thu tiền (cash lúc tạo booking, hoặc VNPay lúc bấm thanh toán); booking VNPay bị bỏ
   * dở (chưa từng bấm thanh toán) sẽ KHÔNG có dòng Payment nào, nếu liệt kê từ Payment sẽ mất
   * hẳn các booking này. Mỗi booking kèm khoản thanh toán MỚI NHẤT (nếu có) qua quan hệ `payments`.
   */
  listPayments = async (
    filter: { status?: PaymentStatus | 'unpaid'; paymentMethod?: PaymentMethod; hotelId?: string },
    options: { limit?: number; page?: number }
  ) => {
    const limit = options.limit || 20;
    const page = options.page || 1;
    const skip = (page - 1) * limit;

    const where: Prisma.BookingWhereInput = {};
    if (filter.hotelId) where.hotelId = filter.hotelId;
    if (filter.status === 'unpaid') {
      // Chưa từng có khoản thanh toán nào (vd booking VNPay bị bỏ dở, chưa bấm thanh toán)
      where.payments = { none: {} };
    } else if (filter.status || filter.paymentMethod) {
      where.payments = {
        some: {
          ...(filter.status ? { status: filter.status } : {}),
          ...(filter.paymentMethod ? { paymentMethod: filter.paymentMethod } : {}),
        },
      };
    }

    const [rows, totalResults] = await prisma.$transaction([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          bookingCode: true,
          totalAmount: true,
          status: true,
          createdAt: true,
          hotel: { select: { id: true, name: true } },
          customer: { select: { id: true, fullName: true, email: true } },
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              paymentMethod: true,
              transactionId: true,
              amount: true,
              currency: true,
              status: true,
              paidAt: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    // payments[0] -> khoản mới nhất, hoặc null nếu booking chưa từng có payment
    const results = rows.map(({ payments, ...booking }) => ({
      ...booking,
      payment: payments[0] ?? null,
    }));

    return { results, page, limit, totalPages: Math.ceil(totalResults / limit), totalResults };
  };
}

export const adminService = new AdminService();
