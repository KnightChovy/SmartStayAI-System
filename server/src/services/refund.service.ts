import httpStatus from 'http-status';
import { Prisma } from '@prisma/client';
import type { User, RefundStatus } from '@prisma/client';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';
import logger from '../config/logger';
import { hotelService } from './hotel.service';
import { walletService } from './wallet.service';
import type { RefundFilter, RefundQueryOptions, ReviewRefundDto, ProcessRefundDto } from '../dto/refund.dto';

// Số ngày khách sạn có để phản hồi một yêu cầu hoàn tiền. Quá hạn ⇒ hệ thống tự duyệt.
const REVIEW_DEADLINE_DAYS = 3;

// Thông tin kèm theo khi trả yêu cầu hoàn tiền: đủ để người duyệt quyết định mà không phải gọi thêm API
const refundInclude = {
  requesterUser: { select: { id: true, fullName: true, email: true, phone: true } },
  reviewer: { select: { id: true, fullName: true } },
  payment: {
    select: {
      id: true,
      paymentMethod: true,
      amount: true,
      paidAt: true,
      booking: {
        select: {
          id: true,
          bookingCode: true,
          checkInDate: true,
          checkOutDate: true,
          totalAmount: true,
          status: true,
          cancelledAt: true,
          cancellationReason: true,
          hotel: { select: { id: true, name: true, city: true } },
          roomType: { select: { id: true, name: true } },
        },
      },
    },
  },
} satisfies Prisma.RefundInclude;

export class RefundService {
  /** Phân trang chung cho các danh sách hoàn tiền. */
  private query = async (where: Prisma.RefundWhereInput, options: RefundQueryOptions) => {
    const limit = options.limit || 20;
    const page = options.page || 1;
    const [results, totalResults] = await prisma.$transaction([
      prisma.refund.findMany({
        where,
        include: refundInclude,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.refund.count({ where }),
    ]);
    return { results, page, limit, totalPages: Math.ceil(totalResults / limit), totalResults };
  };

  /**
   * [KS] Danh sách yêu cầu hoàn tiền của MỘT khách sạn (chủ KS / manager / staff được phân công).
   * Refund không nối thẳng tới hotel nên lọc qua payment → booking → hotelId.
   */
  listHotelRefunds = async (
    hotelId: string,
    currentUser: User,
    filter: RefundFilter,
    options: RefundQueryOptions
  ) => {
    await hotelService.getOperableHotel(hotelId, currentUser);
    const where: Prisma.RefundWhereInput = { payment: { booking: { hotelId } } };
    if (filter.status) {
      where.status = filter.status;
    }
    return this.query(where, options);
  };

  /** [Platform Manager] Danh sách yêu cầu hoàn tiền TOÀN SÀN, lọc thêm theo khách sạn nếu cần. */
  listAllRefunds = async (filter: RefundFilter, options: RefundQueryOptions) => {
    const where: Prisma.RefundWhereInput = {};
    if (filter.status) {
      where.status = filter.status;
    }
    if (filter.hotelId) {
      where.payment = { booking: { hotelId: filter.hotelId } };
    }
    return this.query(where, options);
  };

  /**
   * [KS] Duyệt hoặc từ chối một yêu cầu hoàn tiền. Chỉ yêu cầu đang 'pending' mới xét được.
   * Bước này KHÔNG chuyển tiền — approved chỉ là "đồng ý hoàn", tiền rời đi ở processRefund.
   */
  reviewRefund = async (hotelId: string, refundId: string, currentUser: User, payload: ReviewRefundDto) => {
    await hotelService.getOperableHotel(hotelId, currentUser);

    const refund = await prisma.refund.findFirst({
      where: { id: refundId, payment: { booking: { hotelId } } },
    });
    if (!refund) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy yêu cầu hoàn tiền của khách sạn này');
    }
    if (refund.status !== 'pending') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Yêu cầu này đã được xét duyệt rồi');
    }
    if (payload.decision === 'reject' && !payload.rejectionReason) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Cần nêu lý do khi từ chối hoàn tiền');
    }

    // Update CÓ ĐIỀU KIỆN (status pending) để hai người duyệt cùng lúc thì chỉ một bên thắng
    const reviewed = await prisma.refund.updateMany({
      where: { id: refundId, status: 'pending' },
      data: {
        status: payload.decision === 'approve' ? 'approved' : 'rejected',
        reviewedBy: currentUser.id,
        reviewedAt: new Date(),
        rejectionReason: payload.decision === 'reject' ? payload.rejectionReason : null,
      },
    });
    if (reviewed.count === 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Yêu cầu vừa được người khác xét duyệt');
    }
    return prisma.refund.findUniqueOrThrow({ where: { id: refundId }, include: refundInclude });
  };

  /**
   * [Platform Manager] Đánh dấu ĐÃ CHUYỂN KHOẢN xong cho một yêu cầu đã được khách sạn duyệt.
   *
   * Vì sao là Platform Manager mà không phải khách sạn: tiền khách trả nằm ở TÀI KHOẢN CỦA PLATFORM
   * (mô hình escrow) — ví khách sạn chỉ là con số ghi sổ, KS không cầm tiền nên không thể tự hoàn.
   * Khách sạn quyết định CÓ hoàn hay không (reviewRefund), Platform Manager THỰC THI chuyển khoản.
   *
   * Đây là nơi DUY NHẤT tiền thực sự rời khỏi khách sạn — trong một transaction:
   *   Refund → processed, Payment → refunded (nếu hoàn 100%),
   *   commission tính lại trên phần KS THỰC GIỮ, và ví trừ đúng phần net chênh lệch.
   * @param payload.refundTransactionId mã giao dịch chuyển khoản THẬT (không phải mã giả lập)
   */
  processRefund = async (refundId: string, currentUser: User, payload: ProcessRefundDto) => {
    const refund = await prisma.refund.findUnique({
      where: { id: refundId },
      include: {
        payment: {
          select: {
            id: true,
            amount: true,
            booking: { select: { id: true, hotelId: true, bookingCode: true, commission: true } },
          },
        },
      },
    });
    if (!refund) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy yêu cầu hoàn tiền');
    }
    if (refund.status !== 'approved') {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Chỉ xử lý được yêu cầu đã DUYỆT (approved). Yêu cầu chờ duyệt phải được khách sạn duyệt trước.'
      );
    }

    const { payment } = refund;
    const { booking } = payment;

    const result = await prisma.$transaction(async (tx) => {
      const done = await tx.refund.updateMany({
        where: { id: refundId, status: 'approved' },
        data: {
          status: 'processed',
          processedAt: new Date(),
          refundTransactionId: payload.refundTransactionId,
        },
      });
      if (done.count === 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Yêu cầu này vừa được xử lý');
      }

      // Hoàn 100% ⇒ Payment refunded; hoàn một phần ⇒ giữ completed (bản ghi Refund là nguồn sự thật)
      if (refund.amount.equals(payment.amount)) {
        await tx.payment.update({ where: { id: payment.id }, data: { status: 'refunded' } });
      }

      // Hoa hồng chỉ tính trên phần khách sạn THỰC GIỮ (đã trả − đã hoàn)
      if (booking.commission) {
        const retained = payment.amount.sub(refund.amount);
        const newCommission = retained.mul(booking.commission.commissionRate).div(100).toDecimalPlaces(2);
        await tx.platformCommission.update({
          where: { bookingId: booking.id },
          data: { commissionAmount: newCommission },
        });
        const oldNet = payment.amount.sub(booking.commission.commissionAmount);
        const newNet = retained.sub(newCommission);
        await walletService.recordRefund(tx, booking.hotelId, booking.id, oldNet.sub(newNet));
      }

      return tx.refund.findUniqueOrThrow({ where: { id: refundId }, include: refundInclude });
    });

    logger.info(
      `[Refund] Đã hoàn ${refund.amount.toString()}đ cho booking ${booking.bookingCode} ` +
        `(mã giao dịch ${payload.refundTransactionId}, admin ${currentUser.id})`
    );
    return result;
  };

  /**
   * [Cron] Tự duyệt các yêu cầu khách sạn để quá REVIEW_DEADLINE_DAYS ngày mà không phản hồi.
   *
   * Vì sao phải có: tiền hoàn được tính TỰ ĐỘNG theo chính sách huỷ của CHÍNH khách sạn đó — khách
   * có quyền nhận theo đúng hợp đồng đã công bố. Bước duyệt là để khách sạn xem xét NGOẠI LỆ, không
   * phải quyền phủ quyết. Không có hạn chót thì khách sạn chỉ cần im lặng là khách KHÔNG BAO GIỜ lấy
   * được tiền — đúng thứ mà cả Booking.com/Agoda đều không cho phép.
   *
   * Đánh dấu "tự động": reviewedAt CÓ giá trị nhưng reviewedBy = null (không người nào bấm duyệt).
   * Một updateMany có điều kiện `status: 'pending'` là đủ: vừa atomic, vừa idempotent nếu cron chạy chồng.
   * @returns số yêu cầu đã tự duyệt
   */
  autoApproveStaleRefunds = async (): Promise<number> => {
    const cutoff = new Date(Date.now() - REVIEW_DEADLINE_DAYS * 24 * 60 * 60 * 1000);
    const { count } = await prisma.refund.updateMany({
      where: { status: 'pending', createdAt: { lte: cutoff } },
      data: { status: 'approved', reviewedAt: new Date() },
    });
    if (count > 0) {
      logger.warn(
        `[Refund] Tự duyệt ${count} yêu cầu quá ${REVIEW_DEADLINE_DAYS} ngày khách sạn không phản hồi — ` +
          `chờ Platform Manager chuyển khoản`
      );
    }
    return count;
  };

  /**
   * Tạo yêu cầu hoàn tiền cho "tiền mồ côi": tiền đã vào nhưng booking không còn giữ chỗ
   * (đã huỷ/hết hạn) nên khách KHÔNG có phòng. Đặt thẳng 'approved' vì đây là lỗi hệ thống,
   * khách sạn không có gì để xét — chỉ chờ admin chuyển trả.
   * Chạy TRONG transaction của luồng xác nhận thanh toán nên nhận `tx`.
   */
  createOrphanRefund = async (
    tx: Prisma.TransactionClient,
    args: { paymentId: string; customerId: string; amount: Prisma.Decimal; bookingCode: string }
  ) => {
    await tx.refund.create({
      data: {
        paymentId: args.paymentId,
        requestedBy: args.customerId,
        amount: args.amount,
        reason: `Tiền vào sau khi booking ${args.bookingCode} hết hạn giữ chỗ — khách không có phòng, hoàn toàn bộ`,
        status: 'approved',
        reviewedAt: new Date(),
      },
    });
  };

  /** Trạng thái hợp lệ để lọc — dùng chung cho validation. */
  static readonly STATUSES: RefundStatus[] = ['pending', 'approved', 'processed', 'rejected'];
}

export const refundService = new RefundService();
