import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import type { DealFilter } from '../dto/promotion.dto';
import { availabilityService } from './availability.service';
import { toUtcDate } from '../utils/dates';

// Còn dưới ngần này giờ tới lúc hết hạn ⇒ đánh dấu 'flash_sale' để FE hiện countdown.
const FLASH_SALE_WINDOW_HOURS = 48;

export class PromotionService {
  /**
   * Danh sách deal CÔNG KHAI cho trang /deals của guest.
   *
   * Deal = khách sạn đang có **PricingRule GIẢM GIÁ** (adjustmentValue < 0) hiệu lực HÔM NAY. Giá deal
   * được tính bằng CHÍNH engine giá phòng (getStayQuotes) cho đêm nay + thuế/phí, nên nó ĐÚNG BẰNG số
   * khách thấy khi bấm vào khách sạn với đúng ngày — hết cảnh "deal một giá, đặt một giá khác".
   *
   * Chủ khách sạn tự tạo rule giảm giá ở phần pricing rule; giảm được TRỪ THẲNG vào giá phòng, không
   * cần nhập mã. (Không còn dùng model Promotion cho trang deal.)
   */
  listPublicDeals = async (filter: DealFilter) => {
    const limit = filter.limit || 20;
    const now = new Date();
    const today = toUtcDate(now);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    // 1) Các rule GIẢM GIÁ (adjustmentValue < 0) đang bật + còn trong hạn HÔM NAY, của KS đang mở bán.
    //    Đây chỉ là bước lọc thô theo cửa sổ ngày; việc rule có thật sự áp cho đêm nay hay không
    //    (dayOfWeek, occupancy, priority so với rule phụ thu) do engine giá phòng quyết định bên dưới.
    const discountRules = await prisma.pricingRule.findMany({
      where: {
        isActive: true,
        adjustmentValue: { lt: 0 },
        startDate: { lte: today },
        endDate: { gte: today },
        hotel: {
          isActive: true,
          isListed: true,
          deletedAt: null,
          ...(filter.city && { city: { contains: filter.city, mode: 'insensitive' } }),
        },
      },
      select: { hotelId: true, name: true, endDate: true },
    });
    if (discountRules.length === 0) {
      return [];
    }

    // Rule đại diện cho mỗi KS = rule hết hạn SỚM nhất — để countdown/flash sale bám cái sắp hết trước.
    const ruleByHotel = new Map<string, { name: string; endDate: Date }>();
    for (const rule of discountRules) {
      const current = ruleByHotel.get(rule.hotelId);
      if (!current || rule.endDate < current.endDate) {
        ruleByHotel.set(rule.hotelId, { name: rule.name, endDate: rule.endDate });
      }
    }
    const hotelIds = [...ruleByHotel.keys()];

    const [hotels, taxFeeByHotel] = await Promise.all([
      prisma.hotel.findMany({
        where: { id: { in: hotelIds } },
        select: {
          id: true,
          name: true,
          city: true,
          images: { where: { isPrimary: true }, take: 1, select: { url: true } },
          roomTypes: { where: { isActive: true }, select: { id: true, hotelId: true, basePrice: true } },
        },
      }),
      availabilityService.getTaxFeeCharges(hotelIds),
    ]);

    const deals = await Promise.all(
      hotels.map(async (hotel) => {
        if (hotel.roomTypes.length === 0) {
          return null;
        }
        // Giá đêm nay đã áp pricing rule (kể cả rule giảm) cho từng loại phòng.
        const quotes = await availabilityService.getStayQuotes(hotel.roomTypes, today, tomorrow);
        const charges = taxFeeByHotel.get(hotel.id) ?? [];

        // Chọn phòng có giá đêm nay (đã áp rule + thuế/phí) THẤP nhất và PHẢI thực sự giảm so với giá gốc.
        // Giá "từ" gồm thuế/phí (1 đêm, 1 khách) để khớp đúng con số ở thẻ phòng trang chi tiết.
        let originalIncl: Prisma.Decimal | null = null;
        let discountedIncl: Prisma.Decimal | null = null;
        for (const room of hotel.roomTypes) {
          const quote = quotes.get(room.id);
          if (!quote || quote.availableRooms <= 0) {
            continue;
          }
          const baseSubtotal = room.basePrice; // giá gốc 1 đêm (chưa rule)
          const dealSubtotal = quote.totalPrice; // giá 1 đêm đã áp rule
          if (!dealSubtotal.lessThan(baseSubtotal)) {
            continue; // đêm nay không được giảm (rule không khớp / bị rule phụ thu ưu tiên hơn) ⇒ bỏ phòng này
          }
          const baseTf = availabilityService.computeTaxAndFees(charges, baseSubtotal, 1, 1);
          const dealTf = availabilityService.computeTaxAndFees(charges, dealSubtotal, 1, 1);
          const dealTotal = dealSubtotal.add(dealTf.taxAmount).add(dealTf.feeAmount);
          if (discountedIncl === null || dealTotal.lessThan(discountedIncl)) {
            discountedIncl = dealTotal;
            originalIncl = baseSubtotal.add(baseTf.taxAmount).add(baseTf.feeAmount);
          }
        }
        if (originalIncl === null || discountedIncl === null) {
          return null; // KS này rule không áp được cho đêm nay / hết phòng ⇒ chưa phải deal hôm nay
        }

        const rule = ruleByHotel.get(hotel.id)!;
        const hoursToExpiry = (rule.endDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        return {
          hotelId: hotel.id,
          hotelName: hotel.name,
          city: hotel.city,
          image: hotel.images[0]?.url ?? null,
          name: rule.name,
          originalPrice: originalIncl.toDecimalPlaces(0).toString(),
          discountedPrice: discountedIncl.toDecimalPlaces(0).toString(),
          // % giảm THỰC TẾ tính trên chính hai con số hiển thị (đã gồm thuế/phí) để badge khớp giá.
          discountPercent: Math.round(originalIncl.sub(discountedIncl).div(originalIncl).mul(100).toNumber()),
          dealType: hoursToExpiry <= FLASH_SALE_WINDOW_HOURS ? ('flash_sale' as const) : ('standard' as const),
          // Ngày mà giá deal áp dụng — FE nên gắn vào link "Xem khách sạn" để trang chi tiết hiện đúng giá này.
          checkIn: today.toISOString().slice(0, 10),
          checkOut: tomorrow.toISOString().slice(0, 10),
          expiresAt: rule.endDate,
        };
      })
    );

    return deals
      .filter((deal): deal is NonNullable<typeof deal> => deal !== null && deal.discountPercent > 0)
      .sort((a, b) => b.discountPercent - a.discountPercent)
      .slice(0, limit);
  };
}

export const promotionService = new PromotionService();
