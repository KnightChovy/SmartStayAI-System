import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { walletKeys } from '@/hooks/wallet';
import { paymentService } from '@/services/payment.service';

/**
 * Trả booking bằng số dư ví.
 *
 * Invalidate CẢ HAI phía: số dư ví vừa bị trừ, **và** booking có thể vừa chuyển sang `confirmed`
 * (kèm e-voucher mới). Quên một bên là màn hình còn hiện nút "Thanh toán ngay" cho đơn đã trả
 * xong, hoặc ví vẫn khoe số dư cũ.
 */
export function usePayWithWallet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) => paymentService.payWithWallet(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
    },
  });
}
