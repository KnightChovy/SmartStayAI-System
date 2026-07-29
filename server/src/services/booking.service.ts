import httpStatus from 'http-status';
import { randomBytes } from 'crypto';
import { Prisma } from '@prisma/client';
import type { User, BookingStatus, RefundStatus } from '@prisma/client';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';
import { roleRights } from '../config/roles';
import { toUtcDate, eachNightOfStay } from '../utils/dates';
import { availabilityService } from './availability.service';
import { hotelService, readCancellationPolicy } from './hotel.service';
import type { CancellationPolicy } from './hotel.service';
import type {
  CreateBookingDto,
  BookingFilter,
  BookingQueryOptions,
  HotelBookingFilter,
  PlatformBookingFilter,
  PartnerBookingFilter,
  CheckInBookingDto,
  CheckOutBookingDto,
  CancelBookingDto,
} from '../dto/booking.dto';
import { walletService } from './wallet.service';
import { encrypt } from '../utils/encryption';

// Đặt tối đa bao nhiêu đêm cho một booking (chặn khoảng ngày vô lý)
const MAX_NIGHTS = 30;

// Booking pending phải thanh toán trong khoảng này, quá hạn thì tự nhả tồn kho
export const HOLD_MINUTES = 15;

// SePay là chuyển khoản ngân hàng: khách phải mở app, quét QR, nhập OTP... nên chậm hơn quẹt thẻ
// qua cổng. Cho hạn giữ chỗ rộng hơn để tránh nhả phòng ngay lúc khách đang chuyển tiền.
export const SEPAY_HOLD_MINUTES = 30;

// Quan hệ kèm theo khi trả booking về client
const bookingInclude = {
  hotel: { select: { id: true, name: true, address: true, city: true, checkInTime: true, checkOutTime: true } },
  roomType: { select: { id: true, name: true, bedType: true, viewType: true, maxOccupancy: true } },
  voucher: { select: { voucherCode: true, qrData: true, usedAt: true } },
  // Kèm thanh toán + yêu cầu hoàn tiền để khách TỰ THEO DÕI được sau khi huỷ:
  // huỷ xong tiền không tự về ngay mà phải qua KS duyệt → PM chuyển khoản, nên khách cần thấy
  // đang ở bước nào và vì sao bị từ chối. KHÔNG lộ gatewayResponse/transactionId (dữ liệu cổng).
  payments: {
    select: {
      id: true,
      paymentMethod: true,
      status: true,
      amount: true,
      paidAt: true,
      refunds: {
        select: {
          id: true,
          amount: true,
          status: true,
          reason: true,
          rejectionReason: true,
          reviewedAt: true,
          processedAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  },
} satisfies Prisma.BookingInclude;

// Quan hệ kèm theo cho màn vận hành của staff/chủ KS (kèm khách, phòng đã gán, voucher)
const staffBookingInclude = {
  customer: { select: { id: true, fullName: true, email: true, phone: true } },
  roomType: { select: { id: true, name: true } },
  bookingRooms: { include: { room: { select: { id: true, roomNumber: true, floor: true } } } },
  voucher: { select: { voucherCode: true, usedAt: true } },
} satisfies Prisma.BookingInclude;

// Quan hệ kèm theo cho màn GIÁM SÁT (PM toàn sàn / partner theo đối tác): kèm khách + khách sạn + loại phòng
const oversightBookingInclude = {
  customer: { select: { id: true, fullName: true, email: true, phone: true } },
  hotel: { select: { id: true, name: true, city: true } },
  roomType: { select: { id: true, name: true } },
} satisfies Prisma.BookingInclude;

// Mã booking dễ đọc cho khách; cột booking_code có unique constraint chặn trùng
const generateBookingCode = (): string => `BK${Date.now().toString(36)}${randomBytes(3).toString('hex')}`.toUpperCase();

// Số hoá đơn duy nhất phát hành khi check-out; cột invoice_number có unique constraint
const generateInvoiceNumber = (): string => `INV${Date.now().toString(36)}${randomBytes(2).toString('hex')}`.toUpperCase();

// Mã e-voucher duy nhất; cột voucher_code có unique constraint
const generateVoucherCode = (): string => `VC${Date.now().toString(36)}${randomBytes(3).toString('hex')}`.toUpperCase();

// Thời điểm nhận phòng thực tế = ngày nhận phòng + giờ nhận phòng của KS (mặc định 14:00)
// để tính "còn bao nhiêu giờ tới giờ nhận phòng" cho chính xác thay vì lấy nửa đêm.
const checkInMomentOf = (checkInDate: Date, checkInTime: string | null): Date => {
  const [h, m] = (checkInTime ?? '14:00').split(':').map((part) => Number(part) || 0);
  const moment = new Date(checkInDate);
  moment.setUTCHours(h, m, 0, 0);
  return moment;
};

/** Số tiền hoàn theo chính sách: huỷ sớm ⇒ 100%; huỷ muộn ⇒ trừ phí phạt (1 đêm hoặc toàn bộ). */
const computeRefundAmount = (
  policy: CancellationPolicy,
  hoursBeforeCheckIn: number,
  totalPaid: Prisma.Decimal,
  firstNightPrice: Prisma.Decimal
): Prisma.Decimal => {
  if (hoursBeforeCheckIn >= policy.freeUntilHours) {
    return totalPaid;
  }
  const penalty = policy.latePenalty === 'full' ? totalPaid : firstNightPrice;
  const refund = totalPaid.sub(penalty);
  return refund.isNegative() ? new Prisma.Decimal(0) : refund;
};

export class BookingService {
  /**
   * Tạo booking. Toàn bộ chạy trong một transaction:
   * mỗi đêm upsert dòng tồn kho rồi tăng bookedRooms CÓ ĐIỀU KIỆN (bookedRooms < totalRooms)
   * — hai khách đặt phòng cuối cùng cùng lúc thì chỉ một người thành công, không bị overbooking.
   */
  /**
   * Nhả tồn kho cho các booking pending đã quá hạn giữ chỗ (chưa thanh toán).
   * Gọi lười trước mỗi lần đặt mới + nên được cron gọi định kỳ. Mỗi booking xử lý
   * có điều kiện (status pending) để không trả tồn kho hai lần nếu chạy song song.
   * @returns số booking đã nhả
   */
  releaseExpiredHolds = async (): Promise<number> => {
    const now = new Date();
    const expired = await prisma.booking.findMany({
      where: { status: 'pending', holdExpiresAt: { lt: now } },
      select: { id: true, roomTypeId: true, checkInDate: true, checkOutDate: true },
    });

    let released = 0;
    for (const booking of expired) {
      const nights = eachNightOfStay(booking.checkInDate, booking.checkOutDate);
      // eslint-disable-next-line no-await-in-loop
      const done = await prisma.$transaction(async (tx) => {
        const cancelled = await tx.booking.updateMany({
          where: { id: booking.id, status: 'pending', holdExpiresAt: { lt: now } },
          data: { status: 'cancelled', cancelledAt: now, cancellationReason: 'Quá hạn thanh toán' },
        });
        if (cancelled.count === 0) {
          return false;
        }
        await tx.roomAvailability.updateMany({
          where: { roomTypeId: booking.roomTypeId, date: { in: nights }, bookedRooms: { gt: 0 } },
          data: { bookedRooms: { decrement: 1 } },
        });
        return true;
      });
      if (done) {
        released += 1;
      }
    }
    return released;
  };

  createBooking = async (customerId: string, payload: CreateBookingDto) => {
    // Khách sạn phải liên lạc được với khách (đổi phòng, tới muộn, sự cố) nên booking BẮT BUỘC có
    // số điện thoại. Không nhận số qua payload mà lấy từ hồ sơ tài khoản (User.phone) — một nguồn
    // duy nhất, khỏi lệch giữa các đơn. Hồ sơ chưa có số ⇒ chặn ở đây để FE nhắc khách cập nhật.
    // Đặt trước mọi thao tác khác, và đặt trong service (không phải controller) để LUỒNG NÀO cũng
    // bị chặn — kể cả đặt phòng qua chatbot AI.
    const customer = await prisma.user.findUnique({ where: { id: customerId }, select: { phone: true } });
    if (!customer?.phone?.trim()) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Vui lòng cập nhật số điện thoại trong hồ sơ trước khi đặt phòng'
      );
    }

    // Dọn các giữ chỗ hết hạn trước để chúng không chiếm mất tồn kho của lượt đặt này
    await this.releaseExpiredHolds();

    // 'cash' = trả tiền mặt tại KS ⇒ xác nhận giữ phòng ngay, không hết hạn 15'.
    // 'vnpay' (mặc định) = giữ chỗ pending 15' chờ thanh toán online.
    const method = payload.paymentMethod ?? 'vnpay';

    const checkIn = toUtcDate(payload.checkInDate);
    const checkOut = toUtcDate(payload.checkOutDate);
    const today = toUtcDate(new Date());
    if (checkIn < today) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Ngày nhận phòng không được ở quá khứ');
    }
    const nights = eachNightOfStay(checkIn, checkOut);
    if (nights.length === 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Ngày trả phòng phải sau ngày nhận phòng');
    }
    if (nights.length > MAX_NIGHTS) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Chỉ đặt được tối đa ${MAX_NIGHTS} đêm`);
    }

    const roomType = await prisma.roomType.findFirst({
      where: {
        id: payload.roomTypeId,
        hotelId: payload.hotelId,
        isActive: true,
        hotel: { isActive: true, isListed: true, deletedAt: null },
      },
    });
    if (!roomType) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy loại phòng trong khách sạn này');
    }
    // Số khách: nhận cách mới (numAdults/numChildren) hoặc cũ (numGuests). Chỉ có numGuests ⇒ coi tất
    // cả là người lớn (tương thích ngược). Tiền vẫn tính theo TỔNG khách, không phân biệt trẻ em.
    const numAdults = payload.numAdults ?? payload.numGuests ?? 1;
    const numChildren = payload.numChildren ?? 0;
    const numGuests = numAdults + numChildren;
    if (numGuests > roomType.maxOccupancy) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Loại phòng này chỉ chứa tối đa ${roomType.maxOccupancy} khách`);
    }
    // maxAdults/maxChildren tuỳ chọn: chỉ chặn khi khách sạn có khai để tránh chặn oan loại phòng cũ chưa cấu hình
    if (roomType.maxAdults !== null && numAdults > roomType.maxAdults) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Loại phòng này chỉ chứa tối đa ${roomType.maxAdults} người lớn`);
    }
    if (roomType.maxChildren !== null && numChildren > roomType.maxChildren) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Loại phòng này chỉ chứa tối đa ${roomType.maxChildren} trẻ em`);
    }

    // Giá từng đêm áp pricing rule giống hệt lúc search (xem availability.service.priceForNight)
    const pricingRules = await availabilityService.getActivePricingRules([roomType.hotelId]);
    const priceInput = { id: roomType.id, hotelId: roomType.hotelId, basePrice: roomType.basePrice };

    // Khoản thu thuế/phí ĐANG hiệu lực — đọc một lần ở đây rồi đóng băng vào booking bên dưới
    const taxFeeCharges = (await availabilityService.getTaxFeeCharges([roomType.hotelId])).get(roomType.hotelId) ?? [];

    return prisma.$transaction(async (tx) => {
      const physicalRooms = await tx.room.count({ where: { roomTypeId: roomType.id } });
      if (physicalRooms === 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Loại phòng này chưa mở bán');
      }

      let subtotal = new Prisma.Decimal(0);
      for (const night of nights) {
        // Đêm chưa có dòng tồn kho ⇒ tạo với totalRooms = số phòng vật lý (upsert là atomic nhờ unique constraint)
        const row = await tx.roomAvailability.upsert({
          where: { roomTypeId_date: { roomTypeId: roomType.id, date: night } },
          create: { roomTypeId: roomType.id, hotelId: roomType.hotelId, date: night, totalRooms: physicalRooms },
          update: {},
        });

        // Giữ phòng có điều kiện: WHERE bookedRooms < totalRooms được Postgres kiểm tra lại
        // sau khi lock dòng, nên booking song song không thể vượt quá tồn kho
        const reserved = await tx.roomAvailability.updateMany({
          where: { id: row.id, bookedRooms: { lt: row.totalRooms } },
          data: { bookedRooms: { increment: 1 } },
        });
        if (reserved.count === 0) {
          throw new ApiError(httpStatus.BAD_REQUEST, `Đã hết phòng đêm ${night.toISOString().slice(0, 10)}`);
        }

        subtotal = subtotal.add(availabilityService.priceForNight(priceInput, night, row, pricingRules, today));
      }

      const { taxAmount, feeAmount } = availabilityService.computeTaxAndFees(
        taxFeeCharges,
        subtotal,
        nights.length,
        numGuests
      );

      const isCash = method === 'cash';
      const holdMinutes = method === 'sepay' ? SEPAY_HOLD_MINUTES : HOLD_MINUTES;
      const booking = await tx.booking.create({
        data: {
          bookingCode: generateBookingCode(),
          customerId,
          hotelId: roomType.hotelId,
          roomTypeId: roomType.id,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          numNights: nights.length,
          numGuests,
          numAdults,
          numChildren,
          basePricePerNight: roomType.basePrice,
          subtotal,
          discountAmount: 0,
          taxAmount,
          feeAmount,
          totalAmount: subtotal.add(taxAmount).add(feeAmount),
          // Tiền mặt: xác nhận luôn, không hạn giữ chỗ.
          // VNPay/SePay: pending + hạn giữ chỗ chờ khách trả online (SePay rộng hơn vì chuyển khoản chậm hơn).
          status: isCash ? 'confirmed' : 'pending',
          source: 'website',
          specialRequests: payload.specialRequests || null,
          holdExpiresAt: isCash ? null : new Date(Date.now() + holdMinutes * 60 * 1000),
        },
        include: bookingInclude,
      });

      if (isCash) {
        // Ghi khoản tiền mặt CHƯA thu (pending) — staff sẽ ghi nhận đã thu khi khách tới.
        // Hoa hồng KHÔNG tạo ở đây mà tạo lúc thu tiền (xem recordCashPayment).
        await tx.payment.create({
          data: {
            bookingId: booking.id,
            paymentMethod: 'cash',
            transactionId: `CASH-${booking.bookingCode}`,
            amount: booking.totalAmount,
            currency: 'VND',
            status: 'pending',
          },
        });
        // Phát voucher ngay để khách có mã check-in (booking đã confirmed dù chưa trả tiền)
        const voucherCode = generateVoucherCode();
        await tx.bookingVoucher.create({
          data: {
            bookingId: booking.id,
            voucherCode,
            qrData: `SMARTSTAY|${voucherCode}|${booking.bookingCode}`,
            expiresAt: booking.checkOutDate,
          },
        });
      }

      // Thông báo cho khách: đơn vừa được tạo. Nội dung bám đúng trạng thái thật —
      // tiền mặt thì đơn đã confirmed, VNPay/SePay còn pending nên KHÔNG được nói "đã xác nhận"
      // (khách sẽ tưởng xong việc rồi bỏ qua bước trả tiền, tới hạn giữ chỗ là mất phòng).
      await tx.notification.create({
        data: {
          userId: customerId,
          type: 'booking_confirmed',
          title: isCash ? 'Đặt phòng thành công' : 'Đã tạo đơn — vui lòng thanh toán',
          body: isCash
            ? `Đơn ${booking.bookingCode} tại ${booking.hotel.name} đã được xác nhận. Bạn thanh toán khi nhận phòng.`
            : `Đơn ${booking.bookingCode} tại ${booking.hotel.name} đang giữ chỗ trong ${holdMinutes} phút. Hoàn tất thanh toán để xác nhận.`,
          data: { bookingId: booking.id, bookingCode: booking.bookingCode },
          channel: 'in_app',
          status: 'sent',
          sentAt: new Date(),
        },
      });

      return booking;
    });
  };

  /**
   * Huỷ booking (chủ booking hoặc người có quyền manageBookings). Chỉ huỷ được khi đang
   * pending/confirmed và TRƯỚC ngày nhận phòng; tồn kho được trả lại NGAY (khách đã bỏ chỗ).
   *
   * Nếu booking đã thanh toán: tính tiền hoàn theo chính sách của KS rồi tạo YÊU CẦU hoàn tiền
   * (Refund status 'pending') để khách sạn duyệt — KHÔNG tự hoàn.
   * CỐ Ý không đụng tới payment/commission/ví ở đây: yêu cầu có thể bị từ chối, và nếu trừ ví
   * ngay lúc huỷ thì khách sạn bị trừ oan. Tiền chỉ thực sự rời đi ở bước refundService.processRefund.
   * An toàn vì booking đã huỷ không bao giờ checked_out ⇒ cron tất toán không nhả phần tiền này.
   */
  /**
   * Lấy booking + kiểm quyền + tính sẵn tiền hoàn theo chính sách của KS. Dùng chung cho huỷ thật
   * (cancelBooking) và xem trước (getRefundPreview) để số báo cho khách CHÍNH LÀ số sẽ được hoàn.
   */
  private loadBookingForCancel = async (bookingId: string, currentUser: User) => {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        hotel: { select: { settings: true, checkInTime: true } },
        payments: { where: { status: 'completed' }, take: 1 },
        commission: true,
      },
    });
    if (!booking) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy booking');
    }
    const isOwner = booking.customerId === currentUser.id;
    const canManage = (roleRights.get(currentUser.role) || []).includes('manageBookings');
    if (!isOwner && !canManage) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }

    const policy = readCancellationPolicy(booking.hotel.settings);
    const checkInMoment = checkInMomentOf(booking.checkInDate, booking.hotel.checkInTime);
    const hoursBeforeCheckIn = (checkInMoment.getTime() - Date.now()) / (1000 * 60 * 60);

    // Chỉ có tiền để hoàn khi booking đã thanh toán thật
    const paidPayment = booking.payments[0] ?? null;
    const refundAmount = paidPayment
      ? computeRefundAmount(policy, hoursBeforeCheckIn, paidPayment.amount, booking.basePricePerNight)
      : new Prisma.Decimal(0);

    return { booking, policy, checkInMoment, hoursBeforeCheckIn, paidPayment, refundAmount };
  };

  /**
   * Xem trước tiền hoàn TRƯỚC khi bấm huỷ — khách phải biết mình mất bao nhiêu rồi mới quyết định.
   * Chỉ đọc, không đổi gì. Dùng chung loadBookingForCancel với cancelBooking nên con số ở đây đúng
   * bằng con số sẽ hoàn (miễn là khách huỷ ngay; qua mốc miễn phí thì số sẽ khác, nên trả kèm
   * freeUntilMoment để FE đếm ngược).
   */
  getRefundPreview = async (bookingId: string, currentUser: User) => {
    const { booking, policy, checkInMoment, hoursBeforeCheckIn, paidPayment, refundAmount } =
      await this.loadBookingForCancel(bookingId, currentUser);

    const paidAmount = paidPayment?.amount ?? new Prisma.Decimal(0);
    const canCancel =
      toUtcDate(booking.checkInDate) > toUtcDate(new Date()) &&
      (booking.status === 'pending' || booking.status === 'confirmed');

    return {
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      status: booking.status,
      // Huỷ được không, và nếu không thì vì sao — để FE khỏi tự đoán luật
      canCancel,
      cannotCancelReason: canCancel
        ? null
        : toUtcDate(booking.checkInDate) <= toUtcDate(new Date())
          ? 'Chỉ được huỷ trước ngày nhận phòng'
          : 'Chỉ huỷ được booking đang chờ hoặc đã xác nhận',
      isPaid: paidPayment !== null,
      paidAmount,
      refundAmount,
      // Phần bị giữ lại nếu huỷ ngay bây giờ
      penaltyAmount: paidAmount.sub(refundAmount),
      // Chính sách đang áp + mốc thời gian, để FE giải thích "vì sao chỉ được hoàn ngần này"
      freeUntilHours: policy.freeUntilHours,
      latePenalty: policy.latePenalty,
      isFreeCancellation: hoursBeforeCheckIn >= policy.freeUntilHours,
      hoursBeforeCheckIn: Math.round(hoursBeforeCheckIn * 10) / 10,
      // Huỷ trước mốc này thì hoàn 100%
      freeUntilMoment: new Date(checkInMoment.getTime() - policy.freeUntilHours * 60 * 60 * 1000),
      checkInMoment,
    };
  };

  cancelBooking = async (bookingId: string, currentUser: User, payload: CancelBookingDto = {}) => {
    const { reason, bankAccount } = payload;
    const { booking, paidPayment, refundAmount } = await this.loadBookingForCancel(bookingId, currentUser);

    const today = toUtcDate(new Date());
    if (toUtcDate(booking.checkInDate) <= today) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Chỉ được huỷ trước ngày nhận phòng');
    }

    // Mặc định hoàn vào ví: khách nhận được ngay, không phải chờ ai chuyển khoản. Muốn tiền về
    // ngân hàng thì phải gửi kèm tài khoản — không có thì Platform Manager chẳng biết chuyển đi đâu.
    const refundMethod = payload.refundMethod ?? 'wallet';
    if (refundMethod === 'bank' && !bankAccount) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Chọn hoàn về ngân hàng thì phải cung cấp tài khoản nhận tiền');
    }

    const nights = eachNightOfStay(booking.checkInDate, booking.checkOutDate);
    return prisma.$transaction(async (tx) => {
      // Đổi trạng thái có điều kiện TRƯỚC: hai request huỷ song song thì chỉ một bên
      // đi tiếp, tồn kho không bị trả lại hai lần
      const cancelled = await tx.booking.updateMany({
        where: { id: bookingId, status: { in: ['pending', 'confirmed'] } },
        data: { status: 'cancelled', cancelledAt: new Date(), cancellationReason: reason || null },
      });
      if (cancelled.count === 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Chỉ huỷ được booking đang chờ hoặc đã xác nhận');
      }

      await tx.roomAvailability.updateMany({
        where: { roomTypeId: booking.roomTypeId, date: { in: nights }, bookedRooms: { gt: 0 } },
        data: { bookedRooms: { decrement: 1 } },
      });

      // Chỉ tạo yêu cầu hoàn khi THỰC SỰ có tiền để hoàn. Huỷ muộn bị phạt hết (0đ) thì không có gì
      // để khách sạn duyệt — vết đối soát đã nằm ở cancelledAt/cancellationReason của booking.
      let refund: { id: string; amount: Prisma.Decimal; status: RefundStatus } | null = null;
      if (paidPayment && refundAmount.greaterThan(0)) {
        refund = await tx.refund.create({
          data: {
            paymentId: paidPayment.id,
            requestedBy: currentUser.id,
            amount: refundAmount,
            reason: reason || 'Khách huỷ booking',
            status: 'pending',
            refundMethod,
            // Số tài khoản MÃ HOÁ như HotelPayoutAccount — chỉ giải mã cho người đi chuyển tiền
            ...(refundMethod === 'bank' && {
              bankAccountNumber: encrypt(bankAccount!.accountNumber),
              bankName: bankAccount!.bankName,
              bankAccountHolder: bankAccount!.accountHolder,
            }),
          },
          select: { id: true, amount: true, status: true, refundMethod: true },
        });
      }

      const result = await tx.booking.findUniqueOrThrow({ where: { id: bookingId }, include: bookingInclude });
      return { ...result, refund };
    });
  };

  /** Liệt kê booking của user đang đăng nhập, lọc theo trạng thái + phân trang. */
  getMyBookings = async (customerId: string, filter: BookingFilter, options: BookingQueryOptions) => {
    const limit = options.limit || 10;
    const page = options.page || 1;
    const skip = (page - 1) * limit;

    const where: Prisma.BookingWhereInput = { customerId };
    if (filter.status) {
      where.status = filter.status;
    }

    let orderBy: Prisma.BookingOrderByWithRelationInput = { createdAt: 'desc' };
    if (options.sortBy) {
      const [field, direction] = options.sortBy.split(':');
      orderBy = { [field]: direction === 'desc' ? 'desc' : 'asc' };
    }

    const [results, totalResults] = await prisma.$transaction([
      prisma.booking.findMany({ where, skip, take: limit, orderBy, include: bookingInclude }),
      prisma.booking.count({ where }),
    ]);

    return { results, page, limit, totalPages: Math.ceil(totalResults / limit), totalResults };
  };

  // Truy vấn phân trang dùng chung cho các màn GIÁM SÁT booking (PM toàn sàn / partner theo đối tác)
  private queryOversightBookings = async (where: Prisma.BookingWhereInput, options: BookingQueryOptions) => {
    const limit = options.limit || 20;
    const page = options.page || 1;
    const skip = (page - 1) * limit;

    let orderBy: Prisma.BookingOrderByWithRelationInput = { createdAt: 'desc' };
    if (options.sortBy) {
      const [field, direction] = options.sortBy.split(':');
      orderBy = { [field]: direction === 'desc' ? 'desc' : 'asc' };
    }

    const [results, totalResults] = await prisma.$transaction([
      prisma.booking.findMany({ where, skip, take: limit, orderBy, include: oversightBookingInclude }),
      prisma.booking.count({ where }),
    ]);
    return { results, page, limit, totalPages: Math.ceil(totalResults / limit), totalResults };
  };

  // Ghép điều kiện lọc chung cho màn giám sát (trạng thái / ngày nhận phòng / tìm kiếm)
  private applyOversightFilters = (
    where: Prisma.BookingWhereInput,
    filter: { status?: BookingStatus; fromDate?: Date; toDate?: Date; search?: string }
  ) => {
    if (filter.status) where.status = filter.status;
    if (filter.fromDate || filter.toDate) {
      where.checkInDate = {
        ...(filter.fromDate && { gte: toUtcDate(filter.fromDate) }),
        ...(filter.toDate && { lte: toUtcDate(filter.toDate) }),
      };
    }
    if (filter.search) {
      where.OR = [
        { bookingCode: { contains: filter.search, mode: 'insensitive' } },
        { customer: { fullName: { contains: filter.search, mode: 'insensitive' } } },
        { customer: { email: { contains: filter.search, mode: 'insensitive' } } },
      ];
    }
    return where;
  };

  /**
   * [Platform Manager] Liệt kê TOÀN BỘ booking toàn sàn — lọc theo trạng thái / khách sạn / đối tác /
   * khoảng ngày nhận phòng + tìm theo mã booking hoặc tên/email khách. Kèm khách + khách sạn + loại phòng.
   */
  listPlatformBookings = async (filter: PlatformBookingFilter, options: BookingQueryOptions) => {
    const where: Prisma.BookingWhereInput = {};
    if (filter.hotelId) where.hotelId = filter.hotelId;
    if (filter.partnerId) where.hotel = { partnerId: filter.partnerId };
    this.applyOversightFilters(where, filter);
    return this.queryOversightBookings(where, options);
  };

  /**
   * [Partner] Liệt kê booking của MỌI khách sạn của partner đang đăng nhập (suy partnerId từ token),
   * tuỳ chọn thu hẹp theo 1 khách sạn. Cùng bộ lọc & shape với bản giám sát của PM.
   */
  listPartnerBookings = async (userId: string, filter: PartnerBookingFilter, options: BookingQueryOptions) => {
    const where: Prisma.BookingWhereInput = { hotel: { partner: { ownerId: userId } } };
    if (filter.hotelId) where.hotelId = filter.hotelId;
    this.applyOversightFilters(where, filter);
    return this.queryOversightBookings(where, options);
  };

  /** Chi tiết một booking (chủ booking hoặc người có quyền manageBookings). */
  getBookingById = async (bookingId: string, currentUser: User) => {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: bookingInclude,
    });
    if (!booking) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy booking');
    }
    const isOwner = booking.customerId === currentUser.id;
    const canManage = (roleRights.get(currentUser.role) || []).includes('manageBookings');
    if (!isOwner && !canManage) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }
    return booking;
  };

  /**
   * [M12] Staff/chủ KS xem booking của một khách sạn, lọc theo trạng thái + khoảng ngày nhận phòng.
   * Quyền: chủ KS, manager, hoặc nhân viên được phân công (getOperableHotel).
   */
  listHotelBookings = async (
    hotelId: string,
    currentUser: User,
    filter: HotelBookingFilter,
    options: BookingQueryOptions
  ) => {
    await hotelService.getOperableHotel(hotelId, currentUser);
    const limit = options.limit || 20;
    const page = options.page || 1;
    const skip = (page - 1) * limit;

    const where: Prisma.BookingWhereInput = { hotelId };
    if (filter.status) {
      where.status = filter.status;
    }
    if (filter.fromDate || filter.toDate) {
      where.checkInDate = {
        ...(filter.fromDate && { gte: toUtcDate(filter.fromDate) }),
        ...(filter.toDate && { lte: toUtcDate(filter.toDate) }),
      };
    }

    let orderBy: Prisma.BookingOrderByWithRelationInput = { checkInDate: 'asc' };
    if (options.sortBy) {
      const [field, direction] = options.sortBy.split(':');
      orderBy = { [field]: direction === 'desc' ? 'desc' : 'asc' };
    }

    const [results, totalResults] = await prisma.$transaction([
      prisma.booking.findMany({ where, skip, take: limit, orderBy, include: staffBookingInclude }),
      prisma.booking.count({ where }),
    ]);

    return { results, page, limit, totalPages: Math.ceil(totalResults / limit), totalResults };
  };

  /**
   * [M12] Staff/chủ KS xem CHI TIẾT một booking của khách sạn (kèm khách, phòng đã gán, voucher,
   * thanh toán). Invoice không có relation trên Booking nên truy riêng theo bookingId.
   */
  getHotelBookingById = async (hotelId: string, bookingId: string, currentUser: User) => {
    await hotelService.getOperableHotel(hotelId, currentUser);
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, hotelId },
      include: {
        customer: { select: { id: true, fullName: true, email: true, phone: true } },
        roomType: { select: { id: true, name: true, bedType: true, viewType: true } },
        bookingRooms: { include: { room: { select: { id: true, roomNumber: true, floor: true } } } },
        voucher: { select: { voucherCode: true, qrData: true, usedAt: true, expiresAt: true } },
        payments: { select: { id: true, paymentMethod: true, amount: true, status: true, paidAt: true } },
      },
    });
    if (!booking) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy booking trong khách sạn này');
    }
    const invoice = await prisma.invoice.findUnique({ where: { bookingId } });
    return { ...booking, invoice };
  };

  /**
   * [M13] Staff quét QR / nhập mã voucher để TRA booking trước khi check-in. Tìm theo voucher_code
   * (cột unique), rồi đối chiếu booking đúng khách sạn đang vận hành. Trả về booking chi tiết như màn
   * vận hành để staff xác nhận khách trước khi bấm check-in.
   */
  lookupBookingByVoucher = async (hotelId: string, voucherCode: string, currentUser: User) => {
    await hotelService.getOperableHotel(hotelId, currentUser);
    const voucher = await prisma.bookingVoucher.findUnique({
      where: { voucherCode },
      include: { booking: { include: staffBookingInclude } },
    });
    if (!voucher || voucher.booking.hotelId !== hotelId) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy booking với mã voucher này trong khách sạn');
    }
    return voucher.booking;
  };

  /**
   * [M13] Check-in khách: chỉ booking đã confirmed (đã thanh toán). Trong một transaction:
   * confirmed→checked_in (có điều kiện), gán MỘT phòng vật lý trống đúng loại (giành phòng có
   * điều kiện để hai quầy check-in không gán trùng phòng), đánh dấu voucher đã dùng.
   */
  checkInBooking = async (hotelId: string, bookingId: string, currentUser: User, payload: CheckInBookingDto) => {
    await hotelService.getOperableHotel(hotelId, currentUser);
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, hotelId },
      include: { voucher: { select: { voucherCode: true } } },
    });
    if (!booking) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy booking trong khách sạn này');
    }
    if (booking.status !== 'confirmed') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Chỉ check-in được booking đã xác nhận (đã thanh toán)');
    }
    // Chỉ cho check-in trong cửa sổ ở thực tế: từ ngày nhận phòng đến trước ngày trả phòng.
    // (checkInDate <= hôm nay < checkOutDate) — chặn check-in quá sớm và check-in khi kỳ ở đã kết thúc.
    const today = toUtcDate(new Date());
    if (toUtcDate(booking.checkInDate) > today) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Chưa tới ngày nhận phòng, không thể check-in');
    }
    if (toUtcDate(booking.checkOutDate) <= today) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Đã quá kỳ lưu trú — booking này nên được xử lý là no-show');
    }
    // Nếu staff quét/nhập mã voucher thì phải khớp đúng voucher của booking
    if (payload.voucherCode && booking.voucher && booking.voucher.voucherCode !== payload.voucherCode) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Mã voucher không khớp với booking');
    }

    return prisma.$transaction(async (tx) => {
      const moved = await tx.booking.updateMany({
        where: { id: bookingId, status: 'confirmed' },
        data: { status: 'checked_in', checkedInAt: new Date() },
      });
      if (moved.count === 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Booking không còn ở trạng thái xác nhận');
      }

      // Chọn một phòng vật lý trống đúng loại (hoặc đúng phòng staff chỉ định nếu có)
      const room = await tx.room.findFirst({
        where: {
          hotelId,
          roomTypeId: booking.roomTypeId,
          status: 'available',
          ...(payload.roomId && { id: payload.roomId }),
        },
      });
      if (!room) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Không còn phòng trống đúng loại để bàn giao');
      }
      // Giành phòng có điều kiện: chỉ thành công khi phòng vẫn 'available'
      const claimed = await tx.room.updateMany({
        where: { id: room.id, status: 'available' },
        data: { status: 'occupied' },
      });
      if (claimed.count === 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Phòng vừa được nhận, vui lòng thử phòng khác');
      }
      await tx.bookingRoom.create({ data: { bookingId, roomId: room.id, assignedAt: new Date() } });

      if (booking.voucher) {
        await tx.bookingVoucher.update({ where: { bookingId }, data: { usedAt: new Date() } });
      }

      // Thông báo cho khách: đã bàn giao phòng. Kèm SỐ PHÒNG vì đó là thứ khách cần ngay
      // (và là bằng chứng để đối chiếu nếu lễ tân gán nhầm phòng).
      // Dùng `alert` vì enum NotificationType không có loại nào cho sự kiện đã-nhận-phòng
      // (`check_in_reminder` là NHẮC TRƯỚC ngày nhận, dùng ở đây sẽ sai nghĩa).
      await tx.notification.create({
        data: {
          userId: booking.customerId,
          type: 'alert',
          title: 'Nhận phòng thành công',
          body: `Bạn đã nhận phòng ${room.roomNumber} cho đơn ${booking.bookingCode}. Chúc bạn có kỳ nghỉ vui vẻ!`,
          data: { bookingId, bookingCode: booking.bookingCode, roomNumber: room.roomNumber },
          channel: 'in_app',
          status: 'sent',
          sentAt: new Date(),
        },
      });

      return tx.booking.findUniqueOrThrow({ where: { id: bookingId }, include: staffBookingInclude });
    });
  };

  /**
   * [M13 + S12] Check-out khách: chỉ booking đang checked_in. Trong một transaction:
   * checked_in→checked_out (có điều kiện), trả phòng về 'cleaning' để housekeeping dọn,
   * và phát hành hoá đơn (Invoice) gồm phụ thu phát sinh nếu có.
   */
  checkOutBooking = async (hotelId: string, bookingId: string, currentUser: User, payload: CheckOutBookingDto) => {
    await hotelService.getOperableHotel(hotelId, currentUser);
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, hotelId },
      include: { bookingRooms: { select: { roomId: true } } },
    });
    if (!booking) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy booking trong khách sạn này');
    }
    if (booking.status !== 'checked_in') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Chỉ check-out được booking đang lưu trú');
    }

    const extra = new Prisma.Decimal(payload.extraCharge ?? 0);

    return prisma.$transaction(async (tx) => {
      const moved = await tx.booking.updateMany({
        where: { id: bookingId, status: 'checked_in' },
        data: { status: 'checked_out', checkedOutAt: new Date() },
      });
      if (moved.count === 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Booking không còn đang lưu trú');
      }

      // Trả phòng về trạng thái dọn dẹp + auto-sinh task housekeeping cho từng phòng (S22).
      // Staff hoàn thành task sẽ chuyển phòng về 'available'.
      const roomIds = booking.bookingRooms.map((br) => br.roomId);
      if (roomIds.length > 0) {
        await tx.room.updateMany({ where: { id: { in: roomIds } }, data: { status: 'cleaning' } });
        await tx.housekeepingTask.createMany({
          data: roomIds.map((roomId) => ({ hotelId, roomId, bookingId })),
        });
      }

      // Hoá đơn tách thuế: taxAmount lấy đúng khoản thuế đã đóng băng trên booking.
      // Invoice không có cột phí riêng ⇒ subtotal gộp mọi khoản TRƯỚC thuế (tiền phòng − giảm giá
      // + phí dịch vụ + phụ thu lúc trả phòng), nhờ vậy luôn giữ subtotal + taxAmount = totalAmount.
      const invoiceSubtotal = booking.subtotal.sub(booking.discountAmount).add(booking.feeAmount).add(extra);
      const invoice = await tx.invoice.create({
        data: {
          bookingId,
          invoiceNumber: generateInvoiceNumber(),
          subtotal: invoiceSubtotal,
          taxAmount: booking.taxAmount,
          totalAmount: invoiceSubtotal.add(booking.taxAmount),
        },
      });

      // Thông báo cho khách: đã trả phòng + mời đánh giá. Kèm số hoá đơn để khách đối chiếu
      // (phụ thu lúc trả phòng nằm trong đó — khách hay thắc mắc chỗ này nhất).
      // Dùng `review_request` vì đây chính là thời điểm mời đánh giá, và enum không có
      // loại riêng cho "đã trả phòng".
      await tx.notification.create({
        data: {
          userId: booking.customerId,
          type: 'review_request',
          title: 'Trả phòng thành công — kỳ nghỉ của bạn thế nào?',
          body: `Đơn ${booking.bookingCode} đã hoàn tất, hoá đơn ${invoice.invoiceNumber}. Chia sẻ trải nghiệm của bạn để giúp khách sau nhé!`,
          data: { bookingId, bookingCode: booking.bookingCode, invoiceNumber: invoice.invoiceNumber },
          channel: 'in_app',
          status: 'sent',
          sentAt: new Date(),
        },
      });

      const result = await tx.booking.findUniqueOrThrow({ where: { id: bookingId }, include: staffBookingInclude });
      return { ...result, invoice };
    });
  };

  /**
   * Staff ghi nhận đã thu tiền mặt cho booking trả tại khách sạn. Trong một transaction:
   * khoản Payment tiền mặt pending→completed (có điều kiện để không ghi nhận hai lần), rồi tạo
   * PlatformCommission (lúc này tiền mới thực sự về nên mới tính hoa hồng cho platform).
   */
  recordCashPayment = async (hotelId: string, bookingId: string, currentUser: User) => {
    await hotelService.getOperableHotel(hotelId, currentUser);
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, hotelId },
      include: {
        hotel: { select: { partnerId: true, partner: { select: { commissionRate: true } } } },
        payments: { where: { paymentMethod: 'cash', status: 'pending' }, take: 1 },
      },
    });
    if (!booking) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy booking trong khách sạn này');
    }
    if (booking.status === 'cancelled') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Booking đã huỷ, không thể thu tiền');
    }
    const cashPayment = booking.payments[0] ?? null;
    if (!cashPayment) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Không có khoản tiền mặt nào đang chờ thu cho booking này');
    }

    return prisma.$transaction(async (tx) => {
      const paid = await tx.payment.updateMany({
        where: { id: cashPayment.id, status: 'pending' },
        data: { status: 'completed', paidAt: new Date() },
      });
      if (paid.count === 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Khoản tiền mặt này vừa được ghi nhận');
      }

      const rate = booking.hotel.partner.commissionRate;
      const commissionAmount = booking.totalAmount.mul(rate).div(100).toDecimalPlaces(2);
      await tx.platformCommission.create({
        data: {
          bookingId,
          partnerId: booking.hotel.partnerId,
          paymentId: cashPayment.id,
          commissionRate: rate,
          commissionAmount,
          status: 'pending',
        },
      });

      // Tiền mặt vừa về → ghi net (total − hoa hồng) vào balancePending của ví khách sạn
      const net = booking.totalAmount.sub(commissionAmount);
      await walletService.recordEarning(tx, hotelId, bookingId, net);

      return tx.booking.findUniqueOrThrow({ where: { id: bookingId }, include: staffBookingInclude });
    });
  };

  /**
   * Đánh dấu no-show (khách không đến nhận phòng) — staff bấm tay. Chỉ áp cho booking đã confirmed
   * và đã tới ngày nhận phòng. Tiền: VNPay trả trước thì FORFEIT (giữ nguyên, không hoàn); khoản
   * tiền mặt chưa thu thì đánh dấu failed (không bao giờ thu được nữa).
   */
  markNoShow = async (hotelId: string, bookingId: string, currentUser: User) => {
    await hotelService.getOperableHotel(hotelId, currentUser);
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, hotelId },
      include: { payments: { where: { paymentMethod: 'cash', status: 'pending' }, take: 1 } },
    });
    if (!booking) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy booking trong khách sạn này');
    }
    if (booking.status !== 'confirmed') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Chỉ đánh dấu no-show cho booking đã xác nhận chưa nhận phòng');
    }
    if (toUtcDate(booking.checkInDate) > toUtcDate(new Date())) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Chưa tới ngày nhận phòng, chưa thể đánh dấu no-show');
    }

    const cashPending = booking.payments[0] ?? null;
    return prisma.$transaction(async (tx) => {
      const moved = await tx.booking.updateMany({
        where: { id: bookingId, status: 'confirmed' },
        data: { status: 'no_show', cancellationReason: 'Khách không đến nhận phòng (no-show)' },
      });
      if (moved.count === 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Booking không còn ở trạng thái xác nhận');
      }
      // Tiền mặt chưa thu sẽ không bao giờ thu ⇒ failed. VNPay đã trả thì giữ nguyên (forfeit, không hoàn).
      if (cashPending) {
        await tx.payment.update({ where: { id: cashPending.id }, data: { status: 'failed' } });
      }
      return tx.booking.findUniqueOrThrow({ where: { id: bookingId }, include: staffBookingInclude });
    });
  };

  /**
   * Quét tự động các booking đã confirmed nhưng qua hết kỳ ở mà chưa nhận phòng ⇒ no-show.
   * Chạy bởi scheduler trong app (config/scheduler.ts, 02:00 hằng ngày) — cũng kích tay được qua
   * POST /internal/jobs/sweep-no-shows. Mốc chặt hơn bản tay (checkOutDate đã qua) để không bắt nhầm
   * khách check-in muộn trong kỳ ở. Mỗi booking xử lý có điều kiện để an toàn khi chạy song song.
   * @returns số booking đã đánh dấu no-show
   */
  sweepNoShows = async (): Promise<number> => {
    const today = toUtcDate(new Date());
    const elapsed = await prisma.booking.findMany({
      where: { status: 'confirmed', checkOutDate: { lte: today } },
      select: { id: true },
    });

    let count = 0;
    for (const booking of elapsed) {
      // eslint-disable-next-line no-await-in-loop
      const done = await prisma.$transaction(async (tx) => {
        const moved = await tx.booking.updateMany({
          where: { id: booking.id, status: 'confirmed' },
          data: { status: 'no_show', cancellationReason: 'Quá kỳ lưu trú, khách không nhận phòng (no-show tự động)' },
        });
        if (moved.count === 0) {
          return false;
        }
        await tx.payment.updateMany({
          where: { bookingId: booking.id, paymentMethod: 'cash', status: 'pending' },
          data: { status: 'failed' },
        });
        return true;
      });
      if (done) {
        count += 1;
      }
    }
    return count;
  };
}

export const bookingService = new BookingService();
