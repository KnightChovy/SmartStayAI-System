import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelPropertyKeys } from '@/hooks/hotel-property/keys';
import { hotelPropertyService } from '@/services/hotel-property.service';
import { queryKeys } from '@/constants/queryKeys';
import type { SetHotelChargesDto } from '@/types/hotel-property.types';

/**
 * `PUT /hotels/:id/charges` — thay thế toàn bộ thuế/phí của khách sạn.
 *
 * Cũng invalidate cache khách sạn công khai: `GET /hotels/:id` trả kèm `charges[]` và guest
 * dùng chính mảng đó để ước tính thuế trước khi đặt (`estimateTaxAndFees`) — không invalidate
 * thì trang chi tiết vẫn báo giá theo mức thuế cũ.
 */
export function useSetHotelCharges(hotelId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: SetHotelChargesDto) => hotelPropertyService.setCharges(hotelId, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: hotelPropertyKeys.charges(hotelId) });
      qc.invalidateQueries({ queryKey: queryKeys.hotels.detail(hotelId) });
    },
  });
}
