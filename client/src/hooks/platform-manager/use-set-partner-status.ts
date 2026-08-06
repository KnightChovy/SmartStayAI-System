import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminKeys } from '@/hooks/admin/keys';
import { platformManagerKeys } from '@/hooks/platform-manager/keys';
import { platformManagerService } from '@/services/platform-manager.service';
import type {
  SetPartnerStatusDto,
  SetPartnerStatusResponse,
} from '@/types/platform-manager.types';

interface SetPartnerStatusVars {
  partnerId: string;
  dto: SetPartnerStatusDto;
}

/**
 * `PATCH /platform-manager/partners/:partnerId/status` — đình chỉ / khôi phục đối tác.
 *
 * Đình chỉ GỠ NIÊM YẾT toàn bộ khách sạn của đối tác ⇒ phải invalidate cả nhánh hotels
 * (bảng "Hotels Partner" đang hiển thị cột Listing), không chỉ danh sách đối tác.
 */
export function useSetPartnerStatus() {
  const queryClient = useQueryClient();
  return useMutation<SetPartnerStatusResponse, unknown, SetPartnerStatusVars>({
    mutationFn: ({ partnerId, dto }) =>
      platformManagerService.setPartnerStatus(partnerId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformManagerKeys.all });
      queryClient.invalidateQueries({ queryKey: adminKeys.hotelsAll });
    },
  });
}
