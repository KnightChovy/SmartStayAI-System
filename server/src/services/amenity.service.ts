import httpStatus from 'http-status';
import type { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';
import type { CreateAmenityDto, AmenityFilter } from '../dto/amenity.dto';

export class AmenityService {
  /** Danh sách tiện nghi (public — client dùng để render bộ lọc và form gán tiện nghi). */
  listAmenities = async (filter: AmenityFilter) => {
    const where: Prisma.AmenityWhereInput = {};
    if (filter.category) {
      where.category = filter.category;
    }
    return prisma.amenity.findMany({ where, orderBy: [{ category: 'asc' }, { name: 'asc' }] });
  };

  /**
   * Tạo tiện nghi mới (partner hoặc admin) — tên là unique toàn hệ thống. Vì catalog dùng chung cho mọi
   * partner, chuẩn hoá tên (trim) và so khớp KHÔNG phân biệt hoa/thường để chặn trùng kiểu "Wifi"/"wifi".
   */
  createAmenity = async (payload: CreateAmenityDto) => {
    const name = payload.name.trim();
    const existing = await prisma.amenity.findFirst({ where: { name: { equals: name, mode: 'insensitive' } } });
    if (existing) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Amenity "${name}" already exists`);
    }
    return prisma.amenity.create({ data: { ...payload, name } });
  };
}

export const amenityService = new AmenityService();
