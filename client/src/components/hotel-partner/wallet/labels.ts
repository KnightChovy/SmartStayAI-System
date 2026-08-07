import type { PillTone } from '@/components/hotel-partner/shared/Pill';
import type { WalletTransactionType } from '@/types/hotel-revenue.types';
import type { PayoutStatus } from '@/types/payout.types';

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

/**
 * Câu mô tả cho một dòng sổ, sinh từ `type` + `payoutStatus`.
 *
 * BE có trả `description` nhưng là **tiếng Anh backfill cứng** ("Payout request — funds on
 * hold"), không đi qua i18n và không phản ánh trạng thái hiện tại của khoản rút. Sinh tại chỗ
 * thì câu chữ luôn khớp badge bên cạnh và dịch được sau này; `description` của BE chỉ dùng làm
 * phương án chót cho loại giao dịch lạ.
 */
export function describeTxn(
  type: WalletTransactionType,
  payoutStatus: PayoutStatus | null,
  fallback: string | null
): string {
  switch (type) {
    case 'earning':
      return 'Booking revenue — waiting to be settled';
    case 'settlement':
      return 'Settled — moved into your available balance';
    case 'refund':
      return 'Deducted because a booking was refunded';
    case 'commission':
      return 'Platform commission';
    case 'payout':
      // Cùng `type: 'payout'` nhưng ba kết cục khác hẳn nhau — phải đọc `payoutStatus`.
      if (payoutStatus === 'paid') return 'Payout transferred to your bank';
      if (payoutStatus === 'failed')
        return 'Payout declined — the amount was returned';
      return 'Payout requested — amount held';
    case 'adjustment':
      if (payoutStatus === 'failed')
        return 'Returned to your balance after a declined payout';
      return 'Balance adjustment';
    default:
      return fallback ?? '';
  }
}
