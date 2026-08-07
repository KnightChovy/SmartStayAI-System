import httpStatus from 'http-status';
import type { Prisma, User } from '@prisma/client';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';
import { toUtcDate } from '../utils/dates';
import { hotelService } from './hotel.service';
import type { CreatePricingRuleDto, UpdatePricingRuleDto, PricingRuleFilter } from '../dto/pricing-rule.dto';

const ruleInclude = {
  roomType: { select: { id: true, name: true } },
} satisfies Prisma.PricingRuleInclude;

export class PricingRuleService {
  /** roomTypeId (nếu có) phải thuộc đúng khách sạn — chống gán rule sang khách sạn khác. */
  private assertRoomTypeInHotel = async (hotelId: string, roomTypeId: string) => {
    const roomType = await prisma.roomType.findFirst({ where: { id: roomTypeId, hotelId } });
    if (!roomType) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Room type not found in this hotel');
    }
  };

  createRule = async (hotelId: string, currentUser: User, payload: CreatePricingRuleDto) => {
    await hotelService.getManagedHotel(hotelId, currentUser);
    if (payload.roomTypeId) {
      await this.assertRoomTypeInHotel(hotelId, payload.roomTypeId);
    }
    return prisma.pricingRule.create({
      data: {
        hotelId,
        roomTypeId: payload.roomTypeId ?? null,
        name: payload.name,
        ruleType: payload.ruleType,
        startDate: toUtcDate(payload.startDate),
        endDate: toUtcDate(payload.endDate),
        dayOfWeek: payload.dayOfWeek ?? [],
        occupancyThreshold: payload.occupancyThreshold ?? null,
        adjustmentType: payload.adjustmentType,
        adjustmentValue: payload.adjustmentValue,
        priority: payload.priority ?? 0,
        isActive: payload.isActive ?? true,
      },
      include: ruleInclude,
    });
  };

  /** Liệt kê rule của khách sạn, ưu tiên cao xếp trước (đúng thứ tự áp giá). */
  listRules = async (hotelId: string, currentUser: User, filter: PricingRuleFilter) => {
    await hotelService.getManagedHotel(hotelId, currentUser);
    const where: Prisma.PricingRuleWhereInput = { hotelId };
    if (filter.roomTypeId) {
      where.roomTypeId = filter.roomTypeId;
    }
    if (filter.isActive !== undefined) {
      where.isActive = filter.isActive;
    }
    return prisma.pricingRule.findMany({
      where,
      include: ruleInclude,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  };

  updateRule = async (hotelId: string, ruleId: string, currentUser: User, payload: UpdatePricingRuleDto) => {
    await hotelService.getManagedHotel(hotelId, currentUser);
    const rule = await prisma.pricingRule.findFirst({ where: { id: ruleId, hotelId } });
    if (!rule) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Pricing rule not found in this hotel');
    }
    if (payload.roomTypeId) {
      await this.assertRoomTypeInHotel(hotelId, payload.roomTypeId);
    }

    // Khoảng ngày sau cập nhật (trộn giá trị mới với giá trị hiện có) vẫn phải hợp lệ
    const startDate = payload.startDate ? toUtcDate(payload.startDate) : rule.startDate;
    const endDate = payload.endDate ? toUtcDate(payload.endDate) : rule.endDate;
    if (endDate < startDate) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'endDate must be greater than or equal to startDate');
    }

    return prisma.pricingRule.update({
      where: { id: ruleId },
      data: { ...payload, startDate, endDate },
      include: ruleInclude,
    });
  };

  deleteRule = async (hotelId: string, ruleId: string, currentUser: User) => {
    await hotelService.getManagedHotel(hotelId, currentUser);
    const rule = await prisma.pricingRule.findFirst({ where: { id: ruleId, hotelId } });
    if (!rule) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Pricing rule not found in this hotel');
    }
    await prisma.pricingRule.delete({ where: { id: ruleId } });
  };
}

export const pricingRuleService = new PricingRuleService();
