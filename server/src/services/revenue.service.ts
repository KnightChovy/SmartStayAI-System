import { Prisma } from '@prisma/client';
import type { User, WalletTransactionType } from '@prisma/client';
import prisma from '../config/prisma';
import { hotelService } from './hotel.service';
import { platformManagerService } from './platform-manager.service';
import { commissionRateService } from './commission-rate.service';

type RevenueQuery = { from?: Date; to?: Date; groupBy?: 'day' | 'month' };
type WalletQuery = { type?: WalletTransactionType; page?: number; limit?: number };

export class RevenueService {
  /**
   * [Chủ KS / manager] Báo cáo doanh thu MỘT khách sạn trong khoảng [from, to].
   *
   * MỐC NGÀY THỐNG NHẤT = "ngày ghi nhận" theo sự kiện tiền:
   * - gross/commission tính theo NGÀY THANH TOÁN. Mỗi booking trả đủ tiền tạo ĐÚNG một
   *   PlatformCommission (cả cổng, ví lẫn tiền mặt), nên `commission.createdAt` = mốc thanh toán;
   *   gross = tổng `booking.totalAmount` của các booking đã ghi nhận trong kỳ.
   * - refunded tính theo NGÀY TẠO yêu cầu hoàn (`refund.createdAt`).
   *
   * net = gross − commission (GIỮ NGUYÊN cho FE cũ). netAfterRefund = net − refunded (MỚI, phản ánh
   * doanh thu THỰC sau hoàn tiền — net cũ không trừ refund nên phóng đại). Tiền trả dạng chuỗi.
   *
   * commissionRate = mức hoa hồng ĐANG áp cho khách sạn (%), để giao diện đối tác hiện "45.000đ · 15%"
   * mà KHÔNG phải tự chia `commission / gross` — phép chia đó ra số sai khi trong kỳ có hoàn tiền:
   * refund tính lại `commissionAmount` trên phần khách sạn thực giữ (xem refund.service), còn `gross`
   * vẫn cộng cả booking đã hoàn, nên hai số khác mẫu số.
   */
  getHotelRevenue = async (hotelId: string, currentUser: User, query: RevenueQuery) => {
    await hotelService.getOperableHotel(hotelId, currentUser); // ném lỗi nếu không có quyền
    const groupBy = query.groupBy ?? 'day';

    // 'to' là mốc NGÀY (bao gồm cả ngày đó) ⇒ chặn trên lấy 00:00 ngày kế tiếp (nửa khoảng [from, toExclusive))
    const from = query.from;
    const toExclusive = query.to ? new Date(query.to.getTime() + 24 * 60 * 60 * 1000) : undefined;
    const createdAt = this.buildDateFilter(from, toExclusive);
    const dateWhere = createdAt ? { createdAt } : {};

    const [commissions, refundAgg] = await prisma.$transaction([
      // Lấy commission (đã ghi nhận trong kỳ) kèm totalAmount của booking để cộng gross cùng một mốc
      prisma.platformCommission.findMany({
        where: { booking: { hotelId }, ...dateWhere },
        select: { commissionAmount: true, booking: { select: { totalAmount: true } } },
      }),
      prisma.refund.aggregate({
        _sum: { amount: true },
        where: { payment: { booking: { hotelId } }, ...dateWhere },
      }),
    ]);

    const gross = commissions.reduce((sum, c) => sum.add(c.booking.totalAmount), new Prisma.Decimal(0));
    const commission = commissions.reduce((sum, c) => sum.add(c.commissionAmount), new Prisma.Decimal(0));
    const refunded = refundAgg._sum.amount ?? new Prisma.Decimal(0);
    const net = gross.sub(commission);

    const series = await this.buildRevenueSeries(hotelId, groupBy, from, toExclusive);

    // Mức của HÔM NAY (cùng nguồn với màn Commission của đối tác), không phải mức trung bình của kỳ:
    // một kỳ dài có thể trải qua nhiều mức (đổi mức nền, ưu đãi riêng hết hạn) nên không tồn tại một
    // con số % đúng cho cả kỳ — trả mức đang chịu là thứ đối tác cần biết và luôn có, kể cả kỳ trống.
    const commissionRate = await commissionRateService.resolveRate(hotelId, new Date());

    return {
      summary: {
        gross: gross.toString(),
        commission: commission.toString(),
        net: net.toString(),
        netAfterRefund: net.sub(refunded).toString(),
        refunded: refunded.toString(),
        bookingCount: commissions.length,
        commissionRate: commissionRate.toString(),
      },
      groupBy,
      series,
    };
  };

  // Chuỗi thời gian theo kỳ, CÙNG mốc ghi nhận với summary. Prisma không group theo date_trunc được
  // nên dùng raw SQL. gross+commission theo pc.created_at (ngày thanh toán); refunded theo r.created_at.
  private buildRevenueSeries = async (
    hotelId: string,
    groupBy: 'day' | 'month',
    from?: Date,
    toExclusive?: Date
  ) => {
    const trunc = groupBy === 'month' ? 'month' : 'day'; // whitelist, không phải input tự do
    const fmt = groupBy === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD';
    const fromParam = from ?? null;
    const toParam = toExclusive ?? null;

    // gross + commission theo NGÀY THANH TOÁN (pc.created_at), join booking để lấy totalAmount
    const recRows = await prisma.$queryRawUnsafe<
      { period: string; bookingCount: number; gross: string; commission: string }[]
    >(
      `SELECT to_char(date_trunc('${trunc}', pc.created_at), '${fmt}') AS period,
              count(*)::int AS "bookingCount",
              coalesce(sum(b.total_amount), 0)::text AS gross,
              coalesce(sum(pc.commission_amount), 0)::text AS commission
       FROM platform_commissions pc
       JOIN bookings b ON b.id = pc.booking_id
       WHERE b.hotel_id = $1::uuid
         AND ($2::timestamptz IS NULL OR pc.created_at >= $2)
         AND ($3::timestamptz IS NULL OR pc.created_at < $3)
       GROUP BY 1`,
      hotelId,
      fromParam,
      toParam
    );
    // refunded theo NGÀY TẠO yêu cầu hoàn (r.created_at)
    const refundRows = await prisma.$queryRawUnsafe<{ period: string; refunded: string }[]>(
      `SELECT to_char(date_trunc('${trunc}', r.created_at), '${fmt}') AS period,
              coalesce(sum(r.amount), 0)::text AS refunded
       FROM refunds r
       JOIN payments p ON p.id = r.payment_id
       JOIN bookings b ON b.id = p.booking_id
       WHERE b.hotel_id = $1::uuid
         AND ($2::timestamptz IS NULL OR r.created_at >= $2)
         AND ($3::timestamptz IS NULL OR r.created_at < $3)
       GROUP BY 1`,
      hotelId,
      fromParam,
      toParam
    );

    const recByPeriod = new Map(recRows.map((r) => [r.period, r]));
    const refundByPeriod = new Map(refundRows.map((r) => [r.period, r.refunded]));
    // Gộp mọi kỳ xuất hiện ở doanh thu HOẶC hoàn tiền (kỳ chỉ có refund vẫn phải hiện, net âm)
    const periods = [...new Set([...recByPeriod.keys(), ...refundByPeriod.keys()])];
    return periods
      .sort((a, b) => a.localeCompare(b))
      .map((period) => {
        const rec = recByPeriod.get(period);
        const gross = new Prisma.Decimal(rec?.gross ?? 0);
        const commission = new Prisma.Decimal(rec?.commission ?? 0);
        const refunded = new Prisma.Decimal(refundByPeriod.get(period) ?? 0);
        const net = gross.sub(commission);
        return {
          period,
          gross: gross.toString(),
          commission: commission.toString(),
          net: net.toString(),
          netAfterRefund: net.sub(refunded).toString(),
          refunded: refunded.toString(),
          bookingCount: rec?.bookingCount ?? 0,
        };
      });
  };

  /**
   * [Chủ KS / manager] Số dư ví + lịch sử giao dịch của MỘT khách sạn (phân trang, lọc theo loại).
   * KS chưa phát sinh giao dịch nào ⇒ trả ví rỗng thay vì 404.
   */
  getHotelWallet = async (hotelId: string, currentUser: User, query: WalletQuery) => {
    await hotelService.getOperableHotel(hotelId, currentUser);
    const limit = query.limit || 20;
    const page = query.page || 1;

    const wallet = await prisma.wallet.findUnique({ where: { hotelId } });
    if (!wallet) {
      return {
        wallet: { balanceAvailable: '0', balancePending: '0', pendingPayout: '0', currency: 'VND' },
        transactions: { results: [], page, limit, totalPages: 0, totalResults: 0 },
      };
    }

    const where: Prisma.WalletTransactionWhereInput = { walletId: wallet.id };
    if (query.type) where.type = query.type;

    const [rows, totalResults, payoutAgg] = await prisma.$transaction([
      prisma.walletTransaction.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.walletTransaction.count({ where }),
      // Tiền đang CHỜ PAYOUT = tổng yêu cầu rút đang pending (đã trừ khỏi available lúc tạo yêu cầu).
      // Payout paid → hết pending → số này về 0; reject → phần đó cộng lại available.
      prisma.payout.aggregate({ _sum: { amount: true }, where: { hotelId, status: 'pending' } }),
    ]);

    return {
      wallet: {
        balanceAvailable: wallet.balanceAvailable.toString(), // "trong ví" — rút được
        balancePending: wallet.balancePending.toString(), // "chờ tất toán" — khách chưa ở xong, chưa rút được
        pendingPayout: (payoutAgg._sum.amount ?? new Prisma.Decimal(0)).toString(), // "chờ payout" — đợi PM chi trả
        currency: wallet.currency,
      },
      transactions: {
        results: rows.map((t) => ({
          id: t.id,
          type: t.type,
          amount: t.amount.toString(),
          balanceAfter: t.balanceAfter.toString(),
          bookingId: t.bookingId,
          commissionId: t.commissionId,
          description: t.description,
          createdAt: t.createdAt,
        })),
        page,
        limit,
        totalPages: Math.ceil(totalResults / limit),
        totalResults,
      },
    };
  };

  /**
   * [Chủ KS / manager] Analytics vận hành của khách sạn mình: occupancy, cancellation, rating,
   * tốc độ phản hồi và điểm số tổng. Tái dùng đúng logic chấm điểm ở platform-manager
   * (getHotelPerformance) nhưng đổi tầng quyền từ platform sang chủ khách sạn (getOperableHotel).
   */
  getHotelAnalytics = async (hotelId: string, currentUser: User, query: { from?: Date; to?: Date }) => {
    await hotelService.getOperableHotel(hotelId, currentUser);
    return platformManagerService.getHotelPerformance(hotelId, query);
  };

  private buildDateFilter = (from?: Date, toExclusive?: Date): Prisma.DateTimeFilter | undefined => {
    if (!from && !toExclusive) return undefined;
    const filter: Prisma.DateTimeFilter = {};
    if (from) filter.gte = from;
    if (toExclusive) filter.lt = toExclusive;
    return filter;
  };
}

export const revenueService = new RevenueService();
