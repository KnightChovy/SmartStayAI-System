import { api } from '@/lib/api';
import type { CustomerWallet } from '@/types/wallet.type';

/** Tầng gọi API ví khách (`/v1/users/me/wallet`). Cần đăng nhập. */
export const walletService = {
  /** `GET /users/me/wallet` — số dư + tối đa 50 giao dịch gần nhất. */
  async getMine(): Promise<CustomerWallet> {
    const { data } = await api.get<CustomerWallet>('/users/me/wallet');
    return data;
  },
};
