import httpStatus from 'http-status';
import { Prisma } from '@prisma/client';
import type { User, CommissionRequestStatus } from '@prisma/client';
import prisma from '../config/prisma';
import config from '../config/config';
import ApiError from '../utils/ApiError';
import { toUtcDate } from '../utils/dates';
import { hotelService } from './hotel.service';
import { auditService } from './audit.service';
import type {
  CreateCommissionRequestDto,
  ReviewCommissionRequestDto,
  SetBaseRateDto,
  CommissionRequestFilter,
  CommissionRequestQueryOptions,
} from '../dto/commission-rate.dto';

// Ưu đãi luôn kéo đúng 12 tháng — không cho đối tác chọn, để mọi thoả thuận cùng một kỳ hạn.
const AGREEMENT_MONTHS = 12;

// Sàn cứng: không mức nào (kể cả ưu đãi được duyệt) được thấp hơn ngưỡng này.
const MIN_RATE = 10;

// Trần của mức nền toàn sàn.
const MAX_RATE = 30;

// Bị từ chối rồi phải chờ ngần này ngày mới được nộp đơn tiếp — tránh spam hàng chờ của PM.
const REJECT_COOLDOWN_DAYS = 7;

// Chỉ mở đơn gia hạn khi ưu đãi hiện tại sắp hết; sớm hơn thì partner phải đợi.
const RENEWAL_WINDOW_DAYS = 30;

// Các mốc nhắc trước khi ưu đãi hết hạn (ngày). Xếp giảm dần để tìm mốc phù hợp từ xa tới gần.
const REMINDER_DAYS = [30, 14, 7];

// Đổi mức nền toàn sàn phải báo trước ngần này ngày — đây là thay đổi điều khoản với mọi đối tác.
const BASE_RATE_NOTICE_DAYS = 30;

/** Cộng thêm số tháng vào một mốc ngày (UTC), giữ nguyên phần ngày. */
const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
};

/** Cộng/trừ số ngày vào một mốc ngày (UTC). */
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
};

/** Số ngày từ `from` tới `to` (âm nếu `to` đã qua). */
const daysBetween = (from: Date, to: Date): number =>
  Math.round((toUtcDate(to).getTime() - toUtcDate(from).getTime()) / (24 * 60 * 60 * 1000));

const requestInclude = {
  hotel: { select: { id: true, name: true, city: true } },
  requestedByUser: { select: { id: true, fullName: true, email: true } },
  reviewedByUser: { select: { id: true, fullName: true, email: true } },
  agreement: { select: { id: true, rate: true, effectiveFrom: true, effectiveTo: true } },
} satisfies Prisma.CommissionRateRequestInclude;

/**
 * Quản lý mức hoa hồng nền tảng thu của khách sạn.
 *
 * Hai tầng: MỨC NỀN toàn sàn (Platform Manager đặt, áp cho mọi khách sạn) và ƯU ĐÃI RIÊNG của một
 * khách sạn (có thời hạn 12 tháng, sinh ra khi đơn xin giảm được duyệt). Ưu đãi thắng mức nền trong
 * thời gian còn hiệu lực; hết hạn thì tự rơi về mức nền mà không cần ai thao tác.
 *
 * Không sửa bản ghi rate cũ bao giờ — mọi thay đổi là một bản ghi mới có khoảng hiệu lực riêng, nhờ
 * vậy luôn trả lời được "ngày X thì khách sạn này chịu mức bao nhiêu".
 */
export class CommissionRateService {
  /**
   * Mức nền toàn sàn có hiệu lực tại một ngày. Chưa có bản ghi nào (hệ thống mới dựng) thì lấy giá
   * trị khởi tạo trong config — env chỉ còn đóng vai trò hạt giống, DB mới là nguồn sự thật.
   */
  getBaseRateAt = async (at: Date, client: Prisma.TransactionClient = prisma): Promise<Prisma.Decimal> => {
    const day = toUtcDate(at);
    const row = await client.commissionRate.findFirst({
      where: {
        hotelId: null,
        effectiveFrom: { lte: day },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: day } }],
      },
      orderBy: { effectiveFrom: 'desc' },
    });
    return row?.rate ?? new Prisma.Decimal(config.partner.defaultCommissionRate);
  };

  /** Ưu đãi riêng của một khách sạn còn hiệu lực tại một ngày (null nếu không có). */
  getAgreementAt = async (hotelId: string, at: Date, client: Prisma.TransactionClient = prisma) => {
    const day = toUtcDate(at);
    return client.commissionRate.findFirst({
      where: {
        hotelId,
        effectiveFrom: { lte: day },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: day } }],
      },
      orderBy: { effectiveFrom: 'desc' },
    });
  };

  /**
   * Mức hoa hồng áp cho một khách sạn tại một thời điểm — HÀM DUY NHẤT mọi nơi tính tiền phải gọi.
   *
   * Mốc `at` là NGÀY THANH TOÁN (lúc khoản hoa hồng thực sự phát sinh), thống nhất với cách báo cáo
   * doanh thu xếp commission vào kỳ tiền về.
   */
  resolveRate = async (
    hotelId: string,
    at: Date,
    client: Prisma.TransactionClient = prisma
  ): Promise<Prisma.Decimal> => {
    const agreement = await this.getAgreementAt(hotelId, at, client);
    return agreement?.rate ?? this.getBaseRateAt(at, client);
  };

  /**
   * Bức tranh mức hoa hồng hiện tại của một khách sạn cho màn hình đối tác: đang chịu bao nhiêu, do
   * ưu đãi hay mức nền, còn bao nhiêu ngày, và sau khi hết hạn sẽ về mức nào.
   */
  getHotelRateSummary = async (hotelId: string, currentUser: User) => {
    await hotelService.getManagedHotel(hotelId, currentUser);
    const today = toUtcDate(new Date());
    const [agreement, baseRate] = await Promise.all([
      this.getAgreementAt(hotelId, today),
      this.getBaseRateAt(today),
    ]);

    // Mức nền áp cho NGÀY SAU KHI ưu đãi hết hạn — không phải mức nền hôm nay. Nếu PM đã lên lịch
    // đổi nền trước ngày đó thì đây mới là con số đối tác thực sự sẽ chịu.
    const rateAfterExpiry = agreement?.effectiveTo
      ? await this.getBaseRateAt(addDays(agreement.effectiveTo, 1))
      : null;

    const pendingRequest = await prisma.commissionRateRequest.findFirst({
      where: { hotelId, status: 'pending' },
      include: requestInclude,
    });

    return {
      currentRate: agreement?.rate ?? baseRate,
      source: agreement ? 'hotel_agreement' : 'platform_base',
      baseRate,
      agreement: agreement
        ? {
            id: agreement.id,
            rate: agreement.rate,
            effectiveFrom: agreement.effectiveFrom,
            effectiveTo: agreement.effectiveTo,
            daysRemaining: agreement.effectiveTo ? daysBetween(today, agreement.effectiveTo) : null,
            rateAfterExpiry,
          }
        : null,
      pendingRequest,
      canRequest: await this.checkCanRequest(hotelId, agreement),
    };
  };

  /**
   * Vì sao khách sạn (chưa) được nộp đơn. Trả lý do thay vì chỉ true/false để giao diện nói rõ với
   * đối tác thay vì chỉ khoá nút.
   */
  private checkCanRequest = async (
    hotelId: string,
    agreement: { effectiveTo: Date | null } | null
  ): Promise<{ allowed: boolean; reason: string | null; isRenewal: boolean }> => {
    const pending = await prisma.commissionRateRequest.count({ where: { hotelId, status: 'pending' } });
    if (pending > 0) {
      return { allowed: false, reason: 'Đã có một đơn đang chờ duyệt cho khách sạn này', isRenewal: false };
    }

    const lastRejected = await prisma.commissionRateRequest.findFirst({
      where: { hotelId, status: 'rejected' },
      orderBy: { reviewedAt: 'desc' },
    });
    if (lastRejected?.reviewedAt) {
      const waited = daysBetween(lastRejected.reviewedAt, new Date());
      if (waited < REJECT_COOLDOWN_DAYS) {
        return {
          allowed: false,
          reason: `Đơn trước vừa bị từ chối, vui lòng đợi thêm ${REJECT_COOLDOWN_DAYS - waited} ngày`,
          isRenewal: false,
        };
      }
    }

    // Đang có ưu đãi: chỉ mở cửa cho đơn GIA HẠN khi sắp hết hạn, không cho xin giảm sâu thêm giữa kỳ
    if (agreement) {
      const daysLeft = agreement.effectiveTo ? daysBetween(new Date(), agreement.effectiveTo) : null;
      if (daysLeft === null || daysLeft > RENEWAL_WINDOW_DAYS) {
        return {
          allowed: false,
          reason: `Đang áp dụng mức ưu đãi, chỉ được xin gia hạn khi còn ${RENEWAL_WINDOW_DAYS} ngày trước ngày hết hạn`,
          isRenewal: false,
        };
      }
      return { allowed: true, reason: null, isRenewal: true };
    }

    return { allowed: true, reason: null, isRenewal: false };
  };

  /**
   * [Đối tác] Nộp đơn xin giảm hoa hồng cho một khách sạn. Chỉ được xin THẤP HƠN mức đang áp và
   * không dưới sàn cứng; mỗi khách sạn một đơn chờ tại một thời điểm.
   */
  createRequest = async (hotelId: string, currentUser: User, payload: CreateCommissionRequestDto) => {
    await hotelService.getManagedHotel(hotelId, currentUser);
    const today = toUtcDate(new Date());
    const agreement = await this.getAgreementAt(hotelId, today);

    const gate = await this.checkCanRequest(hotelId, agreement);
    if (!gate.allowed) {
      throw new ApiError(httpStatus.BAD_REQUEST, gate.reason ?? 'Chưa thể nộp đơn lúc này');
    }

    // Mức để đối chiếu = mức khách sạn SẼ chịu nếu đơn này không được duyệt.
    //  - Đơn thường: chính mức đang áp (khi không có ưu đãi thì đó là mức nền).
    //  - Đơn gia hạn: mức nền của ngày SAU KHI ưu đãi hiện tại hết hạn — không phải mức ưu đãi đang
    //    hưởng. So với mức ưu đãi cũ sẽ chặn oan: đang hưởng 12%, sắp rơi về nền 15%, xin gia hạn
    //    13% vẫn là xin giảm so với cái sắp tới nhưng lại cao hơn 12%.
    const currentRate =
      gate.isRenewal && agreement?.effectiveTo
        ? await this.getBaseRateAt(addDays(agreement.effectiveTo, 1))
        : agreement?.rate ?? (await this.getBaseRateAt(today));
    const requestedRate = new Prisma.Decimal(payload.requestedRate);
    if (requestedRate.greaterThanOrEqualTo(currentRate)) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        gate.isRenewal
          ? `Mức đề xuất phải thấp hơn mức chung sẽ áp sau khi ưu đãi hiện tại hết hạn (${currentRate.toString()}%)`
          : `Mức đề xuất phải thấp hơn mức đang áp dụng (${currentRate.toString()}%)`
      );
    }
    if (requestedRate.lessThan(MIN_RATE)) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Mức đề xuất không được thấp hơn ${MIN_RATE}%`);
    }

    return prisma.commissionRateRequest.create({
      data: {
        hotelId,
        requestedBy: currentUser.id,
        requestedRate,
        currentRate,
        reason: payload.reason,
        status: 'pending',
        isRenewal: gate.isRenewal,
      },
      include: requestInclude,
    });
  };

  /** [Đối tác] Lịch sử đơn của một khách sạn. */
  listHotelRequests = async (
    hotelId: string,
    currentUser: User,
    filter: CommissionRequestFilter,
    options: CommissionRequestQueryOptions
  ) => {
    await hotelService.getManagedHotel(hotelId, currentUser);
    return this.paginateRequests({ hotelId, ...(filter.status && { status: filter.status }) }, options);
  };

  /** [Platform Manager] Hàng chờ toàn sàn, mặc định đơn cũ nhất trước để không ai bị bỏ quên. */
  listRequests = async (filter: CommissionRequestFilter, options: CommissionRequestQueryOptions) => {
    const where: Prisma.CommissionRateRequestWhereInput = {};
    if (filter.status) {
      where.status = filter.status;
    }
    if (filter.hotelId) {
      where.hotelId = filter.hotelId;
    }
    return this.paginateRequests(where, options, 'asc');
  };

  private paginateRequests = async (
    where: Prisma.CommissionRateRequestWhereInput,
    options: CommissionRequestQueryOptions,
    order: 'asc' | 'desc' = 'desc'
  ) => {
    const limit = options.limit || 20;
    const page = options.page || 1;
    const [results, totalResults] = await prisma.$transaction([
      prisma.commissionRateRequest.findMany({
        where,
        include: requestInclude,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: order },
      }),
      prisma.commissionRateRequest.count({ where }),
    ]);
    return { results, page, limit, totalPages: Math.ceil(totalResults / limit), totalResults };
  };

  /**
   * [Platform Manager] Duyệt hoặc từ chối một đơn.
   *
   * Duyệt ⇒ sinh bản ghi ưu đãi 12 tháng. Đơn gia hạn bắt đầu từ NGÀY SAU KHI ưu đãi cũ hết hạn
   * (không cắt ngắn phần đối tác đang được hưởng); đơn thường bắt đầu ngay hôm duyệt.
   * Không bao giờ hồi tố — hoa hồng đã ghi nhận không bị tính lại.
   */
  reviewRequest = async (requestId: string, currentUser: User, payload: ReviewCommissionRequestDto) => {
    const request = await prisma.commissionRateRequest.findUnique({
      where: { id: requestId },
      include: { hotel: { select: { id: true, name: true, partner: { select: { ownerId: true } } } } },
    });
    if (!request) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy đơn');
    }
    if (request.status !== 'pending') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Đơn này đã được xử lý');
    }

    const reviewedAt = new Date();
    if (payload.decision === 'reject') {
      const updated = await prisma.$transaction(async (tx) => {
        const rejected = await tx.commissionRateRequest.update({
          where: { id: requestId },
          data: {
            status: 'rejected',
            reviewedBy: currentUser.id,
            reviewedAt,
            rejectionReason: payload.rejectionReason ?? null,
          },
          include: requestInclude,
        });
        await tx.notification.create({
          data: {
            userId: request.hotel.partner.ownerId,
            type: 'alert',
            title: 'Đơn xin giảm hoa hồng bị từ chối',
            body:
              `Đơn xin mức ${request.requestedRate.toString()}% cho ${request.hotel.name} không được duyệt. ` +
              `Lý do: ${payload.rejectionReason ?? 'không nêu'}. Bạn có thể nộp lại sau ${REJECT_COOLDOWN_DAYS} ngày.`,
            data: { requestId, hotelId: request.hotelId },
            channel: 'in_app',
            status: 'sent',
            sentAt: reviewedAt,
          },
        });
        return rejected;
      });
      await auditService.log({
        userId: currentUser.id,
        action: 'commission_request.reject',
        entityType: 'commission_rate_request',
        entityId: requestId,
        oldValue: { status: 'pending' },
        newValue: { status: 'rejected', rejectionReason: payload.rejectionReason ?? null },
      });
      return updated;
    }

    // ----- Duyệt -----
    const today = toUtcDate(reviewedAt);
    const currentAgreement = await this.getAgreementAt(request.hotelId, today);
    const effectiveFrom =
      request.isRenewal && currentAgreement?.effectiveTo
        ? addDays(currentAgreement.effectiveTo, 1)
        : today;
    // Trọn 12 tháng: bắt đầu 05/08/2026 ⇒ kết thúc 04/08/2027
    const effectiveTo = addDays(addMonths(effectiveFrom, AGREEMENT_MONTHS), -1);

    const updated = await prisma.$transaction(async (tx) => {
      const approved = await tx.commissionRateRequest.update({
        where: { id: requestId },
        data: { status: 'approved', reviewedBy: currentUser.id, reviewedAt, rejectionReason: null },
      });
      await tx.commissionRate.create({
        data: {
          hotelId: request.hotelId,
          rate: request.requestedRate,
          effectiveFrom,
          effectiveTo,
          source: 'hotel_agreement',
          requestId,
          createdBy: currentUser.id,
        },
      });
      await tx.notification.create({
        data: {
          userId: request.hotel.partner.ownerId,
          type: 'alert',
          title: 'Đơn xin giảm hoa hồng đã được duyệt',
          body:
            `${request.hotel.name} được áp mức ${request.requestedRate.toString()}% từ ` +
            `${effectiveFrom.toISOString().slice(0, 10)} đến ${effectiveTo.toISOString().slice(0, 10)}. ` +
            `Hết hạn sẽ tự trở về mức hoa hồng chung của nền tảng.`,
          data: { requestId, hotelId: request.hotelId },
          channel: 'in_app',
          status: 'sent',
          sentAt: reviewedAt,
        },
      });
      return approved;
    });

    await auditService.log({
      userId: currentUser.id,
      action: 'commission_request.approve',
      entityType: 'commission_rate_request',
      entityId: requestId,
      oldValue: { status: 'pending', rate: request.currentRate.toString() },
      newValue: {
        status: 'approved',
        rate: request.requestedRate.toString(),
        effectiveFrom: effectiveFrom.toISOString().slice(0, 10),
        effectiveTo: effectiveTo.toISOString().slice(0, 10),
      },
    });

    return prisma.commissionRateRequest.findUniqueOrThrow({ where: { id: updated.id }, include: requestInclude });
  };

  /** [Platform Manager] Mức nền đang áp + lịch sử + mức đã lên lịch cho tương lai. */
  getBaseRateHistory = async () => {
    const today = toUtcDate(new Date());
    const [current, history] = await Promise.all([
      this.getBaseRateAt(today),
      prisma.commissionRate.findMany({
        where: { hotelId: null },
        include: { createdByUser: { select: { id: true, fullName: true, email: true } } },
        orderBy: { effectiveFrom: 'desc' },
      }),
    ]);
    const scheduled = history.find((row) => row.effectiveFrom > today) ?? null;
    return { currentRate: current, scheduled, history, minRate: MIN_RATE, maxRate: MAX_RATE };
  };

  /**
   * [Platform Manager] Đặt mức nền mới cho toàn sàn, áp từ một ngày trong tương lai.
   *
   * Bắt buộc báo trước 30 ngày vì đây là thay đổi điều khoản với mọi đối tác. Mức nền đang chạy được
   * đóng lại đúng hôm trước ngày hiệu lực để hai khoảng không chồng nhau.
   *
   * KHÔNG đụng tới các ưu đãi riêng đang còn hạn — đó là cam kết đã ký, chỉ hết hạn mới rơi về nền mới.
   */
  setBaseRate = async (currentUser: User, payload: SetBaseRateDto) => {
    const rate = new Prisma.Decimal(payload.rate);
    if (rate.lessThan(MIN_RATE) || rate.greaterThan(MAX_RATE)) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Mức hoa hồng nền phải nằm trong khoảng ${MIN_RATE}%–${MAX_RATE}%`);
    }

    const effectiveFrom = toUtcDate(new Date(payload.effectiveFrom));
    const earliest = addDays(toUtcDate(new Date()), BASE_RATE_NOTICE_DAYS);
    if (effectiveFrom < earliest) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Phải báo trước ít nhất ${BASE_RATE_NOTICE_DAYS} ngày — ngày áp dụng sớm nhất là ${earliest
          .toISOString()
          .slice(0, 10)}`
      );
    }

    const today = toUtcDate(new Date());
    const created = await prisma.$transaction(async (tx) => {
      // Thay thế lịch cũ nếu PM đổi ý trước khi nó có hiệu lực — bản ghi chưa từng áp cho đồng nào
      await tx.commissionRate.deleteMany({ where: { hotelId: null, effectiveFrom: { gt: today } } });

      const running = await tx.commissionRate.findFirst({
        where: { hotelId: null, effectiveFrom: { lte: today }, OR: [{ effectiveTo: null }, { effectiveTo: { gte: today } }] },
        orderBy: { effectiveFrom: 'desc' },
      });
      if (running) {
        await tx.commissionRate.update({
          where: { id: running.id },
          data: { effectiveTo: addDays(effectiveFrom, -1) },
        });
      }

      const row = await tx.commissionRate.create({
        data: {
          hotelId: null,
          rate,
          effectiveFrom,
          effectiveTo: null,
          source: 'platform_base',
          createdBy: currentUser.id,
        },
      });

      // Báo cho mọi chủ đối tác đang hoạt động — kể cả bên đang có ưu đãi, vì họ cần biết mức sẽ
      // rơi vào sau khi ưu đãi của mình hết hạn.
      const owners = await tx.hotelPartner.findMany({
        where: { status: 'approved', deletedAt: null },
        select: { ownerId: true },
      });
      const sentAt = new Date();
      const ownerIds = [...new Set(owners.map((o) => o.ownerId))];
      if (ownerIds.length > 0) {
        await tx.notification.createMany({
          data: ownerIds.map((ownerId) => ({
            userId: ownerId,
            type: 'alert' as const,
            title: 'Thay đổi mức hoa hồng của nền tảng',
            body:
              `Từ ngày ${effectiveFrom.toISOString().slice(0, 10)}, mức hoa hồng chung của nền tảng là ` +
              `${rate.toString()}%. Các thoả thuận ưu đãi đang còn hiệu lực vẫn được giữ nguyên đến hết hạn.`,
            data: { rateId: row.id, effectiveFrom: effectiveFrom.toISOString().slice(0, 10) },
            channel: 'in_app' as const,
            status: 'sent' as const,
            sentAt,
          })),
        });
      }
      return row;
    });

    await auditService.log({
      userId: currentUser.id,
      action: 'commission_base_rate.set',
      entityType: 'commission_rate',
      entityId: created.id,
      oldValue: { rate: (await this.getBaseRateAt(today)).toString() },
      newValue: { rate: rate.toString(), effectiveFrom: effectiveFrom.toISOString().slice(0, 10) },
    });
    return created;
  };

  /**
   * [Cron] Nhắc các khách sạn sắp hết ưu đãi ở mốc 30 / 14 / 7 ngày.
   *
   * Con số trong thông báo là mức nền của NGÀY SAU KHI hết hạn, không phải mức nền hôm gửi — nếu PM
   * đã lên lịch đổi nền thì đối tác cần biết đúng con số mình sắp chịu.
   *
   * `lastReminderDaysBefore` chặn gửi trùng: cron chạy hằng ngày, không có cột này thì một ưu đãi
   * sắp hết hạn sẽ bị bắn thông báo mỗi ngày suốt 30 ngày.
   *
   * @returns số thông báo đã gửi
   */
  remindExpiringAgreements = async (): Promise<number> => {
    const today = toUtcDate(new Date());
    const horizon = addDays(today, REMINDER_DAYS[0]);
    const agreements = await prisma.commissionRate.findMany({
      where: {
        hotelId: { not: null },
        source: 'hotel_agreement',
        effectiveTo: { gte: today, lte: horizon },
      },
      include: { hotel: { select: { id: true, name: true, partner: { select: { ownerId: true } } } } },
    });

    let sent = 0;
    for (const agreement of agreements) {
      if (!agreement.effectiveTo || !agreement.hotel) {
        continue;
      }
      const daysLeft = daysBetween(today, agreement.effectiveTo);
      // Mốc gần nhất còn "phủ" số ngày còn lại: còn 20 ngày ⇒ mốc 30; còn 10 ⇒ mốc 14; còn 3 ⇒ mốc 7
      const milestone = [...REMINDER_DAYS].reverse().find((m) => daysLeft <= m);
      if (milestone === undefined) {
        continue;
      }
      // Đã gửi mốc này (hoặc mốc gần hơn) rồi thì thôi
      if (agreement.lastReminderDaysBefore !== null && agreement.lastReminderDaysBefore <= milestone) {
        continue;
      }

      // eslint-disable-next-line no-await-in-loop
      const baseRate = await this.getBaseRateAt(addDays(agreement.effectiveTo, 1));
      // eslint-disable-next-line no-await-in-loop
      await prisma.$transaction(async (tx) => {
        await tx.notification.create({
          data: {
            userId: agreement.hotel!.partner.ownerId,
            type: 'alert',
            title: `Ưu đãi hoa hồng sắp hết hạn (còn ${daysLeft} ngày)`,
            body:
              `Mức ${agreement.rate.toString()}% của ${agreement.hotel!.name} hết hiệu lực ngày ` +
              `${agreement.effectiveTo!.toISOString().slice(0, 10)}, sau đó áp mức chung ${baseRate.toString()}%. ` +
              `Bạn có thể nộp đơn xin gia hạn ngay từ bây giờ.`,
            data: {
              hotelId: agreement.hotelId,
              agreementId: agreement.id,
              expiresOn: agreement.effectiveTo!.toISOString().slice(0, 10),
              rateAfterExpiry: baseRate.toString(),
            },
            channel: 'in_app',
            status: 'sent',
            sentAt: new Date(),
          },
        });
        await tx.commissionRate.update({
          where: { id: agreement.id },
          data: { lastReminderDaysBefore: milestone },
        });
      });
      sent += 1;
    }
    return sent;
  };
}

export const commissionRateService = new CommissionRateService();

export type { CommissionRequestStatus };
