import { useQuery } from '@tanstack/react-query';
import { payoutKeys } from '@/hooks/payouts/keys';
import { payoutService } from '@/services/payout.service';

/**
 * `GET /platform-manager/payouts/:id` — chi tiết kèm **số tài khoản đã giải mã**.
 *
 * `staleTime: 0` + không cache lâu: đây là dữ liệu nhạy cảm, chỉ nên có trong bộ nhớ
 * đúng lúc người duyệt đang mở nó ra để chuyển khoản.
 */
export function usePlatformPayout(payoutId: string | null) {
  return useQuery({
    queryKey: payoutKeys.detail(payoutId ?? ''),
    queryFn: () => payoutService.getForPlatform(payoutId!),
    enabled: !!payoutId,
    staleTime: 0,
    gcTime: 0,
  });
}
