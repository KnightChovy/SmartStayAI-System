import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowDownLeft, ArrowUpRight, Coins } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/cn';
import { formatDateShort } from '@/utils/formatDate';
import { formatCurrency } from '@/utils/formatCurrency';
import type { CustomerWalletTransaction } from '@/types/wallet.types';

interface WalletTransactionRowProps {
  txn: CustomerWalletTransaction;
}

/**
 * Icon + nhãn theo loại giao dịch, có **nhánh dự phòng** cho giá trị BE thêm về sau.
 *
 * Cố ý KHÔNG dùng `Record<CustomerWalletTxnType, …>` như bên partner: ở đó một khoá thiếu làm
 * `undefined.icon` ném lỗi và vỡ cả thẻ. Tra bằng `??` thì loại lạ chỉ hiện nhãn trung tính.
 */
const TXN_META: Partial<
  Record<string, { icon: LucideIcon; labelKey: 'refund' | 'spend' | 'adjustment' }>
> = {
  refund: { icon: ArrowDownLeft, labelKey: 'refund' },
  spend: { icon: ArrowUpRight, labelKey: 'spend' },
  adjustment: { icon: Coins, labelKey: 'adjustment' },
};

export default function WalletTransactionRow({ txn }: WalletTransactionRowProps) {
  const { t } = useTranslation('account');
  const meta = TXN_META[txn.type];
  const Icon = meta?.icon ?? Coins;
  // `amount` của BE đã mang sẵn dấu ⇒ suy chiều tiền từ chính nó, không suy từ `type`
  // (`adjustment` đi cả hai chiều).
  const isCredit = Number(txn.amount) >= 0;

  return (
    <li className="flex items-start gap-3 rounded-2xl border border-outline-variant/60 bg-surface p-4">
      <span
        className={cn(
          'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full',
          isCredit ? 'bg-emerald-50 text-emerald-600' : 'bg-surface-container text-on-surface-variant'
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-on-surface">
          {meta ? t(`wallet.txn.${meta.labelKey}`) : txn.type}
        </p>
        {txn.description && (
          <p className="mt-0.5 text-sm text-on-surface-variant">{txn.description}</p>
        )}
        <p className="mt-1 text-xs text-on-surface-variant">
          {formatDateShort(txn.createdAt)}
          {txn.bookingId && (
            <>
              {' · '}
              <Link
                to={ROUTES.accountBookingDetail(txn.bookingId)}
                className="font-medium text-primary hover:underline"
              >
                {t('wallet.viewBooking')}
              </Link>
            </>
          )}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p
          className={cn(
            'whitespace-nowrap text-sm font-bold tabular-nums',
            isCredit ? 'text-emerald-600' : 'text-on-surface'
          )}
        >
          {isCredit && '+'}
          {formatCurrency(txn.amount)}
        </p>
        <p className="mt-0.5 whitespace-nowrap text-xs text-on-surface-variant">
          {t('wallet.balanceAfter', { amount: formatCurrency(txn.balanceAfter) })}
        </p>
      </div>
    </li>
  );
}
