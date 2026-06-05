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

  /** Tạo tiện nghi mới (chỉ admin) — tên là unique toàn hệ thống. */
  createAmenity = async (payload: CreateAmenityDto) => {
    const existing = await prisma.amenity.findUnique({ where: { name: payload.name } });
    if (existing) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Tiện nghi "${payload.name}" đã tồn tại`);
    }
    return prisma.amenity.create({ data: payload });
  };
}

export const amenityService = new AmenityService();
