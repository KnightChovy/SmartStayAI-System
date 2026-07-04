import { Prisma } from '@prisma/client';
import type { User, WalletTransactionType } from '@prisma/client';
import prisma from '../config/prisma';
import { hotelService } from './hotel.service';

// Booking được tính doanh thu = đã chốt (giống rule GMV toàn sàn ở admin.service.getOverview)
const REVENUE_STATUSES: Prisma.BookingWhereInput['status'] = {
  in: ['confirmed', 'checked_in', 'checked_out'],
};

type RevenueQuery = { from?: Date; to?: Date; groupBy?: 'day' | 'month' };
type WalletQuery = { type?: WalletTransactionType; page?: number; limit?: number };

export class RevenueService {
  /**
   * [Chủ KS / manager] Báo cáo doanh thu MỘT khách sạn trong khoảng [from, to].
   * gross = tổng tiền booking đã chốt; commission = hoa hồng sàn; net = gross − commission;
   * refunded = tổng đã hoàn. Kèm chuỗi thời gian theo ngày/tháng. Tiền trả dạng chuỗi (Decimal).
   */
  getHotelRevenue = async (hotelId: string, currentUser: User, query: RevenueQuery) => {
    await hotelService.getOperableHotel(hotelId, currentUser); // ném lỗi nếu không có quyền
    const groupBy = query.groupBy ?? 'day';

    // 'to' là mốc NGÀY (bao gồm cả ngày đó) ⇒ chặn trên lấy 00:00 ngày kế tiếp (nửa khoảng [from, toExclusive))
    const from = query.from;
    const toExclusive = query.to ? new Date(query.to.getTime() + 24 * 60 * 60 * 1000) : undefined;
    const createdAt = this.buildDateFilter(from, toExclusive);
    const dateWhere = createdAt ? { createdAt } : {};

    const [bookingAgg, commissionAgg, refundAgg] = await prisma.$transaction([
      prisma.booking.aggregate({
        _sum: { totalAmount: true },
        _count: { _all: true },
        where: { hotelId, status: REVENUE_STATUSES, ...dateWhere },
      }),
      prisma.platformCommission.aggregate({
        _sum: { commissionAmount: true },
        where: { booking: { hotelId }, ...dateWhere },
      }),
      prisma.refund.aggregate({
        _sum: { amount: true },
        where: { payment: { booking: { hotelId } }, ...dateWhere },
      }),
    ]);

    const gross = bookingAgg._sum.totalAmount ?? new Prisma.Decimal(0);
    const commission = commissionAgg._sum.commissionAmount ?? new Prisma.Decimal(0);
    const refunded = refundAgg._sum.amount ?? new Prisma.Decimal(0);

    const series = await this.buildRevenueSeries(hotelId, groupBy, from, toExclusive);

    return {
      summary: {
        gross: gross.toString(),
        commission: commission.toString(),
        net: gross.sub(commission).toString(),
        refunded: refunded.toString(),
        bookingCount: bookingAgg._count._all,
      },
      groupBy,
      series,
    };
  };

  // Chuỗi thời gian gross/commission theo kỳ. Prisma không group theo date_trunc được nên dùng raw SQL.
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

    const grossRows = await prisma.$queryRawUnsafe<{ period: string; bookingCount: number; gross: string }[]>(
      `SELECT to_char(date_trunc('${trunc}', created_at), '${fmt}') AS period,
              count(*)::int AS "bookingCount",
              coalesce(sum(total_amount), 0)::text AS gross
       FROM bookings
       WHERE hotel_id = $1::uuid
         AND status IN ('confirmed', 'checked_in', 'checked_out')
         AND ($2::timestamptz IS NULL OR created_at >= $2)
         AND ($3::timestamptz IS NULL OR created_at < $3)
       GROUP BY 1`,
      hotelId,
      fromParam,
      toParam
    );
    const commissionRows = await prisma.$queryRawUnsafe<{ period: string; commission: string }[]>(
      `SELECT to_char(date_trunc('${trunc}', pc.created_at), '${fmt}') AS period,
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

    const commissionByPeriod = new Map(commissionRows.map((r) => [r.period, r.commission]));
    return grossRows
      .sort((a, b) => a.period.localeCompare(b.period))
      .map((r) => {
        const gross = new Prisma.Decimal(r.gross);
        const commission = new Prisma.Decimal(commissionByPeriod.get(r.period) ?? 0);
        return {
          period: r.period,
          gross: gross.toString(),
          commission: commission.toString(),
          net: gross.sub(commission).toString(),
          bookingCount: r.bookingCount,
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
        wallet: { balanceAvailable: '0', balancePending: '0', currency: 'VND' },
        transactions: { results: [], page, limit, totalPages: 0, totalResults: 0 },
      };
    }

    const where: Prisma.WalletTransactionWhereInput = { walletId: wallet.id };
    if (query.type) where.type = query.type;

    const [rows, totalResults] = await prisma.$transaction([
      prisma.walletTransaction.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.walletTransaction.count({ where }),
    ]);

    return {
      wallet: {
        balanceAvailable: wallet.balanceAvailable.toString(),
        balancePending: wallet.balancePending.toString(),
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

  private buildDateFilter = (from?: Date, toExclusive?: Date): Prisma.DateTimeFilter | undefined => {
    if (!from && !toExclusive) return undefined;
    const filter: Prisma.DateTimeFilter = {};
    if (from) filter.gte = from;
    if (toExclusive) filter.lt = toExclusive;
    return filter;
  };
}

export const revenueService = new RevenueService();
