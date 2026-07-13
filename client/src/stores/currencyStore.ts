import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Currency = 'VND' | 'USD';

interface CurrencyStore {
  /** Tiền tệ đang hiển thị (VND là gốc — mọi giá BE trả về đều là VND). */
  currency: Currency;
  /** Tỷ giá: 1 USD = ? VND. Dùng để quy đổi lúc hiển thị. */
  vndPerUsd: number;
  setCurrency: (c: Currency) => void;
  setRate: (r: number) => void;
}

/**
 * Lựa chọn tiền tệ hiển thị + tỷ giá, persist localStorage (giữ khi reload).
 * `vndPerUsd` mặc định là fallback tĩnh; có thể cập nhật qua API tỷ giá sau này.
 */
export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    set => ({
      currency: 'VND',
      vndPerUsd: 25400,
      setCurrency: currency => set({ currency }),
      setRate: vndPerUsd =>
        set({ vndPerUsd: vndPerUsd > 0 ? vndPerUsd : 25400 }),
    }),
    { name: 'app-currency' }
  )
);
