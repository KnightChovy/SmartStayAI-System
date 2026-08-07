import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Building2, Info, Loader2, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';
import { useCancelBooking, useRefundPreview } from '@/hooks/bookings';
import type { CancellationTier, RefundBankAccount, RefundMethod } from '@/types/booking.types';
import {
  ACCOUNT_ERROR_KEYS,
  CANCEL_REASON_MAX,
  isAccountErrorCode,
  refundBankAccountSchema,
} from '@/validations/account.validation';
import { errorMessage } from '@/utils/errorMessage';
import { formatCurrency } from '@/utils/formatCurrency';

interface CancelBookingPanelProps {
  bookingId: string;
  onClose: () => void;
  /** Đóng khối sau khi huỷ thành công. */
  onCancelled: () => void;
}

/** `dd/MM/yyyy HH:mm` theo giờ máy — mốc đổi bậc là một thời điểm thật, không phải một ngày. */
function formatMoment(iso: string): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(at.getDate())}/${pad(at.getMonth() + 1)}/${at.getFullYear()} ${pad(at.getHours())}:${pad(at.getMinutes())}`;
}

/**
 * Khối huỷ đặt phòng — hiện **số tiền sẽ được hoàn TRƯỚC KHI** khách bấm huỷ.
 *
 * Vì sao tách riêng và vì sao phải gọi `refund-preview`: huỷ phòng **không hoàn tác được**, mà số
 * tiền hoàn lại phụ thuộc vào **thời điểm** (chính sách bậc thang — qua một mốc là mức hoàn tụt
 * xuống). Trước đây khách bấm Huỷ mà không biết mất bao nhiêu, chỉ biết sau khi đã mất. BE tính
 * xem trước bằng đúng hàm dùng lúc huỷ thật, nên con số ở đây **chính là** con số sẽ được hoàn.
 */
export default function CancelBookingPanel({
  bookingId,
  onClose,
  onCancelled,
}: CancelBookingPanelProps) {
  const { t } = useTranslation(['account', 'common']);
  const preview = useRefundPreview(bookingId);
  const cancelBooking = useCancelBooking();

  const [reason, setReason] = useState('');
  const [refundMethod, setRefundMethod] = useState<RefundMethod>('wallet');
  const [bank, setBank] = useState<RefundBankAccount>({
    accountNumber: '',
    bankName: '',
    accountHolder: '',
  });
  const [bankError, setBankError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  /** "Trước 30 ngày" / "Trước 48 giờ" / "Tới sát giờ nhận phòng" — đọc bằng đơn vị người ta dùng. */
  const tierLabel = (tier: CancellationTier) => {
    if (tier.minHoursBefore === 0) return t('account:cancel.tierUntilCheckIn');
    if (tier.minHoursBefore % 24 === 0) {
      return t('account:cancel.tierDays', { count: tier.minHoursBefore / 24 });
    }
    return t('account:cancel.tierHours', { count: tier.minHoursBefore });
  };

  const data = preview.data;
  const refundAmount = Number(data?.refundAmount ?? 0);
  const penaltyAmount = Number(data?.penaltyAmount ?? 0);
  // Chỉ hỏi nơi nhận tiền khi thật sự có tiền để hoàn — đơn chưa trả hoặc hoàn 0đ thì hỏi là thừa.
  const willRefund = Boolean(data?.isPaid) && refundAmount > 0;

  const handleCancel = async () => {
    setSubmitError(null);
    let bankAccount: RefundBankAccount | undefined;

    if (willRefund && refundMethod === 'bank') {
      const parsed = refundBankAccountSchema.safeParse(bank);
      if (!parsed.success) {
        // `t()` của dự án bị siết theo union key nên không nhận `string` thô — tra qua bảng mã
        // rồi mới dịch (cùng cách `ProfileForm` đang làm). Mã lạ ⇒ không hiện gì còn hơn hiện rác.
        const code = parsed.error.issues[0].message;
        setBankError(isAccountErrorCode(code) ? t(`account:${ACCOUNT_ERROR_KEYS[code]}`) : null);
        return;
      }
      setBankError(null);
      bankAccount = parsed.data;
    }

    try {
      const cancelled = await cancelBooking.mutateAsync({
        bookingId,
        reason: reason.trim() || undefined,
        // Chỉ gửi `refundMethod: 'bank'` khi có tiền để hoàn: BE khai `bankAccount` là
        // `forbidden` với method 'wallet', gửi thừa là 400.
        ...(willRefund && refundMethod === 'bank'
          ? { refundMethod: 'bank' as const, bankAccount }
          : {}),
      });
      // Nói ngay tiền sẽ về ĐÂU. Đây là lúc duy nhất FE biết chắc: `booking.payments[].refunds[]`
      // của các lần tải sau KHÔNG mang `refundMethod`. Không nói thì khách chọn "vào ví" xong
      // ngồi chờ tiền về ngân hàng.
      if (cancelled.refund) {
        const amount = formatCurrency(cancelled.refund.amount);
        toast.success(
          cancelled.refund.refundMethod === 'wallet'
            ? t('account:cancel.sentToWallet', { amount })
            : t('account:cancel.sentToBank', { amount })
        );
      }
      onCancelled();
    } catch (err) {
      setSubmitError(errorMessage(err, t('account:detail.cancelError')));
    }
  };

  return (
    <div className="rounded-2xl border border-error/30 bg-error/5 p-5">
      <h3 className="font-semibold text-on-surface">{t('account:detail.cancelTitle')}</h3>

      {/* ── Số tiền: thứ khách cần biết TRƯỚC khi quyết định ─────────────────── */}
      {preview.isLoading && <Skeleton className="mt-3 h-24 w-full rounded-xl" />}

      {preview.isError && (
        <p className="mt-3 flex gap-2 rounded-xl bg-surface p-3 text-sm text-error">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          {t('account:cancel.previewError')}
        </p>
      )}

      {data && (
        <div className="mt-3 space-y-3">
          {/* Không huỷ được thì nói ngay, đừng để khách điền hết form rồi mới ăn lỗi. */}
          {!data.canCancel && data.cannotCancelReason && (
            <p className="flex gap-2 rounded-xl bg-surface p-3 text-sm text-error">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              {data.cannotCancelReason}
            </p>
          )}

          <div className="rounded-xl bg-surface p-4">
            {!data.isPaid ? (
              <p className="flex gap-2 text-sm text-on-surface-variant">
                <Info className="mt-0.5 size-4 shrink-0" />
                {t('account:cancel.notPaid')}
              </p>
            ) : (
              <>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-sm text-on-surface-variant">
                    {t('account:cancel.youGetBack')}
                  </span>
                  <span
                    className={cn(
                      'text-xl font-bold',
                      refundAmount > 0 ? 'text-emerald-600' : 'text-on-surface-variant'
                    )}
                  >
                    {formatCurrency(refundAmount)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-on-surface-variant">
                  {t('account:cancel.ofPaid', {
                    percent: data.refundPercent,
                    paid: formatCurrency(Number(data.paidAmount)),
                  })}
                </p>
                {penaltyAmount > 0 && (
                  <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-outline-variant/30 pt-2">
                    <span className="text-sm text-on-surface-variant">
                      {t('account:cancel.hotelKeeps')}
                    </span>
                    <span className="text-sm font-semibold text-on-surface">
                      {formatCurrency(penaltyAmount)}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/*
            Cảnh báo mốc kế: đây là lý do duy nhất khiến "huỷ bây giờ" khác "huỷ chiều nay".
            Chỉ hiện khi mức hoàn sắp TỤT — bậc kế bằng hoặc cao hơn thì không phải chuyện gấp.
          */}
          {data.nextTier && data.nextTier.refundPercent < data.refundPercent && (
            <p className="flex gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              {t('account:cancel.nextTierWarning', {
                at: formatMoment(data.nextTier.changesAt),
                percent: data.nextTier.refundPercent,
              })}
            </p>
          )}

          {/* Bảng bậc thang — để khách tự đối chiếu thay vì phải tin một con số trần trụi. */}
          {data.tiers.length > 1 && (
            <details className="rounded-xl bg-surface p-3">
              <summary className="cursor-pointer text-sm font-medium text-on-surface">
                {t('account:cancel.policyLadder')}
              </summary>
              <ul className="mt-2 space-y-1 text-sm">
                {data.tiers.map(tier => {
                  const active = data.appliedTier?.minHoursBefore === tier.minHoursBefore;
                  return (
                    <li
                      key={tier.minHoursBefore}
                      className={cn(
                        'flex justify-between gap-4 rounded-lg px-2 py-1',
                        active ? 'bg-primary/10 font-semibold text-on-surface' : 'text-on-surface-variant'
                      )}
                    >
                      <span>{tierLabel(tier)}</span>
                      <span>
                        {t('account:cancel.refundPercent', { percent: tier.refundPercent })}
                        {active && ` · ${t('account:cancel.currentTier')}`}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </details>
          )}

          {/* ── Nơi nhận tiền hoàn ─────────────────────────────────────────────
              BE mặc định 'wallet'. Không hỏi thì khách bị cộng vào ví mà không hề biết. */}
          {willRefund && (
            <div className="rounded-xl bg-surface p-4">
              <p className="text-sm font-medium text-on-surface">
                {t('account:cancel.refundMethodTitle')}
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {(
                  [
                    { value: 'wallet', icon: Wallet, label: t('account:cancel.methodWallet'), hint: t('account:cancel.methodWalletHint') },
                    { value: 'bank', icon: Building2, label: t('account:cancel.methodBank'), hint: t('account:cancel.methodBankHint') },
                  ] as const
                ).map(option => {
                  const Icon = option.icon;
                  const active = refundMethod === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setRefundMethod(option.value)}
                      aria-pressed={active}
                      className={cn(
                        'rounded-xl border p-3 text-left transition-colors',
                        active
                          ? 'border-primary bg-primary/5'
                          : 'border-outline-variant/40 hover:border-outline-variant'
                      )}
                    >
                      <span className="flex items-center gap-2 text-sm font-medium text-on-surface">
                        <Icon className="size-4" />
                        {option.label}
                      </span>
                      <span className="mt-1 block text-xs leading-snug text-on-surface-variant">
                        {option.hint}
                      </span>
                    </button>
                  );
                })}
              </div>

              {refundMethod === 'bank' && (
                <div className="mt-3 space-y-2">
                  <Input
                    value={bank.accountNumber}
                    inputMode="numeric"
                    maxLength={30}
                    onChange={e => setBank({ ...bank, accountNumber: e.target.value })}
                    placeholder={t('account:cancel.accountNumber')}
                    aria-label={t('account:cancel.accountNumber')}
                  />
                  <Input
                    value={bank.bankName}
                    maxLength={100}
                    onChange={e => setBank({ ...bank, bankName: e.target.value })}
                    placeholder={t('account:cancel.bankName')}
                    aria-label={t('account:cancel.bankName')}
                  />
                  <Input
                    value={bank.accountHolder}
                    maxLength={100}
                    onChange={e => setBank({ ...bank, accountHolder: e.target.value })}
                    placeholder={t('account:cancel.accountHolder')}
                    aria-label={t('account:cancel.accountHolder')}
                  />
                  {bankError && <p className="text-sm text-error">{bankError}</p>}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <p className="mt-3 text-sm text-on-surface-variant">{t('account:detail.cancelDesc')}</p>

      {/* Trần 500 khớp `cancelBooking` của BE (`reason: Joi.string().max(500)`) — cắt tại
          chỗ gõ thay vì để khách viết dài rồi mới ăn 400 lúc bấm Xác nhận huỷ. */}
      <textarea
        rows={3}
        value={reason}
        maxLength={CANCEL_REASON_MAX}
        onChange={e => setReason(e.target.value)}
        placeholder={t('account:detail.cancelReasonPlaceholder')}
        className="mt-3 w-full rounded-xl border border-outline-variant/40 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
      />
      <p className="mt-1 text-right text-xs text-on-surface-variant">
        {reason.length}/{CANCEL_REASON_MAX}
      </p>

      {submitError && <p className="mt-2 text-sm text-error">{submitError}</p>}

      <div className="mt-3 flex gap-3">
        <Button variant="outline" onClick={onClose}>
          {t('account:detail.keepBooking')}
        </Button>
        <Button
          variant="destructive"
          // Chờ xem trước xong mới cho bấm: mời khách huỷ trước khi biết mất bao nhiêu tiền
          // chính là vấn đề mà khối này sinh ra để giải quyết.
          disabled={cancelBooking.isPending || preview.isLoading || data?.canCancel === false}
          onClick={() => void handleCancel()}
        >
          {cancelBooking.isPending && <Loader2 className="mr-1.5 size-4 animate-spin" />}
          {cancelBooking.isPending
            ? t('account:detail.cancelling')
            : t('account:detail.confirmCancel')}
        </Button>
      </div>
    </div>
  );
}
