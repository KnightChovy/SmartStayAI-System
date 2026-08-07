import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { walletService } from '@/services/wallet.service';
import { useAuthStore } from '@/stores/authStore';

interface UseMyWalletOptions {
  /**
   * Cho phép TẮT thêm ngoài yêu cầu đăng nhập (vd checkout chỉ cần hỏi ví khi thật sự
   * đang chờ thanh toán — gọi vô điều kiện ở mọi nơi hiện booking là bắn thừa request).
   * Mặc định `true`.
   */
  enabled?: boolean;
}

/** `GET /users/me/wallet` — số dư ví khách. Chỉ gọi khi đã đăng nhập. */
export function useMyWallet({ enabled = true }: UseMyWalletOptions = {}) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  return useQuery({
    queryKey: queryKeys.wallet.mine(),
    queryFn: () => walletService.getMine(),
    enabled: isAuthenticated && enabled,
  });
}
