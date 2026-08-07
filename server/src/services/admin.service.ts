import httpStatus from 'http-status';
import { Prisma } from '@prisma/client';
import type { User, CommissionStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';
import { auditService } from './audit.service';
import { walletService } from './wallet.service';

// Kỳ giữ sau khi kỳ ở kết thúc trước khi tự tất toán (đối soát). 0 = tất toán ngay khi đủ điều kiện.
const SETTLEMENT_HOLD_DAYS = 1;

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
      // CHỈ tính yêu cầu đã 'processed' — tiền chỉ thực sự rời ví/commission ở bước này (xem model
      // Refund). Cộng cả 'pending'/'rejected' vào sẽ thổi phồng số tiền hoàn.
      prisma.refund.aggregate({ _sum: { amount: true }, where: { status: 'processed' } }),
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
    // booking đã ghi nhận trong kỳ. refunded theo ngày TẠO yêu cầu hoàn, và chỉ tính yêu cầu đã
    // 'processed' (tiền đã thực sự rời đi) — 'pending'/'rejected' không phải tiền hoàn.
    const [commissions, refundAgg] = await prisma.$transaction([
      prisma.platformCommission.findMany({
        where: dateWhere,
        select: { status: true, commissionAmount: true, booking: { select: { totalAmount: true } } },
      }),
      prisma.refund.aggregate({ _sum: { amount: true }, where: { ...dateWhere, status: 'processed' } }),
    ]);

    let gmv = new Prisma.Decimal(0);
    let commissionPending = new Prisma.Decimal(0);
    let commissionSettled = new Prisma.Decimal(0);
    let commissionDisputed = new Prisma.Decimal(0);
    for (const c of commissions) {
      gmv = gmv.add(c.booking.totalAmount);
      if (c.status === 'pending') commissionPending = commissionPending.add(c.commissionAmount);
      else if (c.status === 'settled') commissionSettled = commissionSettled.add(c.commissionAmount);
      // 'disputed' KHÔNG tính vào doanh thu thật, nhưng vẫn trả về để người quản lý sàn theo dõi
      // được khoản đang tranh chấp — không trả thì tiền này biến mất khỏi mọi báo cáo.
      else commissionDisputed = commissionDisputed.add(c.commissionAmount);
    }
    // Doanh thu thật của sàn = hoa hồng đã ghi nhận (pending + settled); disputed không tính
    const netPlatformRevenue = commissionPending.add(commissionSettled);

    const series = await this.buildPlatformSeries(groupBy, from, toExclusive);
    const comparison = await this.buildPeriodComparison(from, toExclusive, gmv, netPlatformRevenue);

    const refunded = refundAgg._sum.amount ?? new Prisma.Decimal(0);
    const bookingCount = commissions.length;

    return {
      // Metadata báo cáo: mọi số tiền dưới đây là VND, chốt tại thời điểm asOf
      currency: 'VND',
      asOf: new Date().toISOString(),
      summary: {
        gmv: gmv.toString(),
        commissionPending: commissionPending.toString(),
        commissionSettled: commissionSettled.toString(),
        commissionDisputed: commissionDisputed.toString(),
        refunded: refunded.toString(),
        netPlatformRevenue: netPlatformRevenue.toString(),
        bookingCount,
        // Hai chỉ số phái sinh tính ở BE: chia bằng Decimal cho khỏi sai số, và để FE không phải
        // parse lại chuỗi tiền — đúng lý do vì sao tiền được trả dạng chuỗi ngay từ đầu.
        // null (không phải 0) khi chưa có booking nào: "chưa có dữ liệu" khác "bằng không".
        takeRatePct: gmv.isZero() ? null : netPlatformRevenue.div(gmv).mul(100).toDecimalPlaces(2).toNumber(),
        avgBookingValue: bookingCount === 0 ? null : gmv.div(bookingCount).toDecimalPlaces(2).toString(),
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

  /**
   * [Admin/PM] Doanh thu CHI TIẾT theo TỪNG đối tác / khách sạn / thành phố (thứ /admin/revenue chỉ
   * cho tổng toàn sàn). Cùng mốc ghi nhận: gmv + commission theo `pc.created_at` (ngày thanh toán),
   * refunded theo `r.created_at`. `commission` = doanh thu THẬT của sàn cho nhóm đó (bỏ 'disputed').
   *
   * `partnerId` để drill-down: bấm 1 đối tác ⇒ gọi lại với `groupBy=hotel&partnerId=` để xem các KS
   * của họ; bấm 1 KS ⇒ dùng endpoint sẵn có `GET /hotels/:id/revenue` (manager có manageBookings).
   * Gộp tất cả nhóm ở tầng DB (số đối tác/KS/thành phố nhỏ) rồi phân trang trong bộ nhớ. Tiền dạng chuỗi.
   */
  getRevenueBreakdown = async (query: {
    groupBy: 'partner' | 'hotel' | 'city';
    from?: Date;
    to?: Date;
    partnerId?: string;
    sortBy?: 'commission' | 'gmv' | 'bookingCount';
    page?: number;
    limit?: number;
  }) => {
    const { groupBy } = query;
    const limit = query.limit || 20;
    const page = query.page || 1;
    const sortBy = query.sortBy ?? 'commission';
    const from = query.from ?? null;
    // 'to' là mốc NGÀY (gồm cả ngày đó) ⇒ chặn trên lấy 00:00 ngày kế tiếp
    const toExclusive = query.to ? new Date(query.to.getTime() + 24 * 60 * 60 * 1000) : null;
    const partnerId = query.partnerId ?? null;

    // gmv = Σ totalAmount; commission = Σ commission_amount (bỏ 'disputed'); cùng lọc theo pc.created_at.
    // commissionRatePct = % hoa hồng BÌNH QUÂN GIA QUYỀN theo giá trị booking trong kỳ, lấy từ
    // pc.commission_rate (mức đóng băng lúc thanh toán) chứ KHÔNG chia commission/gmv: refund tính lại
    // commission_amount còn total_amount giữ nguyên ⇒ hai số khác mẫu số, chia ra là sai (xem
    // revenue.service). Lưu ý tỉ lệ này gộp cả bản ghi 'disputed' trong khi cột `commission` đã loại
    // chúng, nên `gmv × commissionRatePct` không nhất thiết bằng `commission` — đúng theo thiết kế.
    // NULL::... để 3 chiều cùng một tập cột, gán key theo chiều rồi đổi tên ở bước map bên dưới.
    const commissionSql = {
      partner: `SELECT hp.id::text AS key, hp.business_name AS name, NULL::text AS city,
                       NULL::text AS "partnerId", NULL::text AS "partnerName",
                       count(*)::int AS "bookingCount", count(DISTINCT h.id)::int AS "hotelCount",
                       coalesce(sum(b.total_amount),0)::text AS gmv,
                       coalesce(sum(CASE WHEN pc.status <> 'disputed' THEN pc.commission_amount ELSE 0 END),0)::text AS commission,
                       round(sum(b.total_amount * pc.commission_rate) / nullif(sum(b.total_amount),0), 2)::text AS "commissionRatePct"
                FROM platform_commissions pc
                JOIN bookings b ON b.id = pc.booking_id
                JOIN hotels h ON h.id = b.hotel_id
                JOIN hotel_partners hp ON hp.id = h.partner_id
                WHERE ($1::timestamptz IS NULL OR pc.created_at >= $1)
                  AND ($2::timestamptz IS NULL OR pc.created_at < $2)
                  AND ($3::uuid IS NULL OR h.partner_id = $3)
                GROUP BY hp.id, hp.business_name`,
      hotel: `SELECT h.id::text AS key, h.name AS name, h.city AS city,
                     hp.id::text AS "partnerId", hp.business_name AS "partnerName",
                     count(*)::int AS "bookingCount", NULL::int AS "hotelCount",
                     coalesce(sum(b.total_amount),0)::text AS gmv,
                     coalesce(sum(CASE WHEN pc.status <> 'disputed' THEN pc.commission_amount ELSE 0 END),0)::text AS commission,
                     round(sum(b.total_amount * pc.commission_rate) / nullif(sum(b.total_amount),0), 2)::text AS "commissionRatePct"
              FROM platform_commissions pc
              JOIN bookings b ON b.id = pc.booking_id
              JOIN hotels h ON h.id = b.hotel_id
              JOIN hotel_partners hp ON hp.id = h.partner_id
              WHERE ($1::timestamptz IS NULL OR pc.created_at >= $1)
                AND ($2::timestamptz IS NULL OR pc.created_at < $2)
                AND ($3::uuid IS NULL OR h.partner_id = $3)
              GROUP BY h.id, h.name, h.city, hp.id, hp.business_name`,
      city: `SELECT h.city AS key, h.city AS name, NULL::text AS city,
                    NULL::text AS "partnerId", NULL::text AS "partnerName",
                    count(*)::int AS "bookingCount", count(DISTINCT h.id)::int AS "hotelCount",
                    coalesce(sum(b.total_amount),0)::text AS gmv,
                    coalesce(sum(CASE WHEN pc.status <> 'disputed' THEN pc.commission_amount ELSE 0 END),0)::text AS commission,
                    round(sum(b.total_amount * pc.commission_rate) / nullif(sum(b.total_amount),0), 2)::text AS "commissionRatePct"
             FROM platform_commissions pc
             JOIN bookings b ON b.id = pc.booking_id
             JOIN hotels h ON h.id = b.hotel_id
             WHERE ($1::timestamptz IS NULL OR pc.created_at >= $1)
               AND ($2::timestamptz IS NULL OR pc.created_at < $2)
               AND ($3::uuid IS NULL OR h.partner_id = $3)
             GROUP BY h.city`,
    }[groupBy];

    // refunded theo NGÀY TẠO yêu cầu hoàn (r.created_at); khoá gộp KHỚP với key ở trên.
    // CHỈ tính refund đã 'processed' — tiền chỉ thực sự rời ví ở bước này (xem model Refund).
    const refundKey = { partner: 'h.partner_id::text', hotel: 'b.hotel_id::text', city: 'h.city' }[groupBy];
    const refundSql = `SELECT ${refundKey} AS key, coalesce(sum(r.amount),0)::text AS refunded
      FROM refunds r
      JOIN payments p ON p.id = r.payment_id
      JOIN bookings b ON b.id = p.booking_id
      JOIN hotels h ON h.id = b.hotel_id
      WHERE r.status = 'processed'
        AND ($1::timestamptz IS NULL OR r.created_at >= $1)
        AND ($2::timestamptz IS NULL OR r.created_at < $2)
        AND ($3::uuid IS NULL OR h.partner_id = $3)
      GROUP BY ${refundKey}`;

    type Row = {
      key: string;
      name: string | null;
      city: string | null;
      partnerId: string | null;
      partnerName: string | null;
      bookingCount: number;
      hotelCount: number | null;
      gmv: string;
      commission: string;
      // null khi nhóm không có doanh thu để chia (nullif ở SQL) — map thành '0' khi trả ra
      commissionRatePct: string | null;
    };
    const [rows, refundRows] = await Promise.all([
      prisma.$queryRawUnsafe<Row[]>(commissionSql, from, toExclusive, partnerId),
      prisma.$queryRawUnsafe<{ key: string; refunded: string }[]>(refundSql, from, toExclusive, partnerId),
    ]);
    const refundByKey = new Map(refundRows.map((r) => [r.key, r.refunded]));

    // Sắp giảm dần theo tiêu chí chọn (mặc định doanh thu sàn), rồi phân trang trong bộ nhớ
    const sorted = rows.sort((a, b) => {
      if (sortBy === 'bookingCount') return b.bookingCount - a.bookingCount;
      return new Prisma.Decimal(b[sortBy]).comparedTo(new Prisma.Decimal(a[sortBy]));
    });
    const totalResults = sorted.length;
    const paged = sorted.slice((page - 1) * limit, page * limit);

    // Tổng của TOÀN BỘ nhóm (không riêng trang hiện tại) để FE vẽ cột "tỉ trọng" và pie chart.
    // refunded chỉ cộng những nhóm CÓ trong `rows`: nhóm chỉ có hoàn tiền mà không có hoa hồng trong
    // kỳ (hai mốc ngày khác nhau) không hiện thành dòng nào, cộng vào sẽ khiến tổng > tổng các dòng.
    const rowKeys = new Set(rows.map((r) => r.key));
    let totalGmv = new Prisma.Decimal(0);
    let totalCommission = new Prisma.Decimal(0);
    let totalBookingCount = 0;
    for (const r of sorted) {
      totalGmv = totalGmv.add(r.gmv);
      totalCommission = totalCommission.add(r.commission);
      totalBookingCount += r.bookingCount;
    }
    const totalRefunded = refundRows
      .filter((r) => rowKeys.has(r.key))
      .reduce((sum, r) => sum.add(r.refunded), new Prisma.Decimal(0));

    const results = paged.map((r) => {
      const refunded = refundByKey.get(r.key) ?? '0';
      const commissionRatePct = r.commissionRatePct ?? '0';
      // Tỉ trọng doanh thu sàn mà nhóm này đóng góp — dùng cho cột "tỉ trọng" và đo mức tập trung
      const sharePct = totalCommission.isZero()
        ? 0
        : new Prisma.Decimal(r.commission).div(totalCommission).mul(100).toDecimalPlaces(2).toNumber();

      if (groupBy === 'partner') {
        return {
          partnerId: r.key,
          name: r.name,
          gmv: r.gmv,
          commission: r.commission,
          commissionRatePct,
          refunded,
          bookingCount: r.bookingCount,
          hotelCount: r.hotelCount,
          sharePct,
        };
      }
      if (groupBy === 'city') {
        return {
          city: r.key,
          gmv: r.gmv,
          commission: r.commission,
          commissionRatePct,
          refunded,
          bookingCount: r.bookingCount,
          hotelCount: r.hotelCount,
          sharePct,
        };
      }
      return {
        hotelId: r.key,
        name: r.name,
        city: r.city,
        partnerId: r.partnerId,
        partnerName: r.partnerName,
        gmv: r.gmv,
        commission: r.commission,
        commissionRatePct,
        refunded,
        bookingCount: r.bookingCount,
        sharePct,
      };
    });

    return {
      groupBy,
      // Metadata báo cáo: mọi số tiền dưới đây là VND, chốt tại thời điểm asOf
      currency: 'VND',
      asOf: new Date().toISOString(),
      totals: {
        gmv: totalGmv.toString(),
        commission: totalCommission.toString(),
        refunded: totalRefunded.toString(),
        bookingCount: totalBookingCount,
      },
      results,
      page,
      limit,
      totalPages: Math.ceil(totalResults / limit),
      totalResults,
    };
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

  /**
   * [Cron] Tự tất toán các khoản hoa hồng ĐỦ ĐIỀU KIỆN: booking đã chốt sổ (checked_out hoặc no_show)
   * và đã qua kỳ giữ SETTLEMENT_HOLD_DAYS ngày. Mỗi khoản: commission
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
