import { CalendarClock, Info, Percent, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/hotel-partner/shared/Pill';
import {
  COMMISSION_SOURCE_CONFIG,
  formatRate,
  isAgreementExpiringSoon,
} from '@/components/shared/commission-labels';
import { cn } from '@/lib/cn';
import { formatDate } from '@/utils/formatDate';
import type { HotelCommissionSummary } from '@/types/commission-rate.types';

interface CurrentRateCardProps {
  summary: HotelCommissionSummary;
  /** Cuộn tới khối nộp đơn — chỉ hiện khi backend cho phép mở đơn gia hạn. */
  onRequestRenewal?: () => void;
}

/** Số ngày đã trôi qua / tổng thời hạn của ưu đãi, dùng cho thanh tiến trình. */
function agreementProgress(from: string, to: string, daysRemaining: number) {
  const total = Math.round(
    (new Date(to).getTime() - new Date(from).getTime()) / 86_400_000
  );
  if (!Number.isFinite(total) || total <= 0) return 0;
  const elapsed = total - daysRemaining;
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

/**
 * Thẻ "mức đang chịu" — khối quan trọng nhất của màn hình.
 *
 * PHÂN BIỆT RÕ hai con số dễ nhầm: `baseRate` là mức nền HÔM NAY, còn `rateAfterExpiry`
 * là mức nền vào NGÀY ƯU ĐÃI HẾT HẠN. Hai số này khác nhau khi Platform Manager đã lên lịch
 * đổi mức nền, nên câu "sau khi hết hạn sẽ về X%" luôn phải dùng `rateAfterExpiry`.
 */
export function CurrentRateCard({
  summary,
  onRequestRenewal,
}: CurrentRateCardProps) {
  const { currentRate, source, baseRate, agreement, canRequest } = summary;
  const sourceCfg = COMMISSION_SOURCE_CONFIG[source];
  const expiringSoon =
    !!agreement && isAgreementExpiringSoon(agreement.daysRemaining);
  const canRenew = canRequest.allowed && canRequest.isRenewal;

  return (
    <div
      className={cn(
        'rounded-xl border bg-white p-6',
        expiringSoon ? 'border-amber-300 bg-amber-50/40' : 'border-slate-200'
      )}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Current commission rate
          </p>
          <div className="mt-1 flex items-end gap-3">
            <span className="text-5xl font-bold leading-none tracking-tight text-slate-900 tabular-nums">
              {formatRate(currentRate)}
            </span>
            <Pill className={cn('mb-1.5', sourceCfg.class)}>
              {sourceCfg.label}
            </Pill>
          </div>
          <p className="mt-2 max-w-md text-xs text-slate-500">
            {sourceCfg.hint}
          </p>
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-role-partner-light">
          <Percent className="h-6 w-6 text-role-partner-primary" />
        </div>
      </div>

      {agreement ? (
        <div className="mt-6 space-y-3 border-t border-slate-200/70 pt-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">
              Special rate · {formatRate(agreement.rate)}
            </span>
            <span
              className={cn(
                'font-semibold tabular-nums',
                expiringSoon ? 'text-amber-700' : 'text-slate-600'
              )}
            >
              {agreement.daysRemaining} day
              {agreement.daysRemaining === 1 ? '' : 's'} left
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                expiringSoon ? 'bg-amber-500' : 'bg-role-partner-primary'
              )}
              style={{
                width: `${agreementProgress(
                  agreement.effectiveFrom,
                  agreement.effectiveTo,
                  agreement.daysRemaining
                )}%`,
              }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span>Started {formatDate(agreement.effectiveFrom)}</span>
            <span>Expires {formatDate(agreement.effectiveTo)}</span>
          </div>

          <div
            className={cn(
              'flex flex-col gap-3 rounded-lg border px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between',
              expiringSoon
                ? 'border-amber-300 bg-amber-100/60'
                : 'border-slate-200 bg-slate-50/70'
            )}
          >
            <p
              className={cn(
                'text-xs',
                expiringSoon ? 'text-amber-900' : 'text-slate-600'
              )}
            >
              After <strong>{formatDate(agreement.effectiveTo)}</strong> this
              hotel moves to{' '}
              <strong>{formatRate(agreement.rateAfterExpiry)}</strong>.
              {agreement.rateAfterExpiry !== baseRate && (
                <>
                  {' '}
                  (Today&apos;s platform base rate is {formatRate(baseRate)} — a
                  new base rate is already scheduled.)
                </>
              )}
            </p>
            {canRenew && onRequestRenewal && (
              <Button
                size="sm"
                onClick={onRequestRenewal}
                className="shrink-0 bg-amber-600 text-white hover:bg-amber-700"
              >
                <TrendingDown className="mr-1.5 h-3.5 w-3.5" />
                Request renewal
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-6 flex items-start gap-2 border-t border-slate-200/70 pt-5 text-xs text-slate-500">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
          <p>
            This hotel is on the platform base rate ({formatRate(baseRate)}). If
            a special rate is approved, it replaces the base rate for exactly 12
            months.
          </p>
        </div>
      )}

      <div className="mt-4 flex items-start gap-2 text-xs text-slate-400">
        <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>
          Commission is locked in <strong>when the money arrives</strong>, not
          when the guest books. A booking made today but paid next month is
          charged next month&apos;s rate.
        </p>
      </div>
    </div>
  );
}
