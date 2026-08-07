import prisma from '../config/prisma';
import type { DestinationSuggestFilter } from '../dto/destination.dto';
import { removeAccent } from '../utils/text';

const listedHotel = { isActive: true, isListed: true, deletedAt: null };

export class DestinationService {
  /**
   * [Public] Điểm đến = các thành phố có khách sạn đang mở bán, kèm số lượng và một ảnh tiêu biểu.
   * Sắp xếp nhiều khách sạn nhất lên đầu. Thay cho việc FE tự suy từ /hotels (bị giới hạn limit).
   */
  listDestinations = async () => {
    const hotels = await prisma.hotel.findMany({
      where: listedHotel,
      select: { city: true, images: { where: { isPrimary: true }, take: 1, select: { url: true } } },
      orderBy: { createdAt: 'asc' },
    });
    const byCity = new Map<string, { city: string; hotelCount: number; image: string | null }>();
    for (const h of hotels) {
      const entry = byCity.get(h.city) ?? { city: h.city, hotelCount: 0, image: null };
      entry.hotelCount += 1;
      // Ảnh của khách sạn đầu tiên trong thành phố có ảnh primary
      if (!entry.image && h.images[0]) entry.image = h.images[0].url;
      byCity.set(h.city, entry);
    }
    return [...byCity.values()].sort((a, b) => b.hotelCount - a.hotelCount);
  };

  /**
   * [Public] Gợi ý điểm đến khi gõ — thành phố + quận/huyện của khách sạn đang mở bán, kèm số lượng.
   * Khớp KHÔNG PHÂN BIỆT DẤU. Ưu tiên nơi nhiều khách sạn hơn.
   */
  suggestDestinations = async (filter: DestinationSuggestFilter) => {
    const limit = filter.limit || 8;
    const needle = removeAccent(filter.q.trim());

    const hotels = await prisma.hotel.findMany({
      where: listedHotel,
      select: { city: true, district: true },
    });

    // Gom số lượng theo (loại, tên). Quận/huyện giữ kèm thành phố để FE hiển thị ngữ cảnh.
    const agg = new Map<string, { type: 'city' | 'district'; name: string; city: string; hotelCount: number }>();
    const bump = (type: 'city' | 'district', name: string, city: string) => {
      const key = `${type}:${name}`;
      const entry = agg.get(key) ?? { type, name, city, hotelCount: 0 };
      entry.hotelCount += 1;
      agg.set(key, entry);
    };
    for (const h of hotels) {
      bump('city', h.city, h.city);
      if (h.district) bump('district', h.district, h.city);
    }

    return [...agg.values()]
      .filter((e) => removeAccent(e.name).includes(needle))
      .sort((a, b) => b.hotelCount - a.hotelCount)
      .slice(0, limit);
  };
}

export const destinationService = new DestinationService();
