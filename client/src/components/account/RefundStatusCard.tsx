import { useTranslation } from 'react-i18next';
import { Banknote, Check, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { BookingRefund, RefundStatus } from '@/types/payment.types';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDateShort } from '@/utils/formatDate';

/** Ba bước tiền đi qua trước khi về tới khách. `rejected` nằm ngoài luồng này. */
const FLOW = ['pending', 'approved', 'processed'] as const;

const STATUS_CLASS: Record<RefundStatus, string> = {
  pending: 'bg-premium-gold/15 text-premium-gold',
  approved: 'bg-primary/15 text-primary',
  processed: 'bg-emerald-500/15 text-emerald-600',
  rejected: 'bg-error/15 text-error',
};

/**
 * Theo dõi yêu cầu hoàn tiền của khách: chờ khách sạn duyệt → khách sạn đã duyệt →
 * đã chuyển khoản, hoặc bị từ chối kèm lý do. Tiền KHÔNG về ngay khi huỷ.
 */
export default function RefundStatusCard({ refund }: { refund: BookingRefund }) {
  const { t } = useTranslation('account');
  const currentStep = FLOW.indexOf(refund.status as (typeof FLOW)[number]);
  const isRejected = refund.status === 'rejected';

  /** Mốc thời gian đã có thật cho từng bước (chưa tới bước đó thì bỏ trống). */
  const stepDate: Record<(typeof FLOW)[number], string | null | undefined> = {
    pending: refund.createdAt,
    approved: refund.reviewedAt,
    processed: refund.processedAt,
  };

  return (
    <div className="rounded-2xl border border-outline-variant/30 bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-be-vietnam font-semibold text-on-surface">
          <Banknote className="size-4" />
          {t('refund.title')}
        </h3>
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
            STATUS_CLASS[refund.status]
          )}
        >
          {t(`refund.status.${refund.status}`)}
        </span>
      </div>

      <p className="mt-3 text-sm text-on-surface-variant">
        {t('refund.amountLabel')}
        <strong className="text-on-surface">{formatCurrency(refund.amount)}</strong>
      </p>
      {refund.reason && (
        <p className="mt-1 text-sm text-on-surface-variant">
          {t('refund.reasonLabel', { reason: refund.reason })}
        </p>
      )}

      {isRejected ? (
        <div className="mt-4 rounded-xl bg-error/10 p-3 text-sm text-error">
          <p className="flex items-center gap-2 font-semibold">
            <XCircle className="size-4" />
            {t('refund.rejectedTitle')}
          </p>
          <p className="mt-1">
            {refund.rejectionReason || t('refund.rejectedNoReason')}
          </p>
        </div>
      ) : (
        <ol className="mt-4 space-y-3">
          {FLOW.map((step, index) => {
            const done = index < currentStep;
            const active = index === currentStep;
            const date = stepDate[step];
            return (
              <li key={step} className="flex gap-3">
                <span
                  className={cn(
                    'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full',
                    done && 'bg-emerald-500/15 text-emerald-600',
                    active && 'bg-primary/15 text-primary',
                    !done && !active && 'bg-outline-variant/30 text-on-surface-variant'
                  )}
                >
                  {done ? (
                    <Check className="size-3.5" />
                  ) : active ? (
                    <Clock className="size-3.5" />
                  ) : (
                    <span className="size-1.5 rounded-full bg-current" />
                  )}
                </span>
                <div className="min-w-0">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      done || active ? 'text-on-surface' : 'text-on-surface-variant'
                    )}
                  >
                    {t(`refund.steps.${step}.title`)}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {t(`refund.steps.${step}.desc`)}
                    {(done || active) && date && ` · ${formatDateShort(date)}`}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
