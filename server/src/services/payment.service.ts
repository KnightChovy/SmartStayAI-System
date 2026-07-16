import httpStatus from 'http-status';
import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import type { User, Payment } from '@prisma/client';
import prisma from '../config/prisma';
import config from '../config/config';
import logger from '../config/logger';
import ApiError from '../utils/ApiError';
import { emailService } from './email.service';
import type { VnpayParams, VnpayResult, SepayWebhookPayload, SepayPaymentInfo } from '../dto/payment.dto';
import { walletService } from './wallet.service';

// Ảnh QR VietQR do SePay dựng sẵn — chỉ là URL ảnh, không cần gọi API/ký gì cả.
const SEPAY_QR_ENDPOINT = 'https://qr.sepay.vn/img';

// Mã booking luôn dạng BK + [A-Z0-9]. Ngân hàng hay chèn thêm chữ vào nội dung chuyển khoản
// (vd "CT DEN:xxx BKABC123 GD..."), nên phải BÓC bằng regex thay vì so khớp cả chuỗi.
const BOOKING_CODE_PATTERN = /BK[A-Z0-9]+/i;

// Định dạng ngày VNPay yêu cầu: yyyyMMddHHmmss (giờ máy chủ)
const formatVnpDate = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    String(date.getFullYear()) +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
};

const generateVoucherCode = (): string =>
  `VC${Date.now().toString(36)}${crypto.randomBytes(3).toString('hex')}`.toUpperCase();

export class PaymentService {
  /**
   * Sắp xếp tham số theo key tăng dần và URL-encode value (đổi %20 thành +) —
   * đúng cách VNPay dựng chuỗi ký để chữ ký khớp hai đầu.
   */
  private sortParams = (params: VnpayParams): VnpayParams => {
    const sorted: VnpayParams = {};
    for (const key of Object.keys(params).sort()) {
      sorted[key] = encodeURIComponent(params[key]).replace(/%20/g, '+');
    }
    return sorted;
  };

  // Chuỗi key=value&... từ object ĐÃ sort + encode (không encode lại) — dùng để ký và để dựng URL
  private toQueryString = (sorted: VnpayParams): string =>
    Object.keys(sorted)
      .map((key) => `${key}=${sorted[key]}`)
      .join('&');

  private hmacSha512 = (data: string): string =>
    crypto.createHmac('sha512', config.vnpay.hashSecret).update(Buffer.from(data, 'utf-8')).digest('hex');

  private safeEqualHex = (a: string, b: string): boolean => {
    const bufA = Buffer.from(a.toLowerCase(), 'utf8');
    const bufB = Buffer.from(b.toLowerCase(), 'utf8');
    if (bufA.length !== bufB.length) {
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  };

  // Xác minh chữ ký vnp_SecureHash trên tham số VNPay gửi về
  private verifySignature = (params: VnpayParams): boolean => {
    const received = params.vnp_SecureHash;
    if (!received) {
      return false;
    }
    const clone: VnpayParams = { ...params };
    delete clone.vnp_SecureHash;
    delete clone.vnp_SecureHashType;
    const expected = this.hmacSha512(this.toQueryString(this.sortParams(clone)));
    return this.safeEqualHex(received, expected);
  };

  private assertConfigured = () => {
    if (!config.vnpay.tmnCode || !config.vnpay.hashSecret) {
      throw new ApiError(
        httpStatus.SERVICE_UNAVAILABLE,
        'VNPay chưa được cấu hình (đặt VNP_TMN_CODE và VNP_HASH_SECRET trong .env)'
      );
    }
  };

  /**
   * Tạo URL thanh toán VNPay cho một booking đang chờ thanh toán của chính người dùng.
   * Mỗi lần gọi sinh một mã giao dịch (vnp_TxnRef) mới + một bản ghi Payment pending
   * để callback tra cứu lại được.
   */
  createVnpayPaymentUrl = async (bookingId: string, currentUser: User, ipAddr: string): Promise<{ paymentUrl: string }> => {
    this.assertConfigured();

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy booking');
    }
    if (booking.customerId !== currentUser.id) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }
    if (booking.status !== 'pending') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Booking không ở trạng thái chờ thanh toán');
    }
    if (booking.holdExpiresAt && booking.holdExpiresAt < new Date()) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Booking đã quá hạn giữ chỗ, vui lòng đặt lại');
    }

    const txnRef = `${booking.bookingCode}-${Date.now().toString(36).toUpperCase()}`;
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        paymentMethod: 'vnpay',
        transactionId: txnRef,
        amount: booking.totalAmount,
        currency: 'VND',
        status: 'pending',
      },
    });

    const params: VnpayParams = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: config.vnpay.tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: `Thanh toan booking ${booking.bookingCode}`,
      vnp_OrderType: 'other',
      // VNPay tính tiền theo đơn vị nhỏ nhất ⇒ nhân 100
      vnp_Amount: String(Math.round(booking.totalAmount.toNumber() * 100)),
      vnp_ReturnUrl: config.vnpay.returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: formatVnpDate(new Date()),
    };

    const sorted = this.sortParams(params);
    sorted.vnp_SecureHash = this.hmacSha512(this.toQueryString(sorted));
    return { paymentUrl: `${config.vnpay.url}?${this.toQueryString(sorted)}` };
  };

  /**
   * Xử lý callback VNPay (dùng chung cho returnUrl và IPN).
   * - Xác minh chữ ký + số tiền.
   * - Idempotent: gọi lại trên giao dịch đã completed thì coi như thành công, không xử lý lại.
   * - Thành công ⇒ confirm booking + ghi hoa hồng + phát voucher trong một transaction.
   * rspCode dùng cho IPN (00 ok, 01 không thấy, 02 đã xử lý, 04 sai tiền, 97 sai chữ ký).
   */
  handleVnpayCallback = async (params: VnpayParams): Promise<VnpayResult> => {
    this.assertConfigured();

    if (!this.verifySignature(params)) {
      return { success: false, message: 'Chữ ký không hợp lệ', rspCode: '97' };
    }

    const payment = await prisma.payment.findUnique({
      where: { transactionId: params.vnp_TxnRef },
      include: { booking: { select: { id: true, bookingCode: true } } },
    });
    if (!payment) {
      return { success: false, message: 'Không tìm thấy giao dịch', rspCode: '01' };
    }

    if (payment.status === 'completed') {
      return { success: true, bookingCode: payment.booking.bookingCode, message: 'Giao dịch đã được xử lý', rspCode: '02' };
    }

    const expectedAmount = Math.round(payment.amount.toNumber() * 100);
    if (Number(params.vnp_Amount) !== expectedAmount) {
      return { success: false, bookingCode: payment.booking.bookingCode, message: 'Số tiền không khớp', rspCode: '04' };
    }

    const paidOk = params.vnp_ResponseCode === '00' && params.vnp_TransactionStatus === '00';
    if (!paidOk) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'failed', gatewayResponse: params as Prisma.InputJsonObject },
      });
      return {
        success: false,
        bookingCode: payment.booking.bookingCode,
        message: `Thanh toán thất bại (mã ${params.vnp_ResponseCode})`,
        rspCode: '00',
      };
    }

    const confirmed = await this.confirmPaidBooking(payment.id, payment.booking.id, params);
    if (confirmed.emailTo) {
      this.sendConfirmationEmailSafe(confirmed);
    }

    return {
      success: true,
      bookingCode: payment.booking.bookingCode,
      message: confirmed.confirmed ? 'Thanh toán thành công' : 'Đã ghi nhận thanh toán',
      rspCode: '00',
    };
  };

  /**
   * Một transaction: payment→completed, booking pending→confirmed (có điều kiện để chống
   * xử lý hai lần), ghi PlatformCommission và phát BookingVoucher. Nếu booking không còn
   * pending (đã huỷ/hết hạn) thì vẫn đánh dấu payment completed nhưng KHÔNG tạo voucher —
   * tiền đã nhận, cần hoàn thủ công (trả về confirmed=false để lớp trên cảnh báo).
   */
  private confirmPaidBooking = async (
    paymentId: string,
    bookingId: string,
    // Payload thô của cổng (VNPay hoặc SePay) — lưu nguyên vào gateway_response để đối soát sau
    gatewayPayload: Prisma.InputJsonObject
  ) => {
    return prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: paymentId },
        data: { status: 'completed', paidAt: new Date(), gatewayResponse: gatewayPayload },
      });

      const updated = await tx.booking.updateMany({
        where: { id: bookingId, status: 'pending' },
        data: { status: 'confirmed', holdExpiresAt: null },
      });
      if (updated.count === 0) {
        logger.warn(
          `[VNPay] Đã nhận tiền cho booking ${bookingId} nhưng booking không còn pending — cần hoàn tiền thủ công`
        );
        return { confirmed: false as const, emailTo: null };
      }

      const booking = await tx.booking.findUniqueOrThrow({
        where: { id: bookingId },
        include: {
          hotel: { select: { name: true, partnerId: true, partner: { select: { commissionRate: true } } } },
          roomType: { select: { name: true } },
          customer: { select: { email: true, fullName: true } },
        },
      });

      const rate = booking.hotel.partner.commissionRate;
      const commissionAmount = booking.totalAmount.mul(rate).div(100).toDecimalPlaces(2);
      await tx.platformCommission.create({
        data: {
          bookingId: booking.id,
          partnerId: booking.hotel.partnerId,
          paymentId,
          commissionRate: rate,
          commissionAmount,
          status: 'pending',
        },
      });
      const net = booking.totalAmount.sub(commissionAmount);
      await walletService.recordEarning(tx, booking.hotelId, booking.id, net);
      const voucherCode = generateVoucherCode();
      await tx.bookingVoucher.create({
        data: {
          bookingId: booking.id,
          voucherCode,
          // qrData là payload để frontend render thành mã QR e-voucher (M10)
          qrData: `SMARTSTAY|${voucherCode}|${booking.bookingCode}`,
          expiresAt: booking.checkOutDate,
        },
      });

      return {
        confirmed: true as const,
        emailTo: booking.customer.email,
        customerName: booking.customer.fullName,
        bookingCode: booking.bookingCode,
        hotelName: booking.hotel.name,
        roomTypeName: booking.roomType.name,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        totalAmount: booking.totalAmount.toNumber(),
        voucherCode,
      };
    });
  };

  // Gửi email xác nhận booking — best-effort, lỗi email không được làm hỏng kết quả thanh toán
  private sendConfirmationEmailSafe = (data: {
    emailTo: string | null;
    customerName?: string;
    bookingCode?: string;
    hotelName?: string;
    roomTypeName?: string;
    checkInDate?: Date;
    checkOutDate?: Date;
    totalAmount?: number;
    voucherCode?: string;
  }) => {
    if (!data.emailTo) {
      return;
    }
    emailService
      .sendBookingConfirmationEmail(data.emailTo, {
        customerName: data.customerName ?? '',
        bookingCode: data.bookingCode ?? '',
        hotelName: data.hotelName ?? '',
        roomTypeName: data.roomTypeName ?? '',
        checkInDate: data.checkInDate ?? new Date(),
        checkOutDate: data.checkOutDate ?? new Date(),
        totalAmount: data.totalAmount ?? 0,
        voucherCode: data.voucherCode ?? '',
      })
      .catch((err) => logger.error(`[VNPay] Gửi email xác nhận booking thất bại: ${err.message}`));
  };

  // ===== SePay: QR chuyển khoản + webhook đối soát =====

  private assertSepayConfigured = () => {
    if (!config.sepay.webhookApiKey || !config.sepay.accountNumber || !config.sepay.bankCode) {
      throw new ApiError(
        httpStatus.SERVICE_UNAVAILABLE,
        'SePay chưa được cấu hình (đặt SEPAY_WEBHOOK_API_KEY, SEPAY_ACCOUNT_NUMBER, SEPAY_BANK_CODE trong .env)'
      );
    }
  };

  /**
   * Tạo thông tin thanh toán SePay cho booking đang chờ thanh toán của CHÍNH khách.
   * Khác VNPay: không có cổng để redirect — trả ảnh QR + nội dung chuyển khoản để khách quét
   * bằng app ngân hàng. Tiền vào tài khoản ⇒ SePay gọi webhook, lúc đó booking mới được confirm.
   * Một booking chỉ có ĐÚNG MỘT khoản SePay (transactionId cố định theo bookingCode) nên gọi lại
   * nhiều lần vẫn ra cùng một nội dung đối soát — tránh việc mỗi lần bấm lại sinh một mã khác.
   */
  createSepayPayment = async (bookingId: string, currentUser: User): Promise<SepayPaymentInfo> => {
    this.assertSepayConfigured();

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy booking');
    }
    if (booking.customerId !== currentUser.id) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }
    if (booking.status !== 'pending') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Booking không ở trạng thái chờ thanh toán');
    }
    if (booking.holdExpiresAt && booking.holdExpiresAt < new Date()) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Booking đã quá hạn giữ chỗ, vui lòng đặt lại');
    }

    const existing = await prisma.payment.findFirst({
      where: { bookingId: booking.id, paymentMethod: 'sepay' },
    });
    if (!existing) {
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          paymentMethod: 'sepay',
          transactionId: `SEPAY-${booking.bookingCode}`,
          amount: booking.totalAmount,
          currency: 'VND',
          status: 'pending',
        },
      });
    }

    // Nội dung chuyển khoản = mã booking: ngắn, chỉ chữ+số nên ngân hàng không cắt/bỏ dấu.
    const transferContent = booking.bookingCode;
    const amount = Math.round(booking.totalAmount.toNumber());
    const query = new URLSearchParams({
      acc: config.sepay.accountNumber,
      bank: config.sepay.bankCode,
      amount: String(amount),
      des: transferContent,
    });

    return {
      qrUrl: `${SEPAY_QR_ENDPOINT}?${query.toString()}`,
      transferContent,
      amount,
      accountNumber: config.sepay.accountNumber,
      bankCode: config.sepay.bankCode,
      expiresAt: booking.holdExpiresAt,
    };
  };

  /** Xác thực header "Authorization: Apikey <key>" của SePay, so sánh timing-safe. */
  verifySepayApiKey = (apiKey: string | null): boolean => {
    if (!config.sepay.webhookApiKey || !apiKey) {
      return false;
    }
    const received = Buffer.from(apiKey, 'utf8');
    const expected = Buffer.from(config.sepay.webhookApiKey, 'utf8');
    if (received.length !== expected.length) {
      return false;
    }
    return crypto.timingSafeEqual(received, expected);
  };

  /**
   * Xử lý webhook SePay báo có tiền vào tài khoản.
   *
   * Quy ước trả về: LUÔN trả success=true cho các tình huống "nghiệp vụ không khớp"
   * (không bóc được mã, không thấy booking, chuyển thiếu) — vì SePay sẽ retry tới 7 lần trong 5 giờ
   * mà retry KHÔNG làm tình huống đó khá hơn, chỉ tổ spam. Những ca đó ghi log ERROR để đối soát tay.
   * Lỗi hệ thống thật (DB chết) thì cứ để ném ra ⇒ 500 ⇒ SePay retry là đúng.
   */
  handleSepayWebhook = async (payload: SepayWebhookPayload): Promise<{ success: boolean; message: string }> => {
    if (payload.transferType !== 'in') {
      return { success: true, message: 'Bỏ qua giao dịch tiền ra' };
    }

    // SePay tự bóc `code` nếu cấu hình mẫu ở dashboard; không có thì tự bóc từ nội dung thô.
    const matched = (payload.code || payload.content || '').match(BOOKING_CODE_PATTERN);
    if (!matched) {
      logger.error(
        `[SePay] Nhận ${payload.transferAmount}đ nhưng KHÔNG bóc được mã booking từ nội dung "${payload.content}" ` +
          `(ref ${payload.referenceCode ?? '-'}) — CẦN ĐỐI SOÁT THỦ CÔNG`
      );
      return { success: true, message: 'Không tìm thấy mã booking trong nội dung chuyển khoản' };
    }
    const bookingCode = matched[0].toUpperCase();

    const payment = await prisma.payment.findFirst({
      where: { paymentMethod: 'sepay', booking: { bookingCode } },
    });
    if (!payment) {
      logger.error(
        `[SePay] Nhận ${payload.transferAmount}đ cho booking ${bookingCode} nhưng không có khoản SePay nào — CẦN ĐỐI SOÁT THỦ CÔNG`
      );
      return { success: true, message: 'Không tìm thấy khoản thanh toán SePay của booking' };
    }

    // Idempotent: SePay retry nhiều lần ⇒ đã completed thì báo thành công, không xử lý lại.
    if (payment.status === 'completed') {
      return { success: true, message: 'Giao dịch đã được xử lý' };
    }

    const expectedAmount = Math.round(payment.amount.toNumber());
    if (payload.transferAmount < expectedAmount) {
      logger.error(
        `[SePay] Booking ${bookingCode} chuyển THIẾU: nhận ${payload.transferAmount}đ / cần ${expectedAmount}đ — CẦN ĐỐI SOÁT THỦ CÔNG`
      );
      return { success: true, message: 'Số tiền chuyển chưa đủ' };
    }
    if (payload.transferAmount > expectedAmount) {
      logger.warn(
        `[SePay] Booking ${bookingCode} chuyển THỪA ${payload.transferAmount - expectedAmount}đ — vẫn xác nhận, phần thừa cần hoàn thủ công`
      );
    }

    const confirmed = await this.confirmPaidBooking(payment.id, payment.bookingId, payload);
    if (confirmed.emailTo) {
      this.sendConfirmationEmailSafe(confirmed);
    }
    return {
      success: true,
      message: confirmed.confirmed ? 'Thanh toán thành công' : 'Đã ghi nhận thanh toán',
    };
  };

  /**
   * Thực thi hoàn tiền ở cổng thanh toán. HIỆN MÔ PHỎNG — trả về mã giao dịch hoàn giả lập, KHÔNG
   * gọi cổng thật (sandbox VNPay không hỗ trợ test refund). Đây là ĐIỂM DUY NHẤT cần thay khi muốn
   * hoàn tiền thật:
   *   - VNPay  ⇒ gọi Merchant Refund API (vnp_Command=refund) bằng VNP_API_URL đã cấu hình.
   *   - SePay  ⇒ chuyển khoản ra cho khách qua API ngân hàng (tiền nằm sẵn ở TK của bạn).
   * Giữ chữ ký async để khi cắm cổng thật (gọi mạng) không phải đổi nơi gọi ở booking.service.
   */
  executeGatewayRefund = async (
    payment: Payment,
    amount: Prisma.Decimal
  ): Promise<{ refundTransactionId: string; success: boolean }> => {
    logger.info(`[Refund] (mô phỏng) hoàn ${amount.toString()} cho giao dịch ${payment.transactionId}`);
    return { refundTransactionId: `SIMREFUND-${Date.now().toString(36).toUpperCase()}`, success: true };
  };
}

export const paymentService = new PaymentService();
