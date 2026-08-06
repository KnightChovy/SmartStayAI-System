import { Prisma } from '@prisma/client';
import type { PricingRule, ChargeType, ChargeFrequency } from '@prisma/client';
import prisma from '../config/prisma';
import { toUtcDate, eachNightOfStay, todayInVietnamDate } from '../utils/dates';

/** Một khoản thu của khách sạn (thuế hoặc phí), đủ để tính ra tiền. */
export interface TaxFeeCharge {
  chargeType: ChargeType;
  amount: Prisma.Decimal;
  isPercentage: boolean;
  chargeFrequency: ChargeFrequency | null;
}

/** Thuế + phí dịch vụ của một kỳ ở, tách riêng để hiển thị bảng phân tích giá. */
export interface TaxFeeBreakdown {
  taxAmount: Prisma.Decimal;
  feeAmount: Prisma.Decimal;
}

/** Loại phòng cần báo giá: id + khách sạn (để khớp pricing rule) + giá gốc mỗi đêm. */
export interface RoomTypePriceInput {
  id: string;
  hotelId: string;
  basePrice: Prisma.Decimal;
}

/** Trạng thái tồn kho của một đêm (dòng room_availability nếu có). */
export interface NightInventory {
  totalRooms: number;
  bookedRooms: number;
  priceOverride: Prisma.Decimal | null;
}

/**
 * Điều kiện "phòng còn thuộc biên chế khách sạn". Đây là phần KHÔNG phụ thuộc ngày; phần phụ thuộc
 * ngày (phòng bị chặn để sửa) nằm ở countSellableRoomsPerDate.
 *
 * KHÔNG lọc theo rooms.status nữa. Status là tình trạng của HÔM NAY: phòng đang có khách hay đang
 * dọn vẫn bán được cho những đêm sau (và lượt khách đó đã đếm ở bookedRooms rồi, trừ thêm là trừ
 * hai lần). Còn "đang sửa" thì có khoảng ngày riêng — phòng hỏng 10–12/08 không có lý do gì làm mất
 * doanh thu ngày 20/08.
 */
export const ACTIVE_ROOM_WHERE: Prisma.RoomWhereInput = { isActive: true };

/** Kết quả tồn kho + giá cho một khoảng ngày ở của một loại phòng. */
export interface StayQuote {
  /** Số phòng còn trống thấp nhất trong suốt các đêm (đặt được tối đa bấy nhiêu phòng) */
  availableRooms: number;
  /** Tổng giá cả kỳ ở = cộng giá từng đêm sau khi áp pricing rule */
  totalPrice: Prisma.Decimal;
}

/**
 * Tính tồn kho + giá phòng, dùng chung cho tìm khách sạn / tìm phòng / đặt phòng. Đây là nơi DUY
 * NHẤT quyết định giá, để số báo cho khách lúc tìm phòng và số bị tính lúc đặt không thể lệch nhau.
 *
 * Tồn kho: bảng room_availability (mỗi dòng = 1 loại phòng × 1 đêm). Đêm chưa có dòng nghĩa là
 * chưa ai đặt ⇒ còn nguyên số phòng BÁN ĐƯỢC (đếm bảng rooms, bỏ phòng bảo trì — xem
 * SELLABLE_ROOM_WHERE). Cột available_rooms không dùng (luôn suy từ totalRooms - bookedRooms
 * để khỏi lệch dữ liệu).
 *
 * Giá một đêm: (priceOverride của đêm đó ?? basePrice) rồi áp pricing rule (xem priceForNight).
 * Thuế/phí tính trên tiền phòng cả kỳ ở (xem computeTaxAndFees).
 */
export class AvailabilityService {
  /** Các khoản thu (thuế/phí) của những khách sạn cần báo giá, gom theo hotelId. */
  getTaxFeeCharges = async (hotelIds: string[]): Promise<Map<string, TaxFeeCharge[]>> => {
    const byHotel = new Map<string, TaxFeeCharge[]>();
    if (hotelIds.length === 0) {
      return byHotel;
    }
    const rows = await prisma.hotelCharge.findMany({
      where: { hotelId: { in: hotelIds } },
      select: { hotelId: true, chargeType: true, amount: true, isPercentage: true, chargeFrequency: true },
    });
    for (const row of rows) {
      const list = byHotel.get(row.hotelId) ?? [];
      list.push(row);
      byHotel.set(row.hotelId, list);
    }
    return byHotel;
  };

  /**
   * Tính thuế + phí dịch vụ từ các khoản thu (HotelCharge) của khách sạn.
   *
   * Mỗi khoản có:
   *  - isPercentage = true  ⇒ amount là PHẦN TRĂM tính trên tiền phòng (subtotal); chargeFrequency
   *    KHÔNG dùng tới, vì subtotal đã gồm đủ số đêm rồi — nhân tiếp là tính thuế chồng thuế.
   *  - isPercentage = false ⇒ amount là số tiền tuyệt đối, nhân theo chargeFrequency:
   *      per_stay             × 1
   *      per_night            × số đêm
   *      per_person           × số khách
   *      per_person_per_night × số khách × số đêm
   *
   * Tiền cọc KHÔNG nằm ở đây: đó là khoản thu/trả tại khách sạn, không cộng vào giá đơn — nó chỉ là
   * một điều khoản mô tả trong HotelPolicy.
   */
  computeTaxAndFees = (
    charges: TaxFeeCharge[],
    subtotal: Prisma.Decimal,
    numNights: number,
    numGuests: number
  ): TaxFeeBreakdown => {
    let taxAmount = new Prisma.Decimal(0);
    let feeAmount = new Prisma.Decimal(0);

    for (const charge of charges) {
      let value: Prisma.Decimal;
      if (charge.isPercentage) {
        value = subtotal.mul(charge.amount).div(100);
      } else {
        const multipliers: Record<ChargeFrequency, number> = {
          per_stay: 1,
          per_night: numNights,
          per_person: numGuests,
          per_person_per_night: numGuests * numNights,
        };
        value = charge.amount.mul(multipliers[charge.chargeFrequency ?? 'per_stay']);
      }
      value = value.toDecimalPlaces(2);
      if (charge.chargeType === 'tax') {
        taxAmount = taxAmount.add(value);
      } else {
        feeAmount = feeAmount.add(value);
      }
    }
    return { taxAmount, feeAmount };
  };

  /**
   * Số phòng BÁN ĐƯỢC của từng loại phòng trong từng ngày = số phòng còn dùng được, trừ đi những
   * phòng đang bị chặn OOO trong đúng ngày đó.
   *
   * Chỉ 'ooo' mới trừ — 'oos' là ngưng phục vụ trong ngày (kê lại đồ, giữ phòng), không rút phòng
   * khỏi kho bán. Đếm theo PHÒNG chứ không theo block: một phòng dính hai đợt chặn chồng nhau vẫn
   * chỉ mất đúng một phòng khỏi kho.
   *
   * @returns Map khoá `${roomTypeId}:${date.getTime()}`
   */
  countSellableRoomsPerDate = async (roomTypeIds: string[], dates: Date[]): Promise<Map<string, number>> => {
    const result = new Map<string, number>();
    if (roomTypeIds.length === 0 || dates.length === 0) {
      return result;
    }
    const times = dates.map((date) => date.getTime());
    const first = new Date(Math.min(...times));
    const last = new Date(Math.max(...times));

    const [roomGroups, blocks] = await Promise.all([
      prisma.room.groupBy({
        by: ['roomTypeId'],
        where: { roomTypeId: { in: roomTypeIds }, ...ACTIVE_ROOM_WHERE },
        _count: { _all: true },
      }),
      prisma.roomBlock.findMany({
        where: {
          blockType: 'ooo',
          resolvedAt: null,
          startDate: { lte: last },
          endDate: { gte: first },
          room: { roomTypeId: { in: roomTypeIds }, ...ACTIVE_ROOM_WHERE },
        },
        select: { roomId: true, startDate: true, endDate: true, room: { select: { roomTypeId: true } } },
      }),
    ]);

    const activeRoomCount = new Map(roomGroups.map((group) => [group.roomTypeId, group._count._all]));
    for (const roomTypeId of roomTypeIds) {
      const total = activeRoomCount.get(roomTypeId) ?? 0;
      const blocksOfType = blocks.filter((block) => block.room.roomTypeId === roomTypeId);
      for (const date of dates) {
        const time = date.getTime();
        const blockedRooms = new Set(
          blocksOfType
            .filter((block) => block.startDate.getTime() <= time && block.endDate.getTime() >= time)
            .map((block) => block.roomId)
        );
        result.set(`${roomTypeId}:${time}`, Math.max(0, total - blockedRooms.size));
      }
    }
    return result;
  };

  /** Toàn bộ rule đang bật của các khách sạn — lọc khớp từng đêm bằng JS vì số rule mỗi khách sạn nhỏ. */
  getActivePricingRules = async (hotelIds: string[]): Promise<PricingRule[]> => {
    if (hotelIds.length === 0) {
      return [];
    }
    return prisma.pricingRule.findMany({ where: { hotelId: { in: hotelIds }, isActive: true } });
  };

  /**
   * Một rule áp dụng cho một đêm khi:
   * - đúng khách sạn, và đúng loại phòng (roomTypeId null = áp cho cả khách sạn)
   * - đêm nằm trong [startDate, endDate] — riêng early_bird thì xét NGÀY ĐẶT (hôm nay) vào
   *   cửa sổ đó thay vì đêm ở (đặt sớm trong khoảng khuyến mãi thì được giá ưu đãi)
   * - dayOfWeek rỗng = mọi ngày; ngược lại đêm phải rơi vào các thứ liệt kê (0=CN..6=T7)
   * - rule occupancy chỉ áp khi tỉ lệ phòng đã đặt của đêm đó >= occupancyThreshold (%)
   */
  private ruleMatchesNight = (
    rule: PricingRule,
    roomType: RoomTypePriceInput,
    night: Date,
    inventory: NightInventory | undefined,
    today: Date
  ): boolean => {
    if (rule.hotelId !== roomType.hotelId) {
      return false;
    }
    if (rule.roomTypeId && rule.roomTypeId !== roomType.id) {
      return false;
    }
    const windowDate = rule.ruleType === 'early_bird' ? today : night;
    if (windowDate < toUtcDate(rule.startDate) || windowDate > toUtcDate(rule.endDate)) {
      return false;
    }
    if (rule.dayOfWeek.length > 0 && !rule.dayOfWeek.includes(night.getUTCDay())) {
      return false;
    }
    if (rule.ruleType === 'occupancy') {
      if (!inventory || inventory.totalRooms === 0 || rule.occupancyThreshold === null) {
        return false;
      }
      const occupancyPercent = (inventory.bookedRooms / inventory.totalRooms) * 100;
      if (occupancyPercent < rule.occupancyThreshold) {
        return false;
      }
    }
    return true;
  };

  /**
   * Giá một đêm = (priceOverride ?? basePrice) rồi áp MỘT rule khớp có priority cao nhất
   * (đồng priority thì rule gắn riêng loại phòng thắng rule cả khách sạn). Không cộng dồn
   * nhiều rule để giá luôn giải thích được. Kết quả không âm, làm tròn 2 số lẻ.
   */
  priceForNight = (
    roomType: RoomTypePriceInput,
    night: Date,
    inventory: NightInventory | undefined,
    rules: PricingRule[],
    today: Date
  ): Prisma.Decimal => {
    const base = inventory?.priceOverride ?? roomType.basePrice;
    const matching = rules
      .filter((rule) => this.ruleMatchesNight(rule, roomType, night, inventory, today))
      .sort((a, b) => b.priority - a.priority || Number(Boolean(b.roomTypeId)) - Number(Boolean(a.roomTypeId)));
    if (matching.length === 0) {
      return base;
    }

    const rule = matching[0];
    const adjusted =
      rule.adjustmentType === 'percentage'
        ? base.add(base.mul(rule.adjustmentValue).div(100))
        : base.add(rule.adjustmentValue);
    const rounded = adjusted.toDecimalPlaces(2);
    return rounded.isNegative() ? new Prisma.Decimal(0) : rounded;
  };

  /**
   * Báo giá + số phòng trống cho nhiều loại phòng trong khoảng [checkIn, checkOut).
   * @returns Map theo roomTypeId; loại phòng không còn phòng bán được sẽ có availableRooms = 0
   */
  getStayQuotes = async (
    roomTypes: RoomTypePriceInput[],
    checkIn: Date,
    checkOut: Date
  ): Promise<Map<string, StayQuote>> => {
    const nights = eachNightOfStay(checkIn, checkOut);
    const roomTypeIds = roomTypes.map((rt) => rt.id);
    if (roomTypeIds.length === 0 || nights.length === 0) {
      return new Map();
    }

    const hotelIds = [...new Set(roomTypes.map((rt) => rt.hotelId))];
    const [sellableByNight, availabilityRows, pricingRules] = await Promise.all([
      this.countSellableRoomsPerDate(roomTypeIds, nights),
      prisma.roomAvailability.findMany({
        where: { roomTypeId: { in: roomTypeIds }, date: { in: nights } },
        select: { roomTypeId: true, date: true, totalRooms: true, bookedRooms: true, priceOverride: true },
      }),
      this.getActivePricingRules(hotelIds),
    ]);

    const rowByRoomTypeAndNight = new Map(
      availabilityRows.map((row) => [`${row.roomTypeId}:${row.date.getTime()}`, row])
    );

    const today = todayInVietnamDate();
    const quotes = new Map<string, StayQuote>();
    for (const roomType of roomTypes) {
      // Số phòng đặt được cả kỳ = đêm eo hẹp nhất. Bắt đầu từ Infinity rồi min dần, vì trần tồn kho
      // giờ khác nhau theo từng đêm (đợt chặn chỉ ăn vào đúng khoảng ngày của nó).
      let availableRooms = Number.POSITIVE_INFINITY;
      let totalPrice = new Prisma.Decimal(0);

      for (const night of nights) {
        const key = `${roomType.id}:${night.getTime()}`;
        const row = rowByRoomTypeAndNight.get(key);
        const sellable = sellableByNight.get(key) ?? 0;
        // Đêm đã có dòng tồn kho thì totalRooms đã tính cả đợt chặn (room-block.service trừ vào đó);
        // đêm chưa có dòng thì đếm lại từ bảng rooms.
        const nightAvailable = row ? row.totalRooms - row.bookedRooms : sellable;
        availableRooms = Math.min(availableRooms, Math.max(0, nightAvailable));
        totalPrice = totalPrice.add(this.priceForNight(roomType, night, row, pricingRules, today));
      }

      quotes.set(roomType.id, { availableRooms: Number.isFinite(availableRooms) ? availableRooms : 0, totalPrice });
    }
    return quotes;
  };
}

export const availabilityService = new AvailabilityService();
