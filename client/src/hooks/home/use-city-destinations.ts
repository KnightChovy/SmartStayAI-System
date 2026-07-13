import { useMemo } from 'react';
import { useSearchHotels } from '@/hooks/hotels/use-search-hotels';
import type { HotelSearchResult } from '@/types/hotel.types';

/** Một điểm đến (thành phố) tổng hợp từ danh sách khách sạn thật. */
export interface CityDestination {
  city: string;
  country: string;
  count: number;
  image: string | null;
  minPrice: string | null;
}

/** Gom khách sạn theo thành phố: đếm số KS, lấy ảnh đại diện + giá "từ" thấp nhất. */
function aggregateByCity(results: HotelSearchResult[]): CityDestination[] {
  const map = new Map<string, CityDestination>();
  for (const hotel of results) {
    if (!hotel.city) continue;
    const image = hotel.images?.[0]?.url ?? null;
    const existing = map.get(hotel.city);
    if (existing) {
      existing.count += 1;
      if (!existing.image && image) existing.image = image;
      if (
        hotel.minPrice != null &&
        (existing.minPrice == null ||
          Number(hotel.minPrice) < Number(existing.minPrice))
      ) {
        existing.minPrice = hotel.minPrice;
      }
    } else {
      map.set(hotel.city, {
        city: hotel.city,
        country: hotel.country,
        count: 1,
        image,
        minPrice: hotel.minPrice,
      });
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

/**
 * Điểm đến thật suy ra từ `GET /hotels` (public). Dùng cho các section landing
 * (Trending Destinations, Discover Vietnam) thay cho dữ liệu hardcode.
 */
export function useCityDestinations(sampleSize = 100) {
  const query = useSearchHotels({ limit: sampleSize });
  const destinations = useMemo(
    () => aggregateByCity(query.data?.results ?? []),
    [query.data]
  );
  return {
    destinations,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
