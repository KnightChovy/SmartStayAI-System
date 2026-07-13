import { useCurrencyStore } from '@/stores/currencyStore';
import { formatMoney } from '@/utils/formatCurrency';

/**
 * Trả về hàm `format(vnd)` tự đọc tiền tệ + tỷ giá đang chọn từ store.
 * Truyền vào số tiền **VND gốc** (như BE trả), hàm tự quy đổi + format.
 */
export function useMoney() {
  const currency = useCurrencyStore(s => s.currency);
  const vndPerUsd = useCurrencyStore(s => s.vndPerUsd);

  return {
    currency,
    vndPerUsd,
    format: (vnd: string | number | null | undefined) =>
      formatMoney(vnd, currency, vndPerUsd),
  };
}
