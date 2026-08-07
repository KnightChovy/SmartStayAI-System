import type { PillTone } from '@/components/hotel-partner/shared/Pill';
import type { PayoutStatus } from '@/types/payout.types';

/**
 * Nhãn trạng thái yêu cầu rút.
 *
 * Nói theo **việc đang xảy ra với tiền**, không bê nguyên tên enum của BE: `failed` KHÔNG phải
 * lỗi hệ thống mà là Platform Manager **từ chối**, và tiền **đã hoàn về ví**. Để chữ "Failed"
 * thì đối tác tưởng mất tiền hoặc tưởng hệ thống hỏng.
 */
export const PAYOUT_STATUS_CONFIG: Record<
  PayoutStatus,
  { label: string; tone: PillTone; hint: string }
> = {
  pending: {
    label: 'Awaiting review',
    tone: 'amber',
    hint: 'The platform is reviewing this request. The amount is already held out of your available balance.',
  },
  processing: {
    label: 'Processing',
    tone: 'blue',
    hint: 'The transfer is on its way.',
  },
  paid: {
    label: 'Paid',
    tone: 'emerald',
    hint: 'Transferred to your bank account.',
  },
  failed: {
    label: 'Declined',
    tone: 'slate',
    hint: 'The platform declined this request. The amount went back to your available balance.',
  },
};

/**
 * `0071000123456` → `•••• •••• 3456`. Giữ 4 số cuối — vừa đủ để đối chiếu, không lộ cả số.
 *
 * Dùng chung cho thẻ Bank Account và ô số TK trong modal đổi tài khoản: hai chỗ che khác kiểu
 * thì đối tác tưởng là hai con số khác nhau.
 */
export function maskAccount(value: string): string {
  return `•••• •••• ${value.slice(-4)}`;
}

export const PAYOUT_STATUS_OPTIONS: { value: PayoutStatus; label: string }[] =
  Object.entries(PAYOUT_STATUS_CONFIG).map(([value, { label }]) => ({
    // `Object.entries` làm mất kiểu khoá; danh sách nguồn là chính `PAYOUT_STATUS_CONFIG`
    // nên ép về đúng union ở đây là an toàn và không có đường lệch.
    value: value as PayoutStatus,
    label,
  }));
