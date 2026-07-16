import { Controller, FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Banknote,
  Loader2,
  Mail,
  Phone,
  User,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  REFUND_STATUS_CONFIG,
  isPartialRefund,
  isSystemReviewed,
} from '@/components/shared/refund-labels';
import { useProcessRefund } from '@/hooks/refunds';
import { cn } from '@/lib/cn';
import { errorMessage } from '@/utils/errorMessage';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import {
  processRefundFormSchema,
  type ProcessRefundFormValues,
} from '@/validations/refund.validation';
import type { Refund } from '@/types/refund.types';

interface RefundPayoutModalProps {
  refund: Refund;
  onClose: () => void;
}

/**
 * Chi tiết một yêu cầu hoàn tiền cho Platform Manager + form đánh dấu ĐÃ CHUYỂN KHOẢN.
 *
 * Form chỉ hiện khi `status === 'approved'` — đúng ràng buộc của BE (`pending` phải để khách sạn
 * duyệt trước; `processed`/`rejected` thì không còn gì để làm).
 */
export function RefundPayoutModal({ refund, onClose }: RefundPayoutModalProps) {
  const processMutation = useProcessRefund();
  const isPending = processMutation.isPending;
  const canProcess = refund.status === 'approved';
  const cfg = REFUND_STATUS_CONFIG[refund.status];
  const { booking } = refund.payment;

  const methods = useForm<ProcessRefundFormValues>({
    resolver: zodResolver(processRefundFormSchema),
    defaultValues: { refundTransactionId: '', confirmed: false },
  });
  const {
    register,
    control,
    formState: { errors },
  } = methods;

  const onSubmit = methods.handleSubmit(async values => {
    try {
      await processMutation.mutateAsync({
        refundId: refund.id,
        // `confirmed` chỉ là guard ở client — BE không nhận field này (Joi sẽ 400 nếu gửi kèm).
        dto: { refundTransactionId: values.refundTransactionId.trim() },
      });
      toast.success(`Refund marked as transferred · ${formatCurrency(refund.amount)}`);
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to mark this refund as transferred'));
      onClose();
    }
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="shrink-0 rounded-lg bg-role-manager-light p-2">
              <Banknote className="h-5 w-5 text-role-manager-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate font-bold text-slate-900">
                Refund · {booking.bookingCode}
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                {booking.hotel.name} · {booking.hotel.city}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold',
                cfg.class
              )}
            >
              {cfg.label}
            </span>
            {isPartialRefund(refund) && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                Partial refund
              </span>
            )}
            {isSystemReviewed(refund) && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                Auto-approved by system
              </span>
            )}
          </div>

          {/* Số tiền phải chuyển */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-xs font-medium text-slate-500">Amount to transfer</p>
            <p className="mt-0.5 text-3xl font-bold tracking-tight tabular-nums text-red-600">
              {formatCurrency(refund.amount)}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Guest paid {formatCurrency(refund.payment.amount)} · hotel keeps{' '}
              {formatCurrency(Number(refund.payment.amount) - Number(refund.amount))}
            </p>
          </div>

          {/* Người nhận tiền */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Transfer to
            </h3>
            <div className="space-y-1.5 rounded-xl border border-slate-200 px-4 py-3">
              <p className="flex items-center gap-2 text-sm font-medium text-slate-800">
                <User className="h-3.5 w-3.5 text-slate-400" />
                {refund.requesterUser.fullName}
              </p>
              <p className="flex items-center gap-2 text-sm text-slate-600">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                {refund.requesterUser.email}
              </p>
              <p className="flex items-center gap-2 text-sm text-slate-600">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                {refund.requesterUser.phone ?? (
                  <span className="italic text-slate-400">No phone number</span>
                )}
              </p>
              <p className="pt-1 text-xs text-slate-400">
                The guest&apos;s bank account is not stored on the platform — get the payout
                details from the guest before transferring.
              </p>
            </div>
          </div>

          {/* Bối cảnh yêu cầu */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Request
            </h3>
            <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200">
              <Row label="Guest's reason" value={refund.reason} />
              <Row label="Requested" value={formatDate(refund.createdAt)} />
              <Row
                label="Approved by"
                value={
                  refund.reviewedAt
                    ? `${refund.reviewer?.fullName ?? 'System (no response in 3 days)'} · ${formatDate(refund.reviewedAt)}`
                    : null
                }
              />
              {refund.rejectionReason && (
                <Row label="Rejection reason" value={refund.rejectionReason} />
              )}
              <Row
                label="Stay"
                value={`${formatDate(booking.checkInDate)} → ${formatDate(booking.checkOutDate)}`}
              />
              {refund.processedAt && (
                <>
                  <Row label="Transferred at" value={formatDate(refund.processedAt)} />
                  <Row label="Transaction id" value={refund.refundTransactionId} />
                </>
              )}
            </dl>
          </div>

          {/* Form chuyển khoản */}
          {canProcess && (
            <FormProvider {...methods}>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3">
                  <p className="text-xs text-red-800">
                    Only submit this <strong>after</strong> the money has actually left the
                    platform account. It recalculates the hotel&apos;s commission and debits their
                    wallet — <strong>it cannot be undone.</strong>
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="refundTransactionId" className="text-sm font-medium text-slate-700">
                    Bank / gateway transaction id
                    <span className="ml-0.5 text-red-500">*</span>
                  </Label>
                  <Input
                    id="refundTransactionId"
                    placeholder="e.g. FT26071612345678"
                    aria-invalid={!!errors.refundTransactionId}
                    {...register('refundTransactionId')}
                  />
                  {errors.refundTransactionId ? (
                    <p className="text-xs text-red-500">{errors.refundTransactionId.message}</p>
                  ) : (
                    <p className="text-xs text-slate-400">
                      The real reference from your bank — kept for reconciliation.
                    </p>
                  )}
                </div>

                <Controller
                  control={control}
                  name="confirmed"
                  render={({ field }) => (
                    <div>
                      <label className="flex cursor-pointer items-start gap-3">
                        <span className="mt-0.5 shrink-0">
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={checked => field.onChange(checked === true)}
                            aria-invalid={!!errors.confirmed}
                          />
                        </span>
                        <span className="text-sm text-slate-700">
                          I have already transferred {formatCurrency(refund.amount)} to{' '}
                          {refund.requesterUser.fullName}.
                        </span>
                      </label>
                      {errors.confirmed && (
                        <p className="mt-1 text-xs text-red-500">{errors.confirmed.message}</p>
                      )}
                    </div>
                  )}
                />
              </form>
            </FormProvider>
          )}

          {refund.status === 'pending' && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs text-amber-800">
              Waiting for <strong>{booking.hotel.name}</strong> to review this request. You can only
              transfer once it is approved — the system auto-approves it if the hotel does not
              respond within 3 days.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            {canProcess ? 'Cancel' : 'Close'}
          </Button>
          {canProcess && (
            <Button
              onClick={onSubmit}
              disabled={isPending}
              className="bg-role-manager-primary text-white hover:bg-role-manager-secondary"
            >
              {isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Mark as transferred
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex gap-4 px-4 py-2.5">
      <dt className="w-36 shrink-0 text-xs font-medium text-slate-500">{label}</dt>
      <dd className="min-w-0 flex-1 text-sm text-slate-700">
        {value ? value : <span className="italic text-slate-400">Not provided</span>}
      </dd>
    </div>
  );
}
