import httpStatus from 'http-status';
import { Prisma } from '@prisma/client';
import type { User, PayoutStatus } from '@prisma/client';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';
import { hotelService } from './hotel.service';
import { walletService } from './wallet.service';
import { decrypt } from '../utils/encryption';

// Rút tối thiểu 100.000đ để tránh chi trả vụn vặt tốn phí chuyển khoản.
const MIN_PAYOUT_AMOUNT = new Prisma.Decimal(100_000);

type PayoutListQuery = { status?: PayoutStatus; page?: number; limit?: number };
type ReviewInput = { payoutTransactionId?: string; notes?: string };

export class PayoutService {
  /**
   * [Chủ KS] Tạo yêu cầu RÚT TIỀN: partner nhập số tiền muốn rút từ balanceAvailable, Platform Manager
   * duyệt MỘT lần rồi chuyển khoản. CHỈ chủ khách sạn (owner) được rút — không phải staff/manager/admin.
   *
   * Tiền được GIỮ ngay khi tạo yêu cầu (trừ balanceAvailable) để không thể tạo nhiều yêu cầu rút vượt
   * số dư; bị từ chối thì hoàn lại. Số dư escrow (balancePending, chưa tất toán) KHÔNG rút được.
   */
  requestPayout = async (hotelId: string, currentUser: User, amount: Prisma.Decimal) => {
    const hotel = await prisma.hotel.findFirst({
      where: { id: hotelId, deletedAt: null },
      include: { partner: { select: { id: true, ownerId: true } } },
    });
    if (!hotel) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy khách sạn');
    }
    if (hotel.partner.ownerId !== currentUser.id) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Chỉ chủ khách sạn được yêu cầu rút tiền');
    }
    if (amount.lessThan(MIN_PAYOUT_AMOUNT)) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Số tiền rút tối thiểu là ${MIN_PAYOUT_AMOUNT.toString()}đ`);
    }
    // Phải có tài khoản nhận tiền (ưu tiên tài khoản chính) — không thì PM không biết chuyển đi đâu
    const account =
      (await prisma.hotelPayoutAccount.findFirst({ where: { hotelId, isPrimary: true } })) ??
      (await prisma.hotelPayoutAccount.findFirst({ where: { hotelId } }));
    if (!account) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Khách sạn chưa có tài khoản nhận tiền để rút');
    }

    return prisma.$transaction(async (tx) => {
      const payout = await tx.payout.create({
        data: { hotelId, partnerId: hotel.partner.id, payoutAccountId: account.id, amount, status: 'pending' },
      });
      // Giữ tiền ngay; ném lỗi (rollback cả payout) nếu số dư không đủ
      await walletService.holdForPayout(tx, hotelId, amount);
      return payout;
    });
  };

  /** [Chủ KS / manager] Lịch sử yêu cầu rút của MỘT khách sạn (KHÔNG lộ số tài khoản). */
  listHotelPayouts = async (hotelId: string, currentUser: User, query: PayoutListQuery) => {
    await hotelService.getManagedHotel(hotelId, currentUser); // ném lỗi nếu không có quyền
    const limit = query.limit || 20;
    const page = query.page || 1;

    const where: Prisma.PayoutWhereInput = { hotelId, ...(query.status && { status: query.status }) };
    const [results, totalResults] = await prisma.$transaction([
      prisma.payout.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          payoutTransactionId: true,
          processedAt: true,
          notes: true,
          createdAt: true,
        },
      }),
      prisma.payout.count({ where }),
    ]);
    return { results, page, limit, totalPages: Math.ceil(totalResults / limit), totalResults };
  };

  /** [Platform Manager] Danh sách yêu cầu rút TOÀN SÀN, lọc theo trạng thái (kèm KS + ngân hàng, KHÔNG số TK). */
  listPlatformPayouts = async (query: PayoutListQuery) => {
    const limit = query.limit || 20;
    const page = query.page || 1;
    const where: Prisma.PayoutWhereInput = query.status ? { status: query.status } : {};

    const [results, totalResults] = await prisma.$transaction([
      prisma.payout.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          payoutTransactionId: true,
          processedAt: true,
          notes: true,
          createdAt: true,
          hotel: { select: { id: true, name: true, city: true } },
          // accountHolder/bankName để PM nhận diện; accountNumber KHÔNG trả ở danh sách
          payoutAccount: { select: { accountHolder: true, bankName: true } },
        },
      }),
      prisma.payout.count({ where }),
    ]);
    return { results, page, limit, totalPages: Math.ceil(totalResults / limit), totalResults };
  };

  /**
   * [Platform Manager] Chi tiết một yêu cầu rút KÈM số tài khoản đã GIẢI MÃ — chỉ nơi này giải mã,
   * cho đúng người sắp đi chuyển khoản. Không dùng ở danh sách/đối tác.
   */
  getPayoutForManager = async (payoutId: string) => {
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: {
        hotel: { select: { id: true, name: true, city: true } },
        payoutAccount: true,
      },
    });
    if (!payout) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy yêu cầu rút tiền');
    }
    return {
      ...payout,
      payoutAccount: { ...payout.payoutAccount, accountNumber: decrypt(payout.payoutAccount.accountNumber) },
    };
  };

  /**
   * [Platform Manager] Duyệt / từ chối một yêu cầu rút (chỉ khi đang 'pending').
   * - approve: PM đã chuyển khoản tay ⇒ status = 'paid', ghi mã giao dịch. Ví đã bị trừ lúc yêu cầu
   *   nên KHÔNG đụng ví nữa.
   * - reject: status = 'failed' + HOÀN phần đã giữ vào balanceAvailable.
   * Update CÓ ĐIỀU KIỆN (status pending) để hai lần duyệt song song không xử lý hai lần.
   */
  reviewPayout = async (
    payoutId: string,
    decision: 'approve' | 'reject',
    input: ReviewInput
  ) => {
    const payout = await prisma.payout.findUnique({ where: { id: payoutId } });
    if (!payout) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy yêu cầu rút tiền');
    }
    if (payout.status !== 'pending') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Yêu cầu rút này đã được xử lý');
    }

    if (decision === 'approve') {
      const done = await prisma.payout.updateMany({
        where: { id: payoutId, status: 'pending' },
        data: {
          status: 'paid',
          processedAt: new Date(),
          payoutTransactionId: input.payoutTransactionId ?? null,
          notes: input.notes ?? null,
        },
      });
      if (done.count === 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Yêu cầu rút này vừa được xử lý');
      }
    } else {
      await prisma.$transaction(async (tx) => {
        const done = await tx.payout.updateMany({
          where: { id: payoutId, status: 'pending' },
          data: { status: 'failed' as PayoutStatus, notes: input.notes ?? null },
        });
        if (done.count === 0) {
          throw new ApiError(httpStatus.BAD_REQUEST, 'Yêu cầu rút này vừa được xử lý');
        }
        await walletService.releasePayoutHold(tx, payout.hotelId, payout.amount);
      });
    }
    return prisma.payout.findUniqueOrThrow({
      where: { id: payoutId },
      include: { hotel: { select: { id: true, name: true } } },
    });
  };
}

export const payoutService = new PayoutService();
