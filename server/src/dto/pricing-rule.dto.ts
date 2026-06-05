import type { PricingRuleType, AdjustmentType } from '@prisma/client';

/** Payload tạo pricing rule cho khách sạn (roomTypeId null = áp cho cả khách sạn). */
export interface CreatePricingRuleDto {
  roomTypeId?: string | null;
  name: string;
  ruleType: PricingRuleType;
  startDate: Date;
  endDate: Date;
  /** 0=Chủ nhật .. 6=Thứ bảy; mảng rỗng = mọi ngày */
  dayOfWeek?: number[];
  /** % phòng đã đặt tối thiểu để rule occupancy có hiệu lực */
  occupancyThreshold?: number;
  adjustmentType: AdjustmentType;
  /** percentage: ±% trên giá đêm; fixed: ±tiền cộng thẳng. Âm = giảm giá */
  adjustmentValue: number;
  priority?: number;
  isActive?: boolean;
}

/** Payload cập nhật pricing rule — mọi field đều tuỳ chọn. */
export type UpdatePricingRuleDto = Partial<CreatePricingRuleDto>;

/** Bộ lọc khi liệt kê pricing rule. */
export interface PricingRuleFilter {
  roomTypeId?: string;
  isActive?: boolean;
}
