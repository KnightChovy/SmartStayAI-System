import httpStatus from 'http-status';
import { Prisma } from '@prisma/client';
import type { User } from '@prisma/client';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';
import { roleRights } from '../config/roles';
import { eachNightOfStay } from '../utils/dates';
import { availabilityService } from './availability.service';
import type {
  HotelSearchFilter,
  RoomTypeSearchFilter,
  HotelQueryOptions,
  UpdateHotelDto,
  HotelImageInput,
  HotelContactInput,
  HotelPolicyInput,
  HotelNearbyPlaceInput,
} from '../dto/hotel.dto';
import type { AmenityAssignmentInput } from '../dto/amenity.dto';

/**
 * Chính sách huỷ/hoàn tiền — kiểu "free-cancel tới hạn chót" (giống giá linh hoạt của OTA).
 * - freeUntilHours: huỷ trước mốc này (giờ, tính tới thời điểm nhận phòng) ⇒ hoàn 100%.
 * - latePenalty: phạt khi huỷ muộn — 'first_night' (giữ 1 đêm đầu) | 'full' (mất toàn bộ).
 *
 * Đặt ở hotel.service vì chính sách này thuộc về KHÁCH SẠN; booking.service import từ đây để dùng
 * (chiều ngược lại sẽ tạo import vòng tròn). Mặc định dưới đây áp cho KS chưa tự cấu hình.
 */
export const DEFAULT_CANCELLATION_POLICY = { freeUntilHours: 48, latePenalty: 'first_night' };

export interface CancellationPolicy {
  freeUntilHours: number;
  latePenalty: string;
}

/** Đọc chính sách huỷ đã cấu hình ở hotel.settings.cancellation, thiếu thì dùng mặc định. */
export const readCancellationPolicy = (settings: Prisma.JsonValue | null): CancellationPolicy => {
  const parsed = settings as unknown as { cancellation?: Partial<CancellationPolicy> } | null;
  return {
    freeUntilHours: parsed?.cancellation?.freeUntilHours ?? DEFAULT_CANCELLATION_POLICY.freeUntilHours,
    latePenalty: parsed?.cancellation?.latePenalty ?? DEFAULT_CANCELLATION_POLICY.latePenalty,
  };
};

export class HotelService {
  /**
   * Điểm đánh giá công khai của MỘT NHÓM khách sạn, gom trong đúng một query để danh sách không
   * bị N+1. Chỉ tính đánh giá 'published' — bằng đúng tập khách xem được ở trang đánh giá.
   *
   * Khách sạn chưa có đánh giá nào ⇒ avgRating = null chứ KHÔNG phải 0: "chưa có điểm" khác hẳn
   * "bị chấm 0 điểm", để FE hiện "Chưa có đánh giá" thay vì 0 sao.
   */
  private getRatingSummaries = async (hotelIds: string[]) => {
    const rows = await prisma.review.groupBy({
      by: ['hotelId'],
      where: { hotelId: { in: hotelIds }, status: 'published' },
      _avg: { overallRating: true },
      _count: { _all: true },
    });
    return new Map(
      rows.map((row) => [
        row.hotelId,
        {
          // Làm tròn 1 chữ số ngay ở BE để thẻ danh sách và trang chi tiết không hiện lệch nhau
          avgRating: row._avg.overallRating === null ? null : Math.round(row._avg.overallRating * 10) / 10,
          reviewCount: row._count._all,
        },
      ])
    );
  };

  /**
   * Lấy khách sạn cho thao tác quản trị: chỉ chủ partner của khách sạn hoặc người có quyền
   * manageHotels (platform_manager/admin) được phép. Dùng chung cho mọi API quản lý
   * loại phòng / phòng / pricing rule.
   */
  getManagedHotel = async (hotelId: string, currentUser: User) => {
    const hotel = await prisma.hotel.findFirst({
      where: { id: hotelId, deletedAt: null },
      include: { partner: { select: { ownerId: true } } },
    });
    if (!hotel) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy khách sạn');
    }
    const isOwner = hotel.partner.ownerId === currentUser.id;
    const canManage = (roleRights.get(currentUser.role) || []).includes('manageHotels');
    if (!isOwner && !canManage) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }
    return hotel;
  };

  /**
   * Lấy khách sạn cho thao tác VẬN HÀNH (xem booking, check-in/out): rộng hơn getManagedHotel.
   * Cho phép CHỦ partner, người có quyền manageBookings (platform_manager/admin), HOẶC nhân viên
   * đang được phân công vào đúng khách sạn này (hotel_staff_assignments còn hiệu lực). Vì staff cũng
   * phải làm được check-in/out nhưng không phải chủ và không có quyền toàn cục.
   */
  getOperableHotel = async (hotelId: string, currentUser: User) => {
    const hotel = await prisma.hotel.findFirst({
      where: { id: hotelId, deletedAt: null },
      include: { partner: { select: { ownerId: true } } },
    });
    if (!hotel) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy khách sạn');
    }
    const isOwner = hotel.partner.ownerId === currentUser.id;
    const canManage = (roleRights.get(currentUser.role) || []).includes('manageBookings');
    if (isOwner || canManage) {
      return hotel;
    }
    const assignment = await prisma.hotelStaffAssignment.findFirst({
      where: { hotelId, userId: currentUser.id, unassignedAt: null },
    });
    if (!assignment) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }
    return hotel;
  };

  /**
   * Chi tiết một khách sạn cho CHỦ SỞ HỮU / manager — trả về BẤT KỂ trạng thái (kể cả chưa listed /
   * đang chờ duyệt), khác getHotelById (public chỉ trả KS đang bán). Quyền kiểm qua getManagedHotel.
   * Kèm toàn bộ ảnh, tiện nghi, và TẤT CẢ loại phòng (cả đã tắt) với ảnh + tiện nghi + số phòng.
   */
  getManagedHotelDetail = async (hotelId: string, currentUser: User) => {
    await this.getManagedHotel(hotelId, currentUser);
    return prisma.hotel.findUniqueOrThrow({
      where: { id: hotelId },
      include: {
        images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
        amenities: { include: { amenity: true } },
        contacts: true,
        policies: true,
        nearbyPlaces: true,
        roomTypes: {
          orderBy: { basePrice: 'asc' },
          include: {
            images: { orderBy: { sortOrder: 'asc' } },
            amenities: { include: { amenity: true } },
            beds: true,
            _count: { select: { rooms: true } },
          },
        },
      },
    });
  };

  /**
   * Danh sách khách sạn của partner đang đăng nhập (theo ownerId = userId lấy từ token).
   * Quyền đã chặn ở route bằng auth() — controller truyền req.user.id, nên ở đây không kiểm lại.
   * Trả về CẢ khách sạn chưa mở bán / đang chờ duyệt (khác searchHotels public), chỉ bỏ khách sạn
   * đã xoá mềm. Kèm ảnh cover + số loại phòng / số phòng để hiển thị danh sách.
   */
  getHotelsByOwner = async (userId: string) => {
    return prisma.hotel.findMany({
      where: { partner: { ownerId: userId }, deletedAt: null },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        _count: { select: { roomTypes: true, rooms: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  };

  /**
   * Danh sách khách sạn mà STAFF đang đăng nhập được phân công (bản "của staff" tương tự getHotelsByOwner).
   * Lấy theo hotel_staff_assignments còn hiệu lực (unassignedAt = null) — để màn quản lý của staff biết
   * mình thuộc khách sạn nào rồi gọi tiếp các API vận hành (booking / room status / check-in-out).
   */
  getHotelsForStaff = async (userId: string) => {
    return prisma.hotel.findMany({
      where: {
        deletedAt: null,
        staffAssignments: { some: { userId, unassignedAt: null } },
      },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        _count: { select: { roomTypes: true, rooms: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  };

  /**
   * Partner tự BẬT/TẮT mở bán (publish) khách sạn của mình. Quyền kiểm qua getManagedHotel
   * (chỉ chủ KS hoặc manageHotels). Khi BẬT (isListed=true): khách sạn phải đã được duyệt (isActive)
   * và có ít nhất một loại phòng đang bật — tránh lên sàn khi chưa có phòng để bán. Khi TẮT: không ràng buộc.
   */
  setHotelListing = async (hotelId: string, isListed: boolean, currentUser: User) => {
    const hotel = await this.getManagedHotel(hotelId, currentUser);
    if (isListed) {
      if (!hotel.isActive) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Khách sạn chưa được duyệt nên chưa thể mở bán');
      }
      const activeRoomTypes = await prisma.roomType.count({ where: { hotelId, isActive: true } });
      if (activeRoomTypes === 0) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'Cần có ít nhất một loại phòng đang bật (đã điền giá) trước khi mở bán'
        );
      }
    }
    return prisma.hotel.update({ where: { id: hotelId }, data: { isListed } });
  };

  /**
   * Partner cập nhật hồ sơ khách sạn của mình (name, mô tả, địa chỉ, toạ độ, sao, giờ nhận/trả...).
   * Quyền qua getManagedHotel. Joi ở routing đã chặn các trường khoá (isActive/isListed/pháp lý).
   *
   * `settings` là cột Json nên gán thẳng sẽ XOÁ MẤT các khoá khác đang có; ở đây trộn vào bản cũ để
   * cập nhật chính sách huỷ không làm mất cấu hình khác sau này.
   */
  updateHotel = async (hotelId: string, payload: UpdateHotelDto, currentUser: User) => {
    const hotel = await this.getManagedHotel(hotelId, currentUser);
    const { settings, ...rest } = payload;
    const data: Prisma.HotelUpdateInput = { ...rest };
    if (settings) {
      const current = (hotel.settings ?? {}) as Prisma.JsonObject;
      data.settings = { ...current, cancellation: settings.cancellation };
    }
    return prisma.hotel.update({ where: { id: hotelId }, data });
  };

  /**
   * Thêm ảnh khách sạn (URL đã upload qua POST /v1/uploads). Nếu batch có ảnh isPrimary thì bỏ cờ
   * primary của các ảnh cũ để luôn chỉ có 1 ảnh chính.
   */
  addHotelImages = async (hotelId: string, images: HotelImageInput[], currentUser: User) => {
    await this.getManagedHotel(hotelId, currentUser);
    const hasNewPrimary = images.some((image) => image.isPrimary);
    return prisma.$transaction(async (tx) => {
      if (hasNewPrimary) {
        await tx.hotelImage.updateMany({ where: { hotelId }, data: { isPrimary: false } });
      }
      await tx.hotelImage.createMany({
        data: images.map((image, index) => ({
          hotelId,
          url: image.url,
          imageCategory: image.imageCategory,
          caption: image.caption ?? null,
          isPrimary: image.isPrimary ?? false,
          sortOrder: image.sortOrder ?? index,
        })),
      });
      return tx.hotelImage.findMany({ where: { hotelId }, orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] });
    });
  };

  /** Xoá một ảnh khách sạn (kiểm ảnh thuộc đúng khách sạn của partner). */
  deleteHotelImage = async (hotelId: string, imageId: string, currentUser: User) => {
    await this.getManagedHotel(hotelId, currentUser);
    const image = await prisma.hotelImage.findFirst({ where: { id: imageId, hotelId } });
    if (!image) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy ảnh trong khách sạn này');
    }
    await prisma.hotelImage.delete({ where: { id: imageId } });
  };

  /** Đặt một ảnh làm ảnh chính (bật isPrimary ảnh này, tắt isPrimary các ảnh còn lại). */
  setPrimaryHotelImage = async (hotelId: string, imageId: string, currentUser: User) => {
    await this.getManagedHotel(hotelId, currentUser);
    const image = await prisma.hotelImage.findFirst({ where: { id: imageId, hotelId } });
    if (!image) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy ảnh trong khách sạn này');
    }
    return prisma.$transaction(async (tx) => {
      await tx.hotelImage.updateMany({ where: { hotelId }, data: { isPrimary: false } });
      return tx.hotelImage.update({ where: { id: imageId }, data: { isPrimary: true } });
    });
  };

  /** Danh sách tiện nghi đã gán cho khách sạn (kèm thông tin catalog). Quyền qua getManagedHotel. */
  getHotelAmenities = async (hotelId: string, currentUser: User) => {
    await this.getManagedHotel(hotelId, currentUser);
    return prisma.hotelAmenity.findMany({
      where: { hotelId },
      include: { amenity: true },
      orderBy: { amenity: { name: 'asc' } },
    });
  };

  /**
   * Gán lại TOÀN BỘ tiện nghi của khách sạn (thay thế, không cộng thêm) — client gửi danh sách cuối cùng,
   * mảng rỗng = bỏ hết. Mỗi dòng có thể kèm isFree/quantity. Kiểm mọi amenityId tồn tại trong catalog.
   */
  setHotelAmenities = async (hotelId: string, currentUser: User, amenities: AmenityAssignmentInput[]) => {
    await this.getManagedHotel(hotelId, currentUser);

    const amenityIds = amenities.map((item) => item.amenityId);
    if (amenityIds.length > 0) {
      const existingCount = await prisma.amenity.count({ where: { id: { in: amenityIds } } });
      if (existingCount !== amenityIds.length) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Có tiện nghi không tồn tại trong danh sách gửi lên');
      }
    }

    return prisma.$transaction(async (tx) => {
      await tx.hotelAmenity.deleteMany({ where: { hotelId } });
      if (amenities.length > 0) {
        await tx.hotelAmenity.createMany({
          data: amenities.map((item) => ({
            hotelId,
            amenityId: item.amenityId,
            isFree: item.isFree ?? true,
            quantity: item.quantity ?? null,
          })),
        });
      }
      return tx.hotelAmenity.findMany({
        where: { hotelId },
        include: { amenity: true },
        orderBy: { amenity: { name: 'asc' } },
      });
    });
  };

  /** Danh sách liên hệ của khách sạn (chủ KS / manageHotels). */
  getHotelContacts = async (hotelId: string, currentUser: User) => {
    await this.getManagedHotel(hotelId, currentUser);
    return prisma.hotelContact.findMany({ where: { hotelId }, orderBy: { createdAt: 'asc' } });
  };

  /** Gán lại TOÀN BỘ liên hệ của khách sạn (thay thế; mảng rỗng = xoá hết). */
  setHotelContacts = async (hotelId: string, currentUser: User, contacts: HotelContactInput[]) => {
    await this.getManagedHotel(hotelId, currentUser);
    return prisma.$transaction(async (tx) => {
      await tx.hotelContact.deleteMany({ where: { hotelId } });
      if (contacts.length > 0) {
        await tx.hotelContact.createMany({ data: contacts.map((c) => ({ hotelId, ...c })) });
      }
      return tx.hotelContact.findMany({ where: { hotelId }, orderBy: { createdAt: 'asc' } });
    });
  };

  /** Danh sách chính sách / phụ phí của khách sạn (chủ KS / manageHotels). */
  getHotelPolicies = async (hotelId: string, currentUser: User) => {
    await this.getManagedHotel(hotelId, currentUser);
    return prisma.hotelPolicy.findMany({ where: { hotelId }, orderBy: { createdAt: 'asc' } });
  };

  /** Gán lại TOÀN BỘ chính sách / phụ phí của khách sạn (thay thế; mảng rỗng = xoá hết). */
  setHotelPolicies = async (hotelId: string, currentUser: User, policies: HotelPolicyInput[]) => {
    await this.getManagedHotel(hotelId, currentUser);
    return prisma.$transaction(async (tx) => {
      await tx.hotelPolicy.deleteMany({ where: { hotelId } });
      if (policies.length > 0) {
        await tx.hotelPolicy.createMany({ data: policies.map((p) => ({ hotelId, ...p })) });
      }
      return tx.hotelPolicy.findMany({ where: { hotelId }, orderBy: { createdAt: 'asc' } });
    });
  };

  /** Danh sách địa điểm lân cận của khách sạn (chủ KS / manageHotels). */
  getHotelNearbyPlaces = async (hotelId: string, currentUser: User) => {
    await this.getManagedHotel(hotelId, currentUser);
    return prisma.hotelNearbyPlace.findMany({ where: { hotelId }, orderBy: { createdAt: 'asc' } });
  };

  /** Gán lại TOÀN BỘ địa điểm lân cận của khách sạn (thay thế; mảng rỗng = xoá hết). */
  setHotelNearbyPlaces = async (hotelId: string, currentUser: User, nearbyPlaces: HotelNearbyPlaceInput[]) => {
    await this.getManagedHotel(hotelId, currentUser);
    return prisma.$transaction(async (tx) => {
      await tx.hotelNearbyPlace.deleteMany({ where: { hotelId } });
      if (nearbyPlaces.length > 0) {
        await tx.hotelNearbyPlace.createMany({ data: nearbyPlaces.map((n) => ({ hotelId, ...n })) });
      }
      return tx.hotelNearbyPlace.findMany({ where: { hotelId }, orderBy: { createdAt: 'asc' } });
    });
  };

  /**
   * Tìm khách sạn theo thành phố. Nếu có khoảng ngày (checkIn/checkOut) thì chỉ trả về
   * khách sạn còn ít nhất một loại phòng trống đủ sức chứa trong suốt kỳ ở.
   */
  searchHotels = async (filter: HotelSearchFilter, options: HotelQueryOptions) => {
    const limit = options.limit || 10;
    const page = options.page || 1;
    const skip = (page - 1) * limit;

    // Chỉ tìm trong khách sạn đã được duyệt và đang mở bán
    const where: Prisma.HotelWhereInput = { isActive: true, isListed: true, deletedAt: null };
    if (filter.city) {
      where.city = { contains: filter.city, mode: 'insensitive' };
    }

    // Khách sạn phải có ít nhất một loại phòng đang bán đủ sức chứa
    const roomTypeWhere: Prisma.RoomTypeWhereInput = { isActive: true };
    if (filter.guests) {
      roomTypeWhere.maxOccupancy = { gte: filter.guests };
    }
    where.roomTypes = { some: roomTypeWhere };

    // Giá "từ" mỗi đêm THẬT của từng khách sạn khi có khoảng ngày — chỉ tính trên loại phòng còn
    // trống, và đã áp pricing rule + priceOverride. Rỗng khi tìm không kèm ngày (xem bên dưới).
    const realMinPricePerNight = new Map<string, Prisma.Decimal>();

    // Có khoảng ngày ⇒ tính tồn kho từng loại phòng ứng viên rồi chỉ giữ khách sạn còn phòng
    if (filter.checkIn && filter.checkOut) {
      const candidates = await prisma.roomType.findMany({
        where: { ...roomTypeWhere, hotel: where },
        select: { id: true, hotelId: true, basePrice: true },
      });
      const quotes = await availabilityService.getStayQuotes(candidates, filter.checkIn, filter.checkOut);
      const numNights = eachNightOfStay(filter.checkIn, filter.checkOut).length;
      const available = candidates.filter((candidate) => (quotes.get(candidate.id)?.availableRooms ?? 0) > 0);
      where.id = { in: [...new Set(available.map((candidate) => candidate.hotelId))] };

      // Tận dụng luôn quote vừa tính (không thêm truy vấn): giá mỗi đêm = tổng kỳ ở ÷ số đêm.
      // Giá từng đêm có thể khác nhau (cuối tuần, lễ) nên đây là mức trung bình mỗi đêm.
      for (const candidate of available) {
        const perNight = quotes.get(candidate.id)!.totalPrice.div(numNights).toDecimalPlaces(2);
        const current = realMinPricePerNight.get(candidate.hotelId);
        if (!current || perNight.lessThan(current)) {
          realMinPricePerNight.set(candidate.hotelId, perNight);
        }
      }
    }

    let orderBy: Prisma.HotelOrderByWithRelationInput = { createdAt: 'desc' };
    if (options.sortBy) {
      const [field, direction] = options.sortBy.split(':');
      orderBy = { [field]: direction === 'desc' ? 'desc' : 'asc' };
    }

    const [hotels, totalResults] = await prisma.$transaction([
      prisma.hotel.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          roomTypes: { where: roomTypeWhere, select: { basePrice: true } },
        },
      }),
      prisma.hotel.count({ where }),
    ]);

    const ratings = await this.getRatingSummaries(hotels.map((hotel) => hotel.id));

    // Giá "từ" mỗi đêm của khách sạn:
    // - CÓ ngày ⇒ giá thật đã áp pricing rule/priceOverride, tính từ quote ở trên. Trước đây chỗ này
    //   lấy thẳng basePrice nên thẻ báo rẻ hơn giá thật khi phòng rẻ nhất đang dính rule tăng giá.
    // - KHÔNG có ngày ⇒ rule phụ thuộc từng đêm nên chưa xác định được; basePrice thấp nhất là mức
    //   trung thực nhất có thể nói ("từ ... /đêm").
    // Chưa gồm thuế/phí (theo thông lệ hiển thị giá phòng mỗi đêm); số phải trả đầy đủ nằm ở bước
    // chọn phòng và ở booking.
    const results = hotels.map(({ roomTypes, ...hotel }) => ({
      ...hotel,
      minPrice:
        realMinPricePerNight.get(hotel.id) ??
        (roomTypes.length > 0 ? Prisma.Decimal.min(...roomTypes.map((rt) => rt.basePrice)) : null),
      ...(ratings.get(hotel.id) ?? { avgRating: null, reviewCount: 0 }),
    }));

    return { results, page, limit, totalPages: Math.ceil(totalResults / limit), totalResults };
  };

  /**
   * Chi tiết một khách sạn cho trang profile của guest — public, chỉ trả khách sạn đang mở bán
   * (isActive + isListed, chưa xoá). Kèm toàn bộ ảnh, tiện nghi khách sạn và các loại phòng đang
   * bán (mỗi loại có ảnh + tiện nghi + giá gốc). Tồn kho/giá theo ngày lấy riêng qua getRoomTypes.
   */
  getHotelById = async (hotelId: string) => {
    const hotel = await prisma.hotel.findFirst({
      where: { id: hotelId, isActive: true, isListed: true, deletedAt: null },
      include: {
        images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
        amenities: { include: { amenity: true } },
        contacts: true,
        policies: true,
        nearbyPlaces: true,
        roomTypes: {
          where: { isActive: true },
          orderBy: { basePrice: 'asc' },
          include: {
            images: { orderBy: { sortOrder: 'asc' } },
            amenities: { include: { amenity: true } },
            beds: true,
          },
        },
      },
    });
    if (!hotel) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy khách sạn');
    }
    // Điểm đánh giá dùng chung một cách tính với danh sách ⇒ thẻ KS và trang chi tiết luôn khớp nhau.
    // Bảng phân tích chi tiết (5 tiêu chí + phân bố sao) nằm ở GET /hotels/:hotelId/review-stats.
    const ratings = await this.getRatingSummaries([hotel.id]);

    // Chính sách huỷ bằng SỐ — đây mới là thứ quyết định tiền hoàn. Khách sạn còn hai chỗ mô tả
    // bằng chữ (cột `cancellationPolicy` và `policies[cancellation].description`) do partner tự
    // viết, KHÔNG ràng buộc gì với con số này. Trả kèm số thật để FE hiện cạnh phần mô tả, tránh
    // việc khách chỉ đọc chữ rồi hiểu sai mình được hoàn bao nhiêu.
    const cancellationRule = readCancellationPolicy(hotel.settings);

    return { ...hotel, cancellationRule, ...(ratings.get(hotel.id) ?? { avgRating: null, reviewCount: 0 }) };
  };

  /**
   * Tìm loại phòng trong một khách sạn theo bộ lọc (sức chứa, khoảng giá, loại giường, view).
   * Nếu có khoảng ngày thì kèm số phòng trống + tổng giá kỳ ở và loại bỏ loại phòng đã hết.
   */
  getRoomTypes = async (hotelId: string, filter: RoomTypeSearchFilter) => {
    const hotel = await prisma.hotel.findFirst({
      where: { id: hotelId, isActive: true, isListed: true, deletedAt: null },
    });
    if (!hotel) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy khách sạn');
    }

    const where: Prisma.RoomTypeWhereInput = { hotelId, isActive: true };
    if (filter.guests) {
      where.maxOccupancy = { gte: filter.guests };
    }
    if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
      where.basePrice = {
        ...(filter.minPrice !== undefined && { gte: filter.minPrice }),
        ...(filter.maxPrice !== undefined && { lte: filter.maxPrice }),
      };
    }
    if (filter.bedType) {
      where.bedType = { equals: filter.bedType, mode: 'insensitive' };
    }
    if (filter.viewType) {
      where.viewType = { equals: filter.viewType, mode: 'insensitive' };
    }

    const roomTypes = await prisma.roomType.findMany({
      where,
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        amenities: { include: { amenity: true } },
        beds: true,
      },
      orderBy: { basePrice: 'asc' },
    });

    // Không có khoảng ngày ⇒ trả về danh sách loại phòng, không kèm tồn kho
    if (!filter.checkIn || !filter.checkOut) {
      return roomTypes;
    }

    const quotes = await availabilityService.getStayQuotes(roomTypes, filter.checkIn, filter.checkOut);
    const numNights = eachNightOfStay(filter.checkIn, filter.checkOut).length;
    // Thuế/phí tính y hệt lúc đặt (cùng hàm computeTaxAndFees) để số báo ở bước chọn phòng CHÍNH LÀ
    // số khách sẽ trả — trước đây chỉ báo tiền phòng nên khách bị bất ngờ ở bước thanh toán.
    const taxFeePolicies = (await availabilityService.getTaxFeePolicies([hotelId])).get(hotelId) ?? [];
    // Số khách dùng để nhân phí per_person: lấy theo bộ lọc, không có thì coi như 1 khách
    const numGuests = filter.guests ?? 1;

    return roomTypes.flatMap((roomType) => {
      const quote = quotes.get(roomType.id);
      if (!quote || quote.availableRooms <= 0) {
        return [];
      }
      const subtotal = quote.totalPrice;
      const { taxAmount, feeAmount } = availabilityService.computeTaxAndFees(
        taxFeePolicies,
        subtotal,
        numNights,
        numGuests
      );
      return [
        {
          ...roomType,
          numNights,
          availableRooms: quote.availableRooms,
          // Tách khoản giống hệt booking: subtotal + taxAmount + feeAmount = totalPrice
          subtotal,
          taxAmount,
          feeAmount,
          totalPrice: subtotal.add(taxAmount).add(feeAmount),
        },
      ];
    });
  };

  /**
   * Chi tiết một loại phòng cho trang đặt phòng của guest — public. Chỉ trả loại phòng đang bán
   * (isActive) thuộc khách sạn đang mở bán (isActive + isListed, chưa xoá) để khách không xem được
   * loại phòng/khách sạn đang ẩn. Kèm ảnh, tiện nghi, giường và thông tin khách sạn tối giản.
   * Khi có checkIn/checkOut thì kèm số phòng trống, số đêm và tổng giá kỳ ở (giá theo ngày đã áp).
   */
  getRoomTypeById = async (hotelId: string, roomTypeId: string, filter: RoomTypeSearchFilter) => {
    const roomType = await prisma.roomType.findFirst({
      where: {
        id: roomTypeId,
        hotelId,
        isActive: true,
        hotel: { isActive: true, isListed: true, deletedAt: null },
      },
      include: {
        images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
        amenities: { include: { amenity: true } },
        beds: true,
        hotel: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            country: true,
            starRating: true,
            checkInTime: true,
            checkOutTime: true,
          },
        },
      },
    });
    if (!roomType) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy loại phòng');
    }

    // Không có khoảng ngày ⇒ trả chi tiết loại phòng, chưa kèm tồn kho/giá kỳ ở
    if (!filter.checkIn || !filter.checkOut) {
      return roomType;
    }

    const quotes = await availabilityService.getStayQuotes([roomType], filter.checkIn, filter.checkOut);
    const numNights = eachNightOfStay(filter.checkIn, filter.checkOut).length;
    const quote = quotes.get(roomType.id);
    return {
      ...roomType,
      numNights,
      availableRooms: quote?.availableRooms ?? 0,
      totalPrice: quote?.totalPrice ?? null,
    };
  };
}

export const hotelService = new HotelService();
