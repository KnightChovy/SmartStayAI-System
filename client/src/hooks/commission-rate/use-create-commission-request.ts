import { useMutation, useQueryClient } from '@tanstack/react-query';
import { commissionRateKeys } from '@/hooks/commission-rate/keys';
import { commissionRateService } from '@/services/commission-rate.service';
import type {
  CommissionRateRequest,
  CreateCommissionRequestDto,
} from '@/types/commission-rate.types';

interface CreateCommissionRequestVars {
  hotelId: string;
  dto: CreateCommissionRequestDto;
}

/**
 * `POST /hotels/:hotelId/commission-requests` — nộp đơn xin giảm hoa hồng.
 *
 * Nộp xong `canRequest.allowed` chuyển `false` ("đã có đơn đang chờ duyệt") nên PHẢI
 * invalidate cả bản tóm tắt mức hiện tại, không chỉ danh sách đơn.
 */
export function useCreateCommissionRequest() {
  const queryClient = useQueryClient();
  return useMutation<
    CommissionRateRequest,
    unknown,
    CreateCommissionRequestVars
  >({
    mutationFn: ({ hotelId, dto }) =>
      commissionRateService.createRequest(hotelId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commissionRateKeys.all });
    },
  });
}
