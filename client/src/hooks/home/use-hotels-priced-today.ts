import { useMemo } from 'react';
import { useSearchHotels } from '@/hooks/hotels/use-search-hotels';
import { toDateInputValue } from '@/utils/formatDate';
import type { HotelSearchParams, HotelSearchResult } from '@/types/hotel.types';

/**
 * Danh sách khách sạn cho trang chủ, **giá ưu tiên theo đêm nay**.
 *
 * Vì sao phải gọi HAI lần (`GET /hotels`):
 * - KHÔNG kèm ngày ⇒ BE trả `minPrice` = `basePrice` thấp nhất + thuế/phí, **chưa áp pricing
 *   rule** (rule phụ thuộc từng đêm nên không có ngày thì không xác định được). Đây là lý do
 *   card trang chủ báo 1.022.000 trong khi trang chi tiết báo 876.200 cho cùng một khách sạn.
 * - CÓ kèm ngày ⇒ giá thật đã áp rule, NHƯNG BE **lọc bỏ khách sạn không còn phòng** trong kỳ đó
 *   ⇒ dùng một mình thì khách sạn hết phòng đêm nay biến mất khỏi trang chủ.
 *
 * Nên: lấy danh sách đầy đủ ở lượt không ngày (giữ nguyên thứ tự + không mất KS nào), rồi **đè
 * giá** bằng lượt có ngày cho những khách sạn còn phòng. KS hết phòng vẫn hiện với giá "từ" chỉ
 * dẫn như trước — nhãn "Từ" trên card đã nói đúng bản chất con số đó.
 *
 * Hai request chạy song song nên độ trễ ≈ request chậm hơn, không phải tổng. Lượt có ngày lỗi
 * thì section vẫn chạy bằng giá của lượt không ngày (degrade, không chặn trang chủ).
 */
export function useHotelsPricedToday(params: HotelSearchParams) {
  const stay = useMemo(() => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    return { checkIn: toDateInputValue(today), checkOut: toDateInputValue(tomorrow) };
  }, []);

  const all = useSearchHotels(params);
  const availableToday = useSearchHotels({ ...params, ...stay });

  const results = useMemo<HotelSearchResult[]>(() => {
    const base = all.data?.results ?? [];
    const priced = availableToday.data?.results ?? [];
    if (priced.length === 0) return base;
    const priceById = new Map(priced.map(h => [h.id, h.minPrice]));
    return base.map(hotel => {
      const realPrice = priceById.get(hotel.id);
      return realPrice != null ? { ...hotel, minPrice: realPrice } : hotel;
    });
  }, [all.data, availableToday.data]);

  return {
    results,
    // Chờ cả hai để giá không nhảy từ số gốc sang số thật ngay trước mắt khách.
    // `isLoading` của react-query đã tự về false khi query lỗi ⇒ lỗi không treo skeleton.
    isLoading: all.isLoading || availableToday.isLoading,
    isError: all.isError,
  };
}
