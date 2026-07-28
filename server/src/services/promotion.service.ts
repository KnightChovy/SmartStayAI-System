import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import type { DealFilter } from '../dto/promotion.dto';

// Còn dưới ngần này giờ tới lúc hết hạn ⇒ đánh dấu 'flash_sale' để FE hiện countdown.
// Suy từ endDate nên KHÔNG cần thêm cột deal_type vào schema.
const FLASH_SALE_WINDOW_HOURS = 48;

export class PromotionService {
  /**
   * Danh sách deal CÔNG KHAI cho trang /deals — mỗi deal là một Promotion đang hiệu lực của một
   * khách sạn đang mở bán, kèm giá gốc / giá sau giảm / % giảm để FE dựng thẻ deal.
   *
   * Chỉ lấy promotion: đang bật, trong khoảng ngày, chưa hết lượt dùng, và của KS đang bán.
   */
  listPublicDeals = async (filter: DealFilter) => {
    const limit = filter.limit || 20;
    const now = new Date();

    const promotions = await prisma.promotion.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
        hotel: {
          isActive: true,
          isListed: true,
          deletedAt: null,
          ...(filter.city && { city: { contains: filter.city, mode: 'insensitive' } }),
        },
      },
      include: {
        hotel: {
          select: {
            id: true,
            name: true,
            city: true,
            images: { where: { isPrimary: true }, take: 1, select: { url: true } },
            roomTypes: { where: { isActive: true }, select: { id: true, basePrice: true } },
          },
        },
      },
      orderBy: { endDate: 'asc' },
    });

    const deals = promotions
      // Hết lượt dùng thì không còn là deal (maxUses null = không giới hạn)
      .filter((promo) => promo.maxUses === null || promo.usedCount < promo.maxUses)
      .map((promo) => {
        // Giá gốc = basePrice thấp nhất trong các loại phòng được áp (rỗng = áp cho cả khách sạn)
        const applicable =
          promo.applicableRoomTypeIds.length > 0
            ? promo.hotel.roomTypes.filter((rt) => promo.applicableRoomTypeIds.includes(rt.id))
            : promo.hotel.roomTypes;
        if (applicable.length === 0) {
          return null; // Không còn phòng nào để áp ⇒ bỏ deal này
        }
        const originalPrice = Prisma.Decimal.min(...applicable.map((rt) => rt.basePrice));
        const { discountedPrice, discountPercent } = this.computeDealPrice(promo, originalPrice);

        const hoursToExpiry = (promo.endDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        return {
          promotionId: promo.id,
          hotelId: promo.hotel.id,
          hotelName: promo.hotel.name,
          city: promo.hotel.city,
          image: promo.hotel.images[0]?.url ?? null,
          code: promo.code,
          name: promo.name,
          originalPrice: originalPrice.toString(),
          discountedPrice: discountedPrice.toString(),
          discountPercent,
          dealType: hoursToExpiry <= FLASH_SALE_WINDOW_HOURS ? ('flash_sale' as const) : ('standard' as const),
          expiresAt: promo.endDate,
        };
      })
      .filter((deal): deal is NonNullable<typeof deal> => deal !== null);

    // Giảm nhiều nhất lên đầu — trang deal muốn khoe con số hấp dẫn nhất trước
    deals.sort((a, b) => b.discountPercent - a.discountPercent);
    return deals.slice(0, limit);
  };

  /**
   * Giá sau giảm + % giảm THỰC TẾ theo loại giảm giá.
   * - percentage: giảm thẳng theo %.
   * - fixed_amount: trừ số tiền cố định, chặn không âm.
   * - free_night: "ở minNights đêm được miễn discountValue đêm" ⇒ quy về % giảm hiệu dụng trên
   *   cả kỳ ở tối thiểu, để thẻ deal vẫn hiện được một con số % nhất quán với hai loại kia.
   */
  private computeDealPrice = (
    promo: { discountType: string; discountValue: Prisma.Decimal; minNights: number | null },
    originalPrice: Prisma.Decimal
  ): { discountedPrice: Prisma.Decimal; discountPercent: number } => {
    if (promo.discountType === 'percentage') {
      const percent = Math.round(promo.discountValue.toNumber());
      const discountedPrice = originalPrice.mul(new Prisma.Decimal(100).sub(promo.discountValue)).div(100).toDecimalPlaces(0);
      return { discountedPrice, discountPercent: percent };
    }

    if (promo.discountType === 'fixed_amount') {
      const raw = originalPrice.sub(promo.discountValue);
      const discountedPrice = raw.isNegative() ? new Prisma.Decimal(0) : raw.toDecimalPlaces(0);
      const percent = originalPrice.isZero()
        ? 0
        : Math.round(originalPrice.sub(discountedPrice).div(originalPrice).mul(100).toNumber());
      return { discountedPrice, discountPercent: percent };
    }

    // free_night: số đêm miễn / số đêm phải ở. Thiếu minNights thì coi như "ở 2 miễn 1".
    const freeNights = promo.discountValue.toNumber() || 1;
    const qualifyNights = promo.minNights && promo.minNights > freeNights ? promo.minNights : freeNights + 1;
    const percent = Math.round((freeNights / qualifyNights) * 100);
    const discountedPrice = originalPrice.mul(100 - percent).div(100).toDecimalPlaces(0);
    return { discountedPrice, discountPercent: percent };
  };
}

export const promotionService = new PromotionService();
