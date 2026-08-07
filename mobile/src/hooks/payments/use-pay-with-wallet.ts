import { useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsService } from '@/services/payments.service';
import { queryKeys } from '@/constants/queryKeys';

/**
 * `POST /payments/bookings/:bookingId/wallet` — trả booking bằng số dư ví.
 * Có thể trừ MỘT PHẦN (đọc `remainingToPay` ở nơi gọi) — không coi thành công là
 * "đã trả xong".
 */
export function usePayWithWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => paymentsService.payWithWallet(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
    },
  });
}
