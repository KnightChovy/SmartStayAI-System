import httpStatus from 'http-status';
import { Prisma } from '@prisma/client';
import type { User, BookingStatus, CommissionStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';
import { auditService } from './audit.service';
import { walletService } from './wallet.service';

// Kỳ giữ sau khi kỳ ở kết thúc trước khi tự tất toán (đối soát). 0 = tất toán ngay khi đủ điều kiện.
const SETTLEMENT_HOLD_DAYS = 1;

/**
 * Trạng thái booking đã CHỐT SỔ — hết cửa huỷ/hoàn nên nhả tiền cho khách sạn được:
 * - `checked_out`: khách ở xong.
 * - `no_show`: khách không đến, tiền trả trước bị forfeit (khách sạn được giữ theo chính sách).
 *   Thiếu trạng thái này thì net nằm chết ở `balancePending` VĨNH VIỄN vì no-show không bao giờ
 *   đạt `checked_out` — khách sạn không rút được, sàn cũng không chốt được hoa hồng.
 */
const SETTLEABLE_BOOKING_STATUSES: BookingStatus[] = ['checked_out', 'no_show'];

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
      // GMV = tổng totalAmount của các booking ĐÃ GHI NHẬN (đã trả tiền → có commission), khớp mốc
      // với getPlatformRevenue. Trước lọc theo booking.status nên lệch cơ sở với /admin/revenue.
      prisma.$queryRaw<{ gmv: string }[]>`
        SELECT coalesce(sum(b.total_amount), 0)::text AS gmv
        FROM platform_commissions pc JOIN bookings b ON b.id = pc.booking_id`,
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
        gmv: gmvAgg[0]?.gmv ?? '0',
        commissionPending: commission.pending ?? '0',
        commissionSettled: commission.settled ?? '0',
        refundedTotal: (refundAgg._sum.amount ?? 0).toString(),
      },
    };
  };

  /**
   * [Admin/PM] Doanh thu NỀN TẢNG theo khoảng [from, to]: GMV (tổng totalAmount booking đã GHI NHẬN
   * theo NGÀY THANH TOÁN — commission.createdAt), hoa hồng pending/settled, tiền hoàn, và net platform
   * revenue (= tổng hoa hồng pending + settled). Kèm chuỗi thời gian day/month và so sánh % với kỳ
   * trước liền kề (chỉ khi truyền đủ from + to). Cùng mốc ghi nhận với getOverview. Tiền dạng chuỗi.
   */
  getPlatformRevenue = async (query: { from?: Date; to?: Date; groupBy?: 'day' | 'month' }) => {
    const groupBy = query.groupBy ?? 'month';
    const from = query.from;
    // 'to' là mốc NGÀY (gồm cả ngày đó) ⇒ chặn trên lấy 00:00 ngày kế tiếp → nửa khoảng [from, toExclusive)
    const toExclusive = query.to ? new Date(query.to.getTime() + 24 * 60 * 60 * 1000) : undefined;
    const dateWhere = this.buildDateWhere(from, toExclusive);

    // GMV + hoa hồng cùng MỐC NGÀY THANH TOÁN: mỗi booking trả đủ tiền tạo đúng 1 PlatformCommission
    // (cổng/ví/tiền mặt), nên commission.createdAt = mốc ghi nhận; GMV = tổng totalAmount của các
    // booking đã ghi nhận trong kỳ. refunded theo ngày tạo yêu cầu hoàn.
    const [commissions, refundAgg] = await prisma.$transaction([
      prisma.platformCommission.findMany({
        where: dateWhere,
        select: { status: true, commissionAmount: true, booking: { select: { totalAmount: true } } },
      }),
      prisma.refund.aggregate({ _sum: { amount: true }, where: dateWhere }),
    ]);

    let gmv = new Prisma.Decimal(0);
    let commissionPending = new Prisma.Decimal(0);
    let commissionSettled = new Prisma.Decimal(0);
    for (const c of commissions) {
      gmv = gmv.add(c.booking.totalAmount);
      if (c.status === 'pending') commissionPending = commissionPending.add(c.commissionAmount);
      else if (c.status === 'settled') commissionSettled = commissionSettled.add(c.commissionAmount);
      // 'disputed' không tính vào doanh thu thật
    }
    // Doanh thu thật của sàn = hoa hồng đã ghi nhận (pending + settled); disputed không tính
    const netPlatformRevenue = commissionPending.add(commissionSettled);

    const series = await this.buildPlatformSeries(groupBy, from, toExclusive);
    const comparison = await this.buildPeriodComparison(from, toExclusive, gmv, netPlatformRevenue);

    return {
      summary: {
        gmv: gmv.toString(),
        commissionPending: commissionPending.toString(),
        commissionSettled: commissionSettled.toString(),
        refunded: (refundAgg._sum.amount ?? new Prisma.Decimal(0)).toString(),
        netPlatformRevenue: netPlatformRevenue.toString(),
        bookingCount: commissions.length,
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

    // GMV + hoa hồng theo NGÀY THANH TOÁN (pc.created_at), join booking để lấy totalAmount
    const rows = await prisma.$queryRawUnsafe<
      { period: string; bookingCount: number; gmv: string; commission: string }[]
    >(
      `SELECT to_char(date_trunc('${trunc}', pc.created_at), '${fmt}') AS period,
              count(*)::int AS "bookingCount",
              coalesce(sum(b.total_amount), 0)::text AS gmv,
              coalesce(sum(pc.commission_amount), 0)::text AS commission
       FROM platform_commissions pc
       JOIN bookings b ON b.id = pc.booking_id
       WHERE ($1::timestamptz IS NULL OR pc.created_at >= $1)
         AND ($2::timestamptz IS NULL OR pc.created_at < $2)
       GROUP BY 1`,
      fromParam,
      toParam
    );

    return rows
      .sort((a, b) => a.period.localeCompare(b.period))
      .map((r) => {
        const commission = new Prisma.Decimal(r.commission);
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

    // Kỳ trước cũng theo mốc ghi nhận (commission.createdAt) để so sánh cùng cơ sở với kỳ hiện tại
    const prevCommissions = await prisma.platformCommission.findMany({
      where: prevWhere,
      select: { status: true, commissionAmount: true, booking: { select: { totalAmount: true } } },
    });
    let prevGmv = new Prisma.Decimal(0);
    let prevNet = new Prisma.Decimal(0);
    for (const c of prevCommissions) {
      prevGmv = prevGmv.add(c.booking.totalAmount);
      if (c.status === 'pending' || c.status === 'settled') prevNet = prevNet.add(c.commissionAmount);
    }

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
      include: { booking: { select: { hotelId: true, totalAmount: true, status: true, bookingCode: true } } },
    });
    if (!commission) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy khoản hoa hồng');
    }
    if (commission.status === 'settled') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Khoản hoa hồng này đã được tất toán');
    }
    // Cùng điều kiện với cron tự tất toán: chỉ nhả tiền khi booking đã chốt sổ (trả phòng hoặc no-show).
    // Không có guard này, admin có thể nhả tiền cho booking khách chưa tới ở — khách huỷ sau thì đã muộn.
    if (!SETTLEABLE_BOOKING_STATUSES.includes(commission.booking.status)) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Chỉ tất toán được booking đã trả phòng hoặc no-show. Booking ${commission.booking.bookingCode} đang ở trạng thái "${commission.booking.status}".`
      );
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

  /**
   * [Cron] Tự tất toán các khoản hoa hồng ĐỦ ĐIỀU KIỆN: booking đã chốt sổ (xem
   * SETTLEABLE_BOOKING_STATUSES) và đã qua kỳ giữ SETTLEMENT_HOLD_DAYS ngày. Mỗi khoản: commission
   * pending→settled + ví chuyển pending→available, gói trong 1 transaction; update CÓ ĐIỀU KIỆN
   * (status pending) để không tất toán hai lần nếu cron chạy chồng. Vết tiền nằm ở
   * wallet_transactions (type settlement), không cần audit user.
   * @returns số khoản đã tất toán
   */
  settleEligibleCommissions = async (): Promise<number> => {
    const cutoff = new Date(Date.now() - SETTLEMENT_HOLD_DAYS * 24 * 60 * 60 * 1000);
    const eligible = await prisma.platformCommission.findMany({
      where: {
        status: 'pending',
        booking: {
          OR: [
            { status: 'checked_out', checkedOutAt: { lte: cutoff } },
            // no-show KHÔNG có checkedOutAt ⇒ đếm kỳ giữ từ ngày TRẢ PHÒNG theo lịch. Cố ý không
            // dùng checkInDate: staff đánh no-show ngay ngày nhận phòng, mà kỳ ở vẫn còn đang chạy
            // thì chưa nên nhả tiền — còn cửa để đối soát/khiếu nại tới hết kỳ.
            { status: 'no_show', checkOutDate: { lte: cutoff } },
          ],
        },
      },
      select: {
        id: true,
        commissionAmount: true,
        booking: { select: { hotelId: true, totalAmount: true } },
      },
    });

    let settled = 0;
    for (const c of eligible) {
      const net = c.booking.totalAmount.sub(c.commissionAmount);
      // eslint-disable-next-line no-await-in-loop
      const done = await prisma.$transaction(async (tx) => {
        const updated = await tx.platformCommission.updateMany({
          where: { id: c.id, status: 'pending' },
          data: { status: 'settled', settledAt: new Date() },
        });
        if (updated.count === 0) {
          return false; // khoản này vừa được tất toán bởi lần chạy khác
        }
        await walletService.settle(tx, c.booking.hotelId, net, c.id);
        return true;
      });
      if (done) {
        settled += 1;
      }
    }
    return settled;
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
