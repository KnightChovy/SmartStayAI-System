import httpStatus from 'http-status';
import { Prisma } from '@prisma/client';
import type { User, PayoutStatus } from '@prisma/client';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';
import { hotelService } from './hotel.service';
import { walletService } from './wallet.service';
import { decrypt, encrypt } from '../utils/encryption';

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
      throw new ApiError(httpStatus.NOT_FOUND, 'Hotel not found');
    }
    if (hotel.partner.ownerId !== currentUser.id) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Only the hotel owner can request a payout');
    }
    if (amount.lessThan(MIN_PAYOUT_AMOUNT)) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Minimum payout amount is ${MIN_PAYOUT_AMOUNT.toString()}đ`);
    }
    // Phải có tài khoản nhận tiền (ưu tiên tài khoản chính) — không thì PM không biết chuyển đi đâu
    const account =
      (await prisma.hotelPayoutAccount.findFirst({ where: { hotelId, isPrimary: true } })) ??
      (await prisma.hotelPayoutAccount.findFirst({ where: { hotelId } }));
    if (!account) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'The hotel has no payout account set up yet');
    }

    return prisma.$transaction(async (tx) => {
      const payout = await tx.payout.create({
        data: { hotelId, partnerId: hotel.partner.id, payoutAccountId: account.id, amount, status: 'pending' },
      });
      // Giữ tiền ngay; ném lỗi (rollback cả payout) nếu số dư không đủ. Bút toán ví gắn payout.id
      // để sổ ví tra được yêu cầu này đã duyệt hay chưa.
      await walletService.holdForPayout(tx, hotelId, amount, payout.id);
      return payout;
    });
  };

  /**
   * [Chủ KS] Đổi/tạo tài khoản nhận tiền CHÍNH của khách sạn. CHỈ chủ KS (owner) được đổi — đây là
   * nơi tiền rút được chuyển tới, nên nhất quán với payout owner-only. Số TK lưu MÃ HOÁ (encrypt).
   *
   * Đã có tài khoản chính ⇒ cập nhật TẠI CHỖ (giữ nguyên id để yêu cầu rút đang trỏ tới không hỏng);
   * chưa có ⇒ tạo mới. Field tuỳ chọn KHÔNG gửi (undefined) ⇒ giữ nguyên giá trị cũ; gửi rỗng ⇒ null.
   *
   * ⚠️ Không chặn khi đang có yêu cầu rút pending: đổi tài khoản lúc đó khiến PM chi trả vào tài khoản
   * MỚI (cùng bản ghi). Chủ KS tự quyết cả hai thao tác nên đây là hành vi mong muốn.
   */
  updatePayoutAccount = async (
    hotelId: string,
    currentUser: User,
    body: {
      accountHolder: string;
      bankName: string;
      accountNumber: string;
      bankBranch?: string;
      swiftCode?: string;
      taxIdVatNumber?: string;
      registeredBusinessAddress?: string;
    }
  ) => {
    const hotel = await prisma.hotel.findFirst({
      where: { id: hotelId, deletedAt: null },
      include: { partner: { select: { id: true, ownerId: true } } },
    });
    if (!hotel) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Hotel not found');
    }
    if (hotel.partner.ownerId !== currentUser.id) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Only the hotel owner can change the payout account');
    }

    // undefined ⇒ không đụng tới (giữ giá trị cũ khi update); '' ⇒ null
    const clean = (v?: string): string | null | undefined => (v === undefined ? undefined : v.trim() || null);
    const data = {
      accountHolder: body.accountHolder.trim(),
      bankName: body.bankName.trim(),
      accountNumber: encrypt(body.accountNumber.trim()), // lưu ciphertext, KHÔNG bao giờ lưu plaintext
      bankBranch: clean(body.bankBranch),
      swiftCode: clean(body.swiftCode),
      taxIdVatNumber: clean(body.taxIdVatNumber),
      registeredBusinessAddress: clean(body.registeredBusinessAddress),
    };

    const existing = await prisma.hotelPayoutAccount.findFirst({
      where: { hotelId, isPrimary: true },
      orderBy: { createdAt: 'desc' },
    });
    const account = existing
      ? await prisma.hotelPayoutAccount.update({ where: { id: existing.id }, data })
      : await prisma.hotelPayoutAccount.create({
          data: { ...data, hotelId, partnerId: hotel.partner.id, isPrimary: true },
        });

    // Trả kèm số ĐẦY ĐỦ (chủ KS vừa nhập) — cùng shape với payoutAccount ở GET /wallet để FE tái dùng
    return {
      id: account.id,
      accountHolder: account.accountHolder,
      bankName: account.bankName,
      bankBranch: account.bankBranch,
      swiftCode: account.swiftCode,
      taxIdVatNumber: account.taxIdVatNumber,
      registeredBusinessAddress: account.registeredBusinessAddress,
      isPrimary: account.isPrimary,
      accountNumber: decrypt(account.accountNumber),
    };
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
      throw new ApiError(httpStatus.NOT_FOUND, 'Payout request not found');
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
      throw new ApiError(httpStatus.NOT_FOUND, 'Payout request not found');
    }
    if (payout.status !== 'pending') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'This payout request has already been processed');
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
        throw new ApiError(httpStatus.BAD_REQUEST, 'This payout request was just processed');
      }
    } else {
      await prisma.$transaction(async (tx) => {
        const done = await tx.payout.updateMany({
          where: { id: payoutId, status: 'pending' },
          data: { status: 'failed' as PayoutStatus, notes: input.notes ?? null },
        });
        if (done.count === 0) {
          throw new ApiError(httpStatus.BAD_REQUEST, 'This payout request was just processed');
        }
        await walletService.releasePayoutHold(tx, payout.hotelId, payout.amount, payout.id);
      });
    }
    return prisma.payout.findUniqueOrThrow({
      where: { id: payoutId },
      include: { hotel: { select: { id: true, name: true } } },
    });
  };
}

export const payoutService = new PayoutService();
