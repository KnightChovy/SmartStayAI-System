import { useQuery } from '@tanstack/react-query';
import { walletKeys } from '@/hooks/wallet/keys';
import { walletService } from '@/services/wallet.service';

interface UseMyWalletOptions {
  /**
   * Tắt khi chưa đăng nhập. `/users/me/wallet` cần token: gọi lúc chưa đăng nhập sẽ ăn 401 và
   * kích hoạt interceptor refresh-token một cách vô ích (cùng lý do `useProfile` phải có cờ này).
   */
  enabled?: boolean;
}

/** `GET /users/me/wallet` — số dư + tối đa 50 giao dịch gần nhất của khách đang đăng nhập. */
export function useMyWallet({ enabled = true }: UseMyWalletOptions = {}) {
  return useQuery({
    queryKey: walletKeys.mine,
    queryFn: walletService.getMine,
    enabled,
  });
}
