import type { PillTone } from '@/components/hotel-partner/shared/Pill';
import type { WalletTransactionType } from '@/types/hotel-revenue.types';

/** Nhãn + tone hiển thị cho từng loại giao dịch ví. */
export const WALLET_TXN_CONFIG: Record<
  WalletTransactionType,
  { label: string; tone: PillTone }
> = {
  earning: { label: 'Earning', tone: 'emerald' },
  commission: { label: 'Commission', tone: 'amber' },
  payout: { label: 'Payout', tone: 'blue' },
  settlement: { label: 'Settlement', tone: 'violet' },
  refund: { label: 'Refund', tone: 'red' },
  adjustment: { label: 'Adjustment', tone: 'slate' },
};

export const WALLET_TXN_OPTIONS: {
  value: WalletTransactionType;
  label: string;
}[] = Object.entries(WALLET_TXN_CONFIG).map(([value, { label }]) => ({
  value: value as WalletTransactionType,
  label,
}));

/**
 * Giao dịch làm tăng số dư (hiển thị dấu + xanh) vs làm giảm (dấu − đỏ).
 *
 * `settlement` tính là DƯƠNG vì `balanceAfter` của nó là số dư **khả dụng** sau khi
 * chuyển pending → available: tổng tiền không đổi nhưng phần rút được thì tăng.
 */
export function isPositiveTxn(type: WalletTransactionType): boolean {
  return type === 'earning' || type === 'settlement' || type === 'adjustment';
}
