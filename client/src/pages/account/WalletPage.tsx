import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Info, Wallet } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';
import WalletTransactionRow from '@/components/account/WalletTransactionRow';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { useMyWallet } from '@/hooks/wallet';
import { errorMessage } from '@/utils/errorMessage';
import { formatCurrency } from '@/utils/formatCurrency';

/**
 * Ví của khách (`/account/wallet`).
 *
 * Trước đây tiền hoàn **vào được ví mà khách không có chỗ nào để nhìn thấy**: khối huỷ đơn đã cho
 * chọn `refundMethod: 'wallet'` từ lâu, nhưng không màn hình nào đọc `GET /users/me/wallet`.
 *
 * Ví khách chỉ có MỘT số dư (`balanceAvailable`) — không có "chờ tất toán"/"chờ payout" như ví
 * khách sạn (cột `balance_pending` tồn tại nhưng ví khách luôn để 0), và **không rút ra ngân hàng
 * được**: BE chỉ có đường tiêu là trả cho booking. Nên trang nói thẳng điều đó thay vì để khách
 * đi tìm nút "Rút tiền" không tồn tại.
 */
export default function WalletPage() {
  const { t } = useTranslation('account');
  const { data, isLoading, isError, error, refetch } = useMyWallet();

  const balance = data?.balanceAvailable;
  const txns = data?.transactions ?? [];
  const hasBalance = Number(balance ?? 0) > 0;

  return (
    <div>
      <h2 className="font-be-vietnam text-2xl font-bold text-on-surface">
        {t('wallet.title')}
      </h2>

      {isError ? (
        <div className="mt-5 rounded-2xl border border-outline-variant/60 bg-surface p-6 text-center">
          <p className="text-sm text-error">
            {errorMessage(error, t('wallet.loadError'))}
          </p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            {t('wallet.retry')}
          </Button>
        </div>
      ) : (
        <>
          {/* Số dư */}
          <div className="mt-5 rounded-2xl border border-outline-variant/60 bg-surface p-6">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <Wallet className="size-4" aria-hidden="true" />
              <span className="text-sm font-medium">{t('wallet.balanceLabel')}</span>
            </div>
            {isLoading && !data ? (
              <Skeleton className="mt-2 h-9 w-48" />
            ) : (
              <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-emerald-600">
                {formatCurrency(balance)}
              </p>
            )}
            <p className="mt-2 text-sm text-on-surface-variant">
              {t('wallet.balanceHint')}
            </p>

            {hasBalance && (
              <Button variant="cta" size="sm" className="mt-4" asChild>
                <Link to={ROUTES.accountBookings}>{t('wallet.useOnBooking')}</Link>
              </Button>
            )}
          </div>

          {/* Sổ giao dịch */}
          <h3 className="mt-8 font-be-vietnam text-lg font-bold text-on-surface">
            {t('wallet.historyTitle')}
          </h3>

          <ul className="mt-4 space-y-3">
            {isLoading && !data ? (
              Array.from({ length: 3 }).map((_, i) => (
                <li key={i}>
                  <Skeleton className="h-20 w-full rounded-2xl" />
                </li>
              ))
            ) : txns.length === 0 ? (
              <li>
                <EmptyState
                  icon={Wallet}
                  title={t('wallet.emptyTitle')}
                  description={t('wallet.emptyDesc')}
                />
              </li>
            ) : (
              txns.map(txn => <WalletTransactionRow key={txn.id} txn={txn} />)
            )}
          </ul>

          {/*
            BE trả tối đa 50 dòng và KHÔNG phân trang endpoint này — nói rõ khi chạm trần thay vì
            cắt trong im lặng để khách khỏi tưởng giao dịch cũ đã biến mất.
          */}
          {txns.length >= 50 && (
            <p className="mt-4 flex items-start gap-2 text-xs text-on-surface-variant">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <span>{t('wallet.historyLimit')}</span>
            </p>
          )}
        </>
      )}
    </div>
  );
}
