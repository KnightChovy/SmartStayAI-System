import { api } from '@/lib/api';
import type { CustomerWallet } from '@/types/wallet.types';

export const walletService = {
  /**
   * Ví của chính khách đang đăng nhập — `GET /users/me/wallet`.
   * Không nhận param nào: BE lấy customer từ token và trả tối đa 50 giao dịch mới nhất.
   */
  async getMine(): Promise<CustomerWallet> {
    const { data } = await api.get<CustomerWallet>('/users/me/wallet');
    return data;
  },
};
