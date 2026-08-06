import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Loader2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { TextareaField } from '@/components/hotel-partner/shared/form-controls';
import { ManagerModal } from '@/components/manager/shared/ManagerModal';
import {
  COMMISSION_STATUS_CONFIG,
  formatRate,
} from '@/components/shared/commission-labels';
import { useReviewCommissionRequest } from '@/hooks/platform-manager';
import { cn } from '@/lib/cn';
import { errorMessage } from '@/utils/errorMessage';
import { formatDate } from '@/utils/formatDate';
import {
  AGREEMENT_MONTHS,
  rejectCommissionRequestFormSchema,
  type RejectCommissionRequestFormValues,
} from '@/validations/commission-rate.validation';
import type { CommissionRateRequest } from '@/types/commission-rate.types';

interface ReviewRequestModalProps {
  request: CommissionRateRequest;
  onClose: () => void;
}

type Mode = 'view' | 'approve' | 'reject';

/**
 * Chi tiết một đơn xin giảm hoa hồng + hai hành động Duyệt / Từ chối.
 *
 * Duyệt phải qua một bước xác nhận vì tạo ra ưu đãi 12 tháng KHÔNG SỬA ĐƯỢC.
 * Từ chối bắt buộc nhập lý do (Joi của backend cũng `required`) — và tuyệt đối
 * KHÔNG gửi kèm `rejectionReason` khi approve (backend khai `forbidden`, gửi là 400),
 * nên payload dựng tay theo union chứ không spread form values.
 */
export function ReviewRequestModal({
  request,
  onClose,
}: ReviewRequestModalProps) {
  const [mode, setMode] = useState<Mode>('view');
  const review = useReviewCommissionRequest();
  const isPending = review.isPending;
  const canReview = request.status === 'pending';
  const cfg = COMMISSION_STATUS_CONFIG[request.status];

  const methods = useForm<RejectCommissionRequestFormValues>({
    resolver: zodResolver(rejectCommissionRequestFormSchema),
    defaultValues: { rejectionReason: '' },
  });

  const approve = async () => {
    try {
      await review.mutateAsync({
        requestId: request.id,
        dto: { decision: 'approve' },
      });
      toast.success(
        `Approved — ${request.hotel.name} is on ${formatRate(request.requestedRate)} for ${AGREEMENT_MONTHS} months`
      );
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not approve this request'));
      onClose();
    }
  };

  const reject = methods.handleSubmit(async values => {
    try {
      await review.mutateAsync({
        requestId: request.id,
        dto: {
          decision: 'reject',
          rejectionReason: values.rejectionReason.trim(),
        },
      });
      toast.success('Request rejected — the partner will be notified');
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not reject this request'));
      onClose();
    }
  });

  const footer = (() => {
    if (!canReview) {
      return (
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      );
    }
    if (mode === 'approve') {
      return (
        <>
          <Button
            variant="outline"
            onClick={() => setMode('view')}
            disabled={isPending}
          >
            Back
          </Button>
          <Button
            onClick={approve}
            disabled={isPending}
            className="bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Confirm approval
          </Button>
        </>
      );
    }
    if (mode === 'reject') {
      return (
        <>
          <Button
            variant="outline"
            onClick={() => setMode('view')}
            disabled={isPending}
          >
            Back
          </Button>
          <Button
            onClick={reject}
            disabled={isPending}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Confirm rejection
          </Button>
        </>
      );
    }
    return (
      <>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button
          onClick={() => setMode('reject')}
          className="border border-red-200 bg-white text-red-600 hover:bg-red-50"
        >
          <XCircle className="mr-1.5 h-4 w-4" />
          Reject
        </Button>
        <Button
          onClick={() => setMode('approve')}
          className="bg-emerald-600 text-white hover:bg-emerald-700"
        >
          <CheckCircle2 className="mr-1.5 h-4 w-4" />
          Approve
        </Button>
      </>
    );
  })();

  return (
    <ManagerModal
      open
      onClose={onClose}
      title={`Commission request · ${request.hotel.name}`}
      description={`${request.hotel.city} · submitted ${formatDate(request.createdAt)}`}
      icon={FileText}
      size="md"
      footer={footer}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold',
              cfg.class
            )}
          >
            {cfg.label}
          </span>
          {request.isRenewal && (
            <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
              Renewal
            </span>
          )}
        </div>

        {/* Mức đối chiếu → mức xin */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-xs font-medium text-slate-500">
              Rate if not approved
            </p>
            <p className="mt-0.5 text-2xl font-bold tabular-nums text-slate-700">
              {formatRate(request.currentRate)}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
            <p className="text-xs font-medium text-emerald-700">
              Proposed rate
            </p>
            <p className="mt-0.5 text-2xl font-bold tabular-nums text-emerald-700">
              {formatRate(request.requestedRate)}
            </p>
          </div>
        </div>

        {request.isRenewal && (
          <p className="rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-xs text-blue-900">
            This is a <strong>renewal</strong>: the comparison is the base rate
            that applies AFTER the current agreement expires, not the rate the
            hotel enjoys today. If approved, the new rate starts the day after
            expiry — the remaining time is not cut short.
          </p>
        )}

        {/* Lý do của đối tác */}
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Partner&apos;s reason
          </h3>
          <p className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
            {request.reason}
          </p>
        </div>

        {/* Thông tin đơn */}
        <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200">
          <Row
            label="Submitted by"
            value={
              request.requestedByUser.fullName ?? request.requestedByUser.email
            }
          />
          <Row label="Email" value={request.requestedByUser.email} />
          <Row label="Submitted" value={formatDate(request.createdAt)} />
          {request.reviewedAt && (
            <Row
              label="Reviewed"
              value={`${request.reviewedByUser?.fullName ?? 'System'} · ${formatDate(request.reviewedAt)}`}
            />
          )}
          {request.rejectionReason && (
            <Row label="Rejection reason" value={request.rejectionReason} />
          )}
          {request.agreement && (
            <Row
              label="Agreement created"
              value={`${formatRate(request.agreement.rate)} · ${formatDate(request.agreement.effectiveFrom)} → ${
                request.agreement.effectiveTo
                  ? formatDate(request.agreement.effectiveTo)
                  : '—'
              }`}
            />
          )}
        </dl>

        {/* Bước xác nhận duyệt */}
        {canReview && mode === 'approve' && (
          <div className="flex gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-xs text-amber-900">
              This puts <strong>{request.hotel.name}</strong> on{' '}
              <strong>{formatRate(request.requestedRate)}</strong> for{' '}
              <strong>{AGREEMENT_MONTHS} months</strong> and cannot be changed
              until it expires.
              {request.isRenewal
                ? ' It starts the day after the current agreement expires.'
                : ' It takes effect today.'}
            </p>
          </div>
        )}

        {/* Bước từ chối */}
        {canReview && mode === 'reject' && (
          <FormProvider {...methods}>
            <form onSubmit={reject} className="space-y-3">
              <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3">
                <p className="text-xs text-red-800">
                  The partner is notified with the reason below and{' '}
                  <strong>must wait 7 days</strong> before submitting again.
                </p>
              </div>
              <TextareaField<RejectCommissionRequestFormValues>
                name="rejectionReason"
                label="Reason for rejection"
                rows={4}
                placeholder="e.g. Not enough evidence of business performance over the last 6 months."
                hint="Required · max 500 characters. The partner will read this."
              />
            </form>
          </FormProvider>
        )}
      </div>
    </ManagerModal>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex gap-4 px-4 py-2.5">
      <dt className="w-36 shrink-0 text-xs font-medium text-slate-500">
        {label}
      </dt>
      <dd className="min-w-0 flex-1 text-sm text-slate-700">
        {value ? (
          value
        ) : (
          <span className="italic text-slate-400">Not provided</span>
        )}
      </dd>
    </div>
  );
}
