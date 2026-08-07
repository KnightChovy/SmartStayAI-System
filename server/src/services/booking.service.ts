import httpStatus from 'http-status';
import { randomBytes } from 'crypto';
import { Prisma } from '@prisma/client';
import type {
  User,
  UserRole,
  BookingStatus,
  RefundStatus,
  CancelledByRole,
  CancellationReasonCode,
} from '@prisma/client';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';
import { roleRights } from '../config/roles';
import { toUtcDate, eachNightOfStay, todayInVietnamDate } from '../utils/dates';
import { availabilityService } from './availability.service';
import {
  hotelService,
  readCancellationPolicy,
  parseCancellationPolicy,
  refundPercentForHours,
  appliedTierForHours,
  nextTierAfter,
  freeUntilHoursOf,
} from './hotel.service';
import type { CancellationPolicy } from './hotel.service';
import type {
  CreateBookingDto,
  BookingFilter,
  BookingQueryOptions,
  HotelBookingFilter,
  PlatformBookingFilter,
  PartnerBookingFilter,
  AssignRoomDto,
  CheckInBookingDto,
  CheckOutBookingDto,
  CancelBookingDto,
} from '../dto/booking.dto';
import { walletService } from './wallet.service';
import { commissionRateService } from './commission-rate.service';
import { encrypt } from '../utils/encryption';

// Đặt tối đa bao nhiêu đêm cho một booking (chặn khoảng ngày vô lý)
const MAX_NIGHTS = 30;

// Booking pending phải thanh toán trong khoảng này, quá hạn thì tự nhả tồn kho
export const HOLD_MINUTES = 15;

// SePay là chuyển khoản ngân hàng: khách phải mở app, quét QR, nhập OTP... nên chậm hơn quẹt thẻ
// qua cổng. Cho hạn giữ chỗ rộng hơn để tránh nhả phòng ngay lúc khách đang chuyển tiền.
export const SEPAY_HOLD_MINUTES = 30;

/**
 * Những lý do huỷ mà khách KHÔNG có lỗi ⇒ hoàn nguyên tiền, không trừ phí huỷ theo chính sách:
 * lỗi vận hành khách sạn (phòng hỏng, overbooking, bất khả kháng) và lỗi hệ thống/nền tảng.
 * Nhờ danh sách này, hàm tính tiền hoàn chỉ cần đọc lý do chứ không phải if-else theo role.
 */
const FULL_REFUND_REASON_CODES: CancellationReasonCode[] = [
  'room_out_of_order',
  'overbooking',
  'hotel_force_majeure',
  'payment_failed',
  'hold_expired',
  'partner_suspended',
  'fraud_detected',
  'policy_violation',
];

/**
 * Role của người bấm huỷ, đóng băng lại tại thời điểm huỷ. Không lưu thẳng UserRole vì cột này
 * phải giữ nguyên giá trị lịch sử kể cả khi người đó đổi vai trò về sau — và vì `system` (cron nhả
 * chỗ quá hạn) không phải một tài khoản nào cả.
 */
const cancelledByRoleOf = (role: UserRole): CancelledByRole => {
  const map: Partial<Record<UserRole, CancelledByRole>> = {
    customer: 'customer',
    staff: 'hotel_staff',
    hotel_partner: 'hotel_partner',
    platform_manager: 'platform_manager',
    admin: 'admin',
  };
  // guest không huỷ được (đã chặn ở loadBookingForCancel) nên nhánh này không xảy ra trong thực tế
  return map[role] ?? 'customer';
};

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

// Giờ nhận phòng của KS được lưu là giờ TƯỜNG theo giờ VN (UTC+7, không DST). VN-only.
const VN_UTC_OFFSET_HOURS = 7;

// Thời điểm nhận phòng thực tế = ngày nhận phòng + giờ nhận phòng của KS (mặc định 14:00)
// để tính "còn bao nhiêu giờ tới giờ nhận phòng" cho chính xác thay vì lấy nửa đêm.
const checkInMomentOf = (checkInDate: Date, checkInTime: string | null): Date => {
  const [h, m] = (checkInTime ?? '14:00').split(':').map((part) => Number(part) || 0);
  const moment = new Date(checkInDate);
  // Quy giờ VN về mốc UTC tuyệt đối (trừ 7 giờ). Trước đây setUTCHours(h) coi "14:00" là 14:00 UTC
  // = 21:00 VN ⇒ hoursBeforeCheckIn + cửa sổ hoàn tiền lệch 7 giờ. h<7 thì tự lùi về ngày trước (đúng).
  moment.setUTCHours(h - VN_UTC_OFFSET_HOURS, m, 0, 0);
  return moment;
};

/**
 * Số tiền hoàn theo chính sách BẬC THANG: tìm bậc áp dụng cho "còn bao nhiêu giờ tới check-in" rồi
 * hoàn `refundPercent%` của số đã trả. Làm tròn 2 chữ số (đồng bộ phần tiền còn lại của hệ thống).
 */
const computeRefundAmount = (
  policy: CancellationPolicy,
  hoursBeforeCheckIn: number,
  totalPaid: Prisma.Decimal
): Prisma.Decimal =>
  totalPaid.mul(refundPercentForHours(policy, hoursBeforeCheckIn)).div(100).toDecimalPlaces(2);

/**
 * Chính sách áp cho một booking = SNAPSHOT đóng băng lúc đặt (booking.cancellationPolicy) nếu có,
 * ngược lại đọc policy SỐNG của khách sạn (booking cũ chưa có snapshot). Nhờ snapshot, KS đổi chính
 * sách sau khi khách đặt KHÔNG làm đổi điều khoản của đơn cũ.
 */
const resolveBookingPolicy = (booking: {
  cancellationPolicy: Prisma.JsonValue | null;
  hotel: { settings: Prisma.JsonValue | null };
}): CancellationPolicy =>
  booking.cancellationPolicy
    ? parseCancellationPolicy(booking.cancellationPolicy)
    : readCancellationPolicy(booking.hotel.settings);

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
          data: {
            status: 'cancelled',
            cancelledAt: now,
            cancelledByRole: 'system',
            cancellationReasonCode: 'hold_expired',
            cancellationReason: 'Payment deadline expired',
          },
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
        'Please update the phone number in your profile before booking'
      );
    }

    // Dọn các giữ chỗ hết hạn trước để chúng không chiếm mất tồn kho của lượt đặt này
    await this.releaseExpiredHolds();

    // 'cash' = trả tiền mặt tại KS ⇒ xác nhận giữ phòng ngay, không hết hạn 15'.
    // 'vnpay' (mặc định) = giữ chỗ pending 15' chờ thanh toán online.
    const method = payload.paymentMethod ?? 'vnpay';

    const checkIn = toUtcDate(payload.checkInDate);
    const checkOut = toUtcDate(payload.checkOutDate);
    const today = todayInVietnamDate();
    if (checkIn < today) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Check-in date cannot be in the past');
    }
    const nights = eachNightOfStay(checkIn, checkOut);
    if (nights.length === 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Check-out date must be after check-in date');
    }
    if (nights.length > MAX_NIGHTS) {
      throw new ApiError(httpStatus.BAD_REQUEST, `You can book at most ${MAX_NIGHTS} nights`);
    }

    const roomType = await prisma.roomType.findFirst({
      where: {
        id: payload.roomTypeId,
        hotelId: payload.hotelId,
        isActive: true,
        hotel: { isActive: true, isListed: true, deletedAt: null },
      },
      include: { hotel: { select: { settings: true } } }, // để snapshot chính sách huỷ lúc đặt
    });
    if (!roomType) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Room type not found in this hotel');
    }
    // Đóng băng chính sách huỷ HIỆN TẠI của KS vào booking (xem resolveBookingPolicy)
    const cancellationSnapshot = readCancellationPolicy(roomType.hotel.settings);
    // Số khách: nhận cách mới (numAdults/numChildren) hoặc cũ (numGuests). Chỉ có numGuests ⇒ coi tất
    // cả là người lớn (tương thích ngược). Tiền vẫn tính theo TỔNG khách, không phân biệt trẻ em.
    const numAdults = payload.numAdults ?? payload.numGuests ?? 1;
    const numChildren = payload.numChildren ?? 0;
    const numGuests = numAdults + numChildren;
    if (numGuests > roomType.maxOccupancy) {
      throw new ApiError(httpStatus.BAD_REQUEST, `This room type can hold at most ${roomType.maxOccupancy} guests`);
    }
    // maxAdults/maxChildren tuỳ chọn: chỉ chặn khi khách sạn có khai để tránh chặn oan loại phòng cũ chưa cấu hình
    if (roomType.maxAdults !== null && numAdults > roomType.maxAdults) {
      throw new ApiError(httpStatus.BAD_REQUEST, `This room type can hold at most ${roomType.maxAdults} adults`);
    }
    if (roomType.maxChildren !== null && numChildren > roomType.maxChildren) {
      throw new ApiError(httpStatus.BAD_REQUEST, `This room type can hold at most ${roomType.maxChildren} children`);
    }

    // Giá từng đêm áp pricing rule giống hệt lúc search (xem availability.service.priceForNight)
    const pricingRules = await availabilityService.getActivePricingRules([roomType.hotelId]);
    const priceInput = { id: roomType.id, hotelId: roomType.hotelId, basePrice: roomType.basePrice };

    // Khoản thu thuế/phí ĐANG hiệu lực — đọc một lần ở đây rồi đóng băng vào booking bên dưới
    const taxFeeCharges = (await availabilityService.getTaxFeeCharges([roomType.hotelId])).get(roomType.hotelId) ?? [];

    // Số phòng bán được của TỪNG ĐÊM (đã trừ phòng đang bị chặn để sửa trong đúng đêm đó). Phải
    // đếm bằng ĐÚNG điều kiện lúc khách tìm phòng, nếu không thì đêm chưa có dòng tồn kho sẽ được
    // tạo với totalRooms thừa và khách đặt được cả phòng đang sửa.
    const sellablePerNight = await availabilityService.countSellableRoomsPerDate([roomType.id], nights);
    if (nights.every((night) => (sellablePerNight.get(`${roomType.id}:${night.getTime()}`) ?? 0) === 0)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'This room type is not open for sale yet');
    }

    return prisma.$transaction(async (tx) => {
      let subtotal = new Prisma.Decimal(0);
      for (const night of nights) {
        // Đêm chưa có dòng tồn kho ⇒ tạo với totalRooms = số phòng bán được ĐÊM ĐÓ
        // (upsert là atomic nhờ unique constraint)
        const row = await tx.roomAvailability.upsert({
          where: { roomTypeId_date: { roomTypeId: roomType.id, date: night } },
          create: {
            roomTypeId: roomType.id,
            hotelId: roomType.hotelId,
            date: night,
            totalRooms: sellablePerNight.get(`${roomType.id}:${night.getTime()}`) ?? 0,
          },
          update: {},
        });

        // Giữ phòng có điều kiện: WHERE bookedRooms < totalRooms được Postgres kiểm tra lại
        // sau khi lock dòng, nên booking song song không thể vượt quá tồn kho
        const reserved = await tx.roomAvailability.updateMany({
          where: { id: row.id, bookedRooms: { lt: row.totalRooms } },
          data: { bookedRooms: { increment: 1 } },
        });
        if (reserved.count === 0) {
          throw new ApiError(httpStatus.BAD_REQUEST, `No rooms left for the night of ${night.toISOString().slice(0, 10)}`);
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
          // đóng băng chính sách huỷ lúc đặt (cast: CancellationPolicy là JSON thuần nhưng thiếu index signature)
          cancellationPolicy: cancellationSnapshot as unknown as Prisma.InputJsonValue,
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
          title: isCash ? 'Booking successful' : 'Booking created — please complete payment',
          body: isCash
            ? `Booking ${booking.bookingCode} at ${booking.hotel.name} has been confirmed. You will pay at check-in.`
            : `Booking ${booking.bookingCode} at ${booking.hotel.name} is held for ${holdMinutes} minutes. Complete payment to confirm.`,
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
  private loadBookingForCancel = async (bookingId: string, currentUser: User, reasonCode?: CancellationReasonCode) => {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        hotel: { select: { settings: true, checkInTime: true } },
        payments: { where: { status: 'completed' } },
        commission: true,
      },
    });
    if (!booking) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
    }
    const isOwner = booking.customerId === currentUser.id;
    const canManage = (roleRights.get(currentUser.role) || []).includes('manageBookings');
    if (!isOwner && !canManage) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }
    // Lý do dạng enum là thứ quyết định có hoàn 100% hay không ⇒ khách KHÔNG được tự khai,
    // nếu không thì ai cũng chọn "phòng hỏng" để né phí huỷ.
    if (reasonCode && !canManage) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Only hotel staff can select a policy-based cancellation reason');
    }

    const policy = resolveBookingPolicy(booking); // snapshot của đơn (fallback policy sống của KS)
    const checkInMoment = checkInMomentOf(booking.checkInDate, booking.hotel.checkInTime);
    const hoursBeforeCheckIn = (checkInMoment.getTime() - Date.now()) / (1000 * 60 * 60);

    // Booking có thể trả GHÉP nhiều payment (ví + gateway) ⇒ tiền đã trả = TỔNG các payment,
    // KHÔNG phải một payment. paidPayment chỉ để NEO bản ghi Refund (schema cần 1 paymentId);
    // mọi phép tính tiền hoàn đi theo tổng đã trả của booking.
    const paidPayment = booking.payments[0] ?? null;
    const paidTotal = booking.payments.reduce((sum, p) => sum.add(p.amount), new Prisma.Decimal(0));
    // Lỗi khách sạn hoặc lỗi hệ thống thì hoàn nguyên tiền, KHÔNG trừ phí huỷ theo chính sách —
    // khách không làm gì sai thì không có lý do gì để họ mất tiền.
    const refundAmount = !paidPayment
      ? new Prisma.Decimal(0)
      : reasonCode && FULL_REFUND_REASON_CODES.includes(reasonCode)
        ? paidTotal
        : computeRefundAmount(policy, hoursBeforeCheckIn, paidTotal);

    return { booking, policy, checkInMoment, hoursBeforeCheckIn, paidPayment, paidTotal, refundAmount };
  };

  /**
   * Xem trước tiền hoàn TRƯỚC khi bấm huỷ — khách phải biết mình mất bao nhiêu rồi mới quyết định.
   * Chỉ đọc, không đổi gì. Dùng chung loadBookingForCancel với cancelBooking nên con số ở đây đúng
   * bằng con số sẽ hoàn (miễn là khách huỷ ngay; qua mốc miễn phí thì số sẽ khác, nên trả kèm
   * freeUntilMoment để FE đếm ngược).
   */
  getRefundPreview = async (bookingId: string, currentUser: User) => {
    const { booking, policy, checkInMoment, hoursBeforeCheckIn, paidPayment, paidTotal, refundAmount } =
      await this.loadBookingForCancel(bookingId, currentUser);

    // Tiền đã trả = TỔNG các payment (booking có thể trả ghép), không phải một payment
    const paidAmount = paidTotal;
    const appliedTier = appliedTierForHours(policy, hoursBeforeCheckIn);
    const nextTier = nextTierAfter(policy, appliedTier);
    const freeUntilHours = freeUntilHoursOf(policy);
    const canCancel =
      toUtcDate(booking.checkInDate) > todayInVietnamDate() &&
      (booking.status === 'pending' || booking.status === 'confirmed');

    return {
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      status: booking.status,
      // Huỷ được không, và nếu không thì vì sao — để FE khỏi tự đoán luật
      canCancel,
      cannotCancelReason: canCancel
        ? null
        : toUtcDate(booking.checkInDate) <= todayInVietnamDate()
          ? 'Cancellation is only allowed before the check-in date'
          : 'Only pending or confirmed bookings can be cancelled',
      isPaid: paidPayment !== null,
      paidAmount,
      refundAmount,
      // Phần bị giữ lại nếu huỷ ngay bây giờ
      penaltyAmount: paidAmount.sub(refundAmount),
      hoursBeforeCheckIn: Math.round(hoursBeforeCheckIn * 10) / 10,
      // Bậc thang: bậc đang áp + % hoàn + toàn bộ bậc để FE vẽ bảng
      appliedTier,
      refundPercent: appliedTier?.refundPercent ?? 0,
      tiers: policy.tiers,
      // Cảnh báo bậc kế: sau `changesAt` thì % hoàn tụt xuống `refundPercent` (null nếu đã ở bậc thấp nhất)
      nextTier:
        appliedTier && nextTier
          ? {
              changesAt: new Date(checkInMoment.getTime() - appliedTier.minHoursBefore * 60 * 60 * 1000),
              refundPercent: nextTier.refundPercent,
            }
          : null,
      // Dẫn xuất để FE cũ không vỡ (CancellationLine đọc freeUntilHours)
      freeUntilHours,
      isFreeCancellation: (appliedTier?.refundPercent ?? 0) === 100,
      freeUntilMoment: freeUntilHours != null ? new Date(checkInMoment.getTime() - freeUntilHours * 60 * 60 * 1000) : null,
      checkInMoment,
    };
  };

  cancelBooking = async (bookingId: string, currentUser: User, payload: CancelBookingDto = {}) => {
    const { reason, reasonCode, bankAccount } = payload;
    const { booking, paidPayment, refundAmount } = await this.loadBookingForCancel(
      bookingId,
      currentUser,
      reasonCode
    );

    const today = todayInVietnamDate();
    if (toUtcDate(booking.checkInDate) <= today) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Cancellation is only allowed before the check-in date');
    }

    // Mặc định hoàn vào ví: khách nhận được ngay, không phải chờ ai chuyển khoản. Muốn tiền về
    // ngân hàng thì phải gửi kèm tài khoản — không có thì Platform Manager chẳng biết chuyển đi đâu.
    const refundMethod = payload.refundMethod ?? 'wallet';
    if (refundMethod === 'bank' && !bankAccount) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Choosing a bank refund requires providing the receiving account');
    }

    const nights = eachNightOfStay(booking.checkInDate, booking.checkOutDate);
    return prisma.$transaction(async (tx) => {
      // Đổi trạng thái có điều kiện TRƯỚC: hai request huỷ song song thì chỉ một bên
      // đi tiếp, tồn kho không bị trả lại hai lần
      const cancelled = await tx.booking.updateMany({
        where: { id: bookingId, status: { in: ['pending', 'confirmed'] } },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancelledByRole: cancelledByRoleOf(currentUser.role),
          cancelledByUserId: currentUser.id,
          // Khách tự huỷ mà không khai gì thì mặc định là 'guest_request' — vẫn tính phí theo
          // chính sách như trước, chỉ khác là nay ghi lại được để đối soát.
          cancellationReasonCode: reasonCode ?? 'guest_request',
          cancellationReason: reason || null,
        },
      });
      if (cancelled.count === 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Only pending or confirmed bookings can be cancelled');
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
            reason: reason || 'Guest cancelled the booking',
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
      throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
    }
    const isOwner = booking.customerId === currentUser.id;
    const canManage = (roleRights.get(currentUser.role) || []).includes('manageBookings');
    if (!isOwner && !canManage) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }
    return booking;
  };

  /**
   * [M12] Staff/chủ KS xem booking của một khách sạn — nguồn dữ liệu của màn lịch tồn kho.
   * Quyền: chủ KS, manager, hoặc nhân viên được phân công (getOperableHotel).
   *
   * Hai điểm CỐ Ý khác các màn giám sát của PM/partner (applyOversightFilters):
   *
   * 1. `status` nhận cả mảng — màn lịch cần confirmed + checked_in + pending trong một lượt.
   * 2. `fromDate`/`toDate` lọc theo KHOẢNG LƯU TRÚ, không theo ngày nhận phòng. Lọc theo checkInDate
   *    làm đơn nhận 30/07 trả 09/08 biến mất khi xem tuần 06/08 — dù nó vẫn đang chiếm phòng suốt
   *    tuần đó, và người dùng phải tự lùi ngày bắt đầu ra thật xa để mò lại. Hai kỳ chồng nhau khi
   *    nhận phòng <= ngày cuối khoảng xem VÀ trả phòng > ngày đầu khoảng xem (ngày trả không phải
   *    một đêm ngủ nên dùng dấu > chứ không phải >=).
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
      const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
      where.status = { in: statuses };
    }
    if (filter.toDate) {
      where.checkInDate = { lte: toUtcDate(filter.toDate) };
    }
    if (filter.fromDate) {
      where.checkOutDate = { gt: toUtcDate(filter.fromDate) };
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
      throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found in this hotel');
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
      throw new ApiError(httpStatus.NOT_FOUND, 'No booking found with this voucher code in the hotel');
    }
    return voucher.booking;
  };

  /**
   * Phòng hợp lệ để gán cho một booking, đã kiểm đủ 3 điều kiện KHÔNG phụ thuộc thời điểm gán:
   * đúng khách sạn, đúng loại phòng của đơn, và còn trong biên chế (isActive).
   */
  private loadRoomForAssignment = async (hotelId: string, roomId: string, roomTypeId: string) => {
    const room = await prisma.room.findFirst({
      where: { id: roomId, hotelId },
      select: { id: true, roomNumber: true, roomTypeId: true, isActive: true },
    });
    if (!room) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Room not found in this hotel');
    }
    if (room.roomTypeId !== roomTypeId) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Room ${room.roomNumber} does not match the booking's room type`);
    }
    if (!room.isActive) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Room ${room.roomNumber} is no longer in use`);
    }
    return room;
  };

  /**
   * [Front desk] GÁN TRƯỚC một phòng vật lý cho booking đã xác nhận nhưng chưa tới.
   *
   * Vì sao cần: bookingRoom trước đây chỉ sinh ra lúc check-in, nên một đơn `confirmed` cho đêm nay
   * chiếm một suất trong kho mà KHÔNG gắn với phòng nào — bản đồ phòng hiện 10 phòng trống trong khi
   * thực tế chỉ phát ra được 9, lễ tân dễ hứa nhầm với khách vãng lai.
   *
   * KHÔNG đụng tới rooms.status: cột đó là tình trạng của HÔM NAY, còn đơn được gán có thể của tuần
   * sau — đánh dấu occupied từ bây giờ là khoá mất một phòng đang bán được. Việc gán chỉ thể hiện
   * qua bookingRooms; check-in mới là lúc phòng chuyển sang occupied.
   */
  assignRoom = async (hotelId: string, bookingId: string, currentUser: User, payload: AssignRoomDto) => {
    await hotelService.getOperableHotel(hotelId, currentUser);
    const booking = await prisma.booking.findFirst({ where: { id: bookingId, hotelId } });
    if (!booking) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found in this hotel');
    }
    if (booking.status !== 'confirmed') {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Rooms can only be pre-assigned to confirmed bookings — for staying bookings, change the room in the Front desk section'
      );
    }

    const room = await this.loadRoomForAssignment(hotelId, payload.roomId, booking.roomTypeId);
    const checkIn = toUtcDate(booking.checkInDate);
    const checkOut = toUtcDate(booking.checkOutDate);
    // Đêm cuối khách ngủ = ngày trả phòng trừ 1: đợt chặn đúng ngày trả phòng không ảnh hưởng gì.
    const lastNight = new Date(checkOut);
    lastNight.setUTCDate(lastNight.getUTCDate() - 1);

    // Chỉ 'ooo' mới cản: 'oos' là ngưng phục vụ trong ngày (kê lại đồ), phòng vẫn bán và vẫn ở được.
    const block = await prisma.roomBlock.findFirst({
      where: {
        roomId: room.id,
        blockType: 'ooo',
        resolvedAt: null,
        startDate: { lte: lastNight },
        endDate: { gte: checkIn },
      },
      select: { startDate: true, endDate: true },
    });
    if (block) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Room ${room.roomNumber} is blocked ${block.startDate.toISOString().slice(0, 10)} → ` +
          `${block.endDate.toISOString().slice(0, 10)}, overlapping the booking's stay`
      );
    }

    return prisma.$transaction(async (tx) => {
      // Khoá dòng phòng suốt giao dịch. Không có nó, hai lễ tân cùng gán một phòng cho hai đơn trùng
      // ngày sẽ CÙNG đọc thấy "chưa ai gán" rồi cùng ghi — kiểm tra trùng ở dưới phải nhìn thấy bản
      // ghi của người kia thì mới có tác dụng.
      await tx.$queryRaw`SELECT id FROM rooms WHERE id = ${room.id}::uuid FOR UPDATE`;

      // Hai kỳ ở chồng nhau khi: đơn kia nhận phòng TRƯỚC ngày trả của đơn này và trả phòng SAU ngày
      // nhận của đơn này (dấu < và > chứ không phải <=/>=: khách đi buổi sáng, khách mới đến buổi
      // chiều cùng ngày là bình thường).
      const conflict = await tx.bookingRoom.findFirst({
        where: {
          roomId: room.id,
          bookingId: { not: bookingId },
          booking: {
            status: { in: ['confirmed', 'checked_in'] },
            checkInDate: { lt: checkOut },
            checkOutDate: { gt: checkIn },
          },
        },
        select: { booking: { select: { bookingCode: true, checkInDate: true, checkOutDate: true } } },
      });
      if (conflict) {
        throw new ApiError(
          httpStatus.CONFLICT,
          `Room ${room.roomNumber} is already assigned to booking ${conflict.booking.bookingCode} ` +
            `(${conflict.booking.checkInDate.toISOString().slice(0, 10)} → ` +
            `${conflict.booking.checkOutDate.toISOString().slice(0, 10)})`
        );
      }

      // Xoá rồi tạo lại thay vì update: bookingRoom không giữ dữ liệu gì ngoài mốc gán, và cách này
      // xử lý luôn ca "đổi sang phòng khác" mà không cần gọi DELETE trước.
      await tx.bookingRoom.deleteMany({ where: { bookingId } });
      await tx.bookingRoom.create({ data: { bookingId, roomId: room.id, assignedAt: new Date() } });

      return tx.booking.findUniqueOrThrow({ where: { id: bookingId }, include: staffBookingInclude });
    });
  };

  /**
   * [Front desk] Gỡ phòng đã gán trước, trả đơn về trạng thái "chưa chốt phòng".
   *
   * Chỉ gỡ được khi đơn CHƯA check-in: sau khi khách đã nhận phòng thì bookingRoom là bằng chứng
   * khách đang ở phòng nào — bỏ nó đi là mất dấu, phải đi qua check-out.
   */
  releaseAssignedRoom = async (hotelId: string, bookingId: string, currentUser: User) => {
    await hotelService.getOperableHotel(hotelId, currentUser);
    const booking = await prisma.booking.findFirst({ where: { id: bookingId, hotelId } });
    if (!booking) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found in this hotel');
    }
    if (booking.status !== 'confirmed') {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Pre-assigned rooms can only be released for confirmed bookings — once the guest has checked in, check out in the Front desk section'
      );
    }
    await prisma.bookingRoom.deleteMany({ where: { bookingId } });
    return prisma.booking.findUniqueOrThrow({ where: { id: bookingId }, include: staffBookingInclude });
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
      throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found in this hotel');
    }
    if (booking.status !== 'confirmed') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Only confirmed (paid) bookings can be checked in');
    }
    // Chỉ cho check-in trong cửa sổ ở thực tế: từ ngày nhận phòng đến trước ngày trả phòng.
    // (checkInDate <= hôm nay < checkOutDate) — chặn check-in quá sớm và check-in khi kỳ ở đã kết thúc.
    const today = todayInVietnamDate();
    if (toUtcDate(booking.checkInDate) > today) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'The check-in date has not arrived yet, cannot check in');
    }
    if (toUtcDate(booking.checkOutDate) <= today) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'The stay period has passed — this booking should be handled as a no-show');
    }
    // Nếu staff quét/nhập mã voucher thì phải khớp đúng voucher của booking
    if (payload.voucherCode && booking.voucher && booking.voucher.voucherCode !== payload.voucherCode) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'The voucher code does not match the booking');
    }

    return prisma.$transaction(async (tx) => {
      const moved = await tx.booking.updateMany({
        where: { id: bookingId, status: 'confirmed' },
        data: { status: 'checked_in', checkedInAt: new Date() },
      });
      if (moved.count === 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'The booking is no longer in confirmed status');
      }

      // Thứ tự ưu tiên khi chọn phòng vật lý:
      //  1. phòng staff chỉ định ngay lúc check-in (đổi ý ở quầy thì lời sau cùng thắng)
      //  2. phòng đã GÁN TRƯỚC cho đơn này (assignRoom) — không chọn lại, nếu không thì việc chốt
      //     phòng từ hôm trước thành vô nghĩa và khách được hứa một đằng nhận một nẻo
      //  3. bất kỳ phòng trống nào đúng loại
      const preAssigned = await tx.bookingRoom.findFirst({ where: { bookingId }, select: { roomId: true } });
      const desiredRoomId = payload.roomId ?? preAssigned?.roomId;
      const room = await tx.room.findFirst({
        where: {
          hotelId,
          roomTypeId: booking.roomTypeId,
          status: 'available',
          ...(desiredRoomId && { id: desiredRoomId }),
        },
      });
      if (!room) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          desiredRoomId
            ? 'The selected room is not ready for handover (occupied / being cleaned / blocked) — choose another room'
            : 'No available room of the right type left to hand over'
        );
      }
      // Giành phòng có điều kiện: chỉ thành công khi phòng vẫn 'available'.
      // Ghi cả foStatus — đây là chiều LỄ TÂN, và là nơi DUY NHẤT sinh ra 'occupied' (nó phải đi
      // kèm một booking, nên bản đồ phòng không cho bấm tay).
      const claimed = await tx.room.updateMany({
        where: { id: room.id, status: 'available' },
        data: { status: 'occupied', foStatus: 'occupied' },
      });
      if (claimed.count === 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'The room was just taken, please try another room');
      }
      // Dọn bản ghi gán trước (nếu có) rồi ghi lại: staff có thể vừa đổi sang phòng khác ở quầy,
      // và bookingRoom không giữ dữ liệu gì ngoài mốc gán nên xoá đi không mất lịch sử.
      await tx.bookingRoom.deleteMany({ where: { bookingId } });
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
          title: 'Check-in successful',
          body: `You have checked in to room ${room.roomNumber} for booking ${booking.bookingCode}. Enjoy your stay!`,
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
      throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found in this hotel');
    }
    if (booking.status !== 'checked_in') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Only staying bookings can be checked out');
    }

    const extra = new Prisma.Decimal(payload.extraCharge ?? 0);

    return prisma.$transaction(async (tx) => {
      const moved = await tx.booking.updateMany({
        where: { id: bookingId, status: 'checked_in' },
        data: { status: 'checked_out', checkedOutAt: new Date() },
      });
      if (moved.count === 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'The booking is no longer staying');
      }

      // Trả phòng về trạng thái dọn dẹp + auto-sinh task housekeeping cho từng phòng (S22).
      // Staff hoàn thành task sẽ chuyển phòng về 'available'.
      // Khách đi ⇒ chiều lễ tân về 'vacant', chiều buồng phòng thành 'dirty' (chưa ai dọn — khác
      // 'cleaning' là đã có người nhận việc và đang chạy SLA).
      const roomIds = booking.bookingRooms.map((br) => br.roomId);
      if (roomIds.length > 0) {
        await tx.room.updateMany({
          where: { id: { in: roomIds } },
          data: { status: 'cleaning', foStatus: 'vacant', hkStatus: 'dirty', hkStatusSince: new Date() },
        });
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
          title: 'Check-out successful — how was your stay?',
          body: `Booking ${booking.bookingCode} is complete, invoice ${invoice.invoiceNumber}. Share your experience to help future guests!`,
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
      throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found in this hotel');
    }
    if (booking.status === 'cancelled') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'The booking is already cancelled, cannot collect payment');
    }
    const cashPayment = booking.payments[0] ?? null;
    if (!cashPayment) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'There is no cash payment pending collection for this booking');
    }

    return prisma.$transaction(async (tx) => {
      const paid = await tx.payment.updateMany({
        where: { id: cashPayment.id, status: 'pending' },
        data: { status: 'completed', paidAt: new Date() },
      });
      if (paid.count === 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'This cash payment was just recorded');
      }

      // Tiền mặt vừa thu xong ⇒ tra mức hoa hồng theo ĐÚNG hôm nay, giống hệt đường thanh toán online
      const rate = await commissionRateService.resolveRate(hotelId, new Date(), tx);
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
      throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found in this hotel');
    }
    if (booking.status !== 'confirmed') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'No-show can only be marked for confirmed bookings that have not checked in');
    }
    if (toUtcDate(booking.checkInDate) > todayInVietnamDate()) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'The check-in date has not arrived yet, cannot mark no-show');
    }

    const cashPending = booking.payments[0] ?? null;
    return prisma.$transaction(async (tx) => {
      const moved = await tx.booking.updateMany({
        where: { id: bookingId, status: 'confirmed' },
        data: {
          status: 'no_show',
          cancelledByRole: cancelledByRoleOf(currentUser.role),
          cancelledByUserId: currentUser.id,
          cancellationReasonCode: 'guest_no_show',
          cancellationReason: 'Guest did not arrive for check-in (no-show)',
        },
      });
      if (moved.count === 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'The booking is no longer in confirmed status');
      }
      // Tiền mặt chưa thu sẽ không bao giờ thu ⇒ failed. VNPay đã trả thì giữ nguyên (forfeit, không hoàn).
      if (cashPending) {
        await tx.payment.update({ where: { id: cashPending.id }, data: { status: 'failed' } });
      }
      // Nhả tồn kho các đêm CÒN LẠI (từ hôm nay trở đi). Khách không đến thì các đêm này phải bán
      // lại được — no-show là mất khách chứ không được khoá luôn phòng. Đêm đã qua thì bỏ (không còn
      // bán được, trừ đi chỉ làm sai occupancy lịch sử). sweepNoShows không cần vì mọi đêm đã qua.
      const releasableNights = eachNightOfStay(booking.checkInDate, booking.checkOutDate).filter(
        (night) => night >= todayInVietnamDate()
      );
      if (releasableNights.length > 0) {
        await tx.roomAvailability.updateMany({
          where: { roomTypeId: booking.roomTypeId, date: { in: releasableNights }, bookedRooms: { gt: 0 } },
          data: { bookedRooms: { decrement: 1 } },
        });
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
    const today = todayInVietnamDate();
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
          data: {
            status: 'no_show',
            cancelledByRole: 'system',
            cancellationReasonCode: 'guest_no_show',
            cancellationReason: 'Stay period elapsed, guest did not check in (automatic no-show)',
          },
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
