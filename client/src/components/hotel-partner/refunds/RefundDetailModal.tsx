import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/hotel-partner/shared/Modal';
import { Pill } from '@/components/hotel-partner/shared/Pill';
import {
  REFUND_STATUS_CONFIG,
  isPartialRefund,
  isSystemReviewed,
  reviewDeadlineInfo,
} from '@/components/shared/refund-labels';
import { PAYMENT_METHOD_LABELS } from '@/components/hotel-partner/bookings/labels';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import type { Refund } from '@/types/refund.types';

interface RefundDetailModalProps {
  open: boolean;
  onClose: () => void;
  refund: Refund;
  onApprove: () => void;
  onReject: () => void;
}

export function RefundDetailModal({
  open,
  onClose,
  refund,
  onApprove,
  onReject,
}: RefundDetailModalProps) {
  const cfg = REFUND_STATUS_CONFIG[refund.status];
  const { booking } = refund.payment;
  const partial = isPartialRefund(refund);
  const systemReviewed = isSystemReviewed(refund);
  const isPending = refund.status === 'pending';
  const deadline = isPending ? reviewDeadlineInfo(refund.createdAt) : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Refund · ${booking.bookingCode}`}
      description={`Requested ${formatDate(refund.createdAt)}`}
      icon={RotateCcw}
      size="lg"
      footer={
        isPending ? (
          <>
            <Button
              variant="outline"
              onClick={onReject}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <XCircle className="mr-1.5 h-4 w-4" />
              Reject
            </Button>
            <Button
              onClick={onApprove}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <CheckCircle2 className="mr-1.5 h-4 w-4" />
              Approve refund
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )
      }
    >
      <div className="space-y-5">
        {/* Trạng thái + số tiền */}
        <div className="flex flex-wrap items-center gap-2">
          <Pill className={cfg.class}>{cfg.label}</Pill>
          {partial && <Pill tone="amber">Partial refund</Pill>}
          {systemReviewed && <Pill tone="slate">Auto-approved by system</Pill>}
          {deadline && (
            <Pill
              className={
                deadline.urgent
                  ? 'bg-red-100 text-red-700'
                  : 'bg-slate-100 text-slate-600'
              }
            >
              {deadline.label}
            </Pill>
          )}
        </div>

        <p className="text-xs text-slate-500">{cfg.hint}</p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Amount
            label="Guest paid"
            value={formatCurrency(refund.payment.amount)}
            tone="text-slate-700"
          />
          <Amount
            label="To refund"
            value={formatCurrency(refund.amount)}
            tone="text-red-600"
          />
          <Amount
            label="Hotel keeps"
            value={formatCurrency(
              Number(refund.payment.amount) - Number(refund.amount)
            )}
            tone="text-emerald-600"
          />
        </div>

        {isPending && (
          <div
            className={cn(
              'rounded-lg border px-3.5 py-3 text-xs',
              deadline?.urgent
                ? 'border-red-200 bg-red-50 text-red-800'
                : 'border-amber-200 bg-amber-50 text-amber-800'
            )}
          >
            This amount comes from your own cancellation policy. If you do not
            respond by{' '}
            <strong>
              {deadline ? formatDate(deadline.deadline.toISOString()) : '—'}
            </strong>
            , the system approves it automatically. Reviewing is for exceptions,
            not a veto.
          </div>
        )}

        <Section title="Refund request">
          <Row label="Guest's reason" value={refund.reason} />
          {refund.rejectionReason && (
            <Row label="Rejection reason" value={refund.rejectionReason} />
          )}
          <Row
            label="Reviewed by"
            value={
              refund.reviewedAt
                ? `${refund.reviewer?.fullName ?? 'System (auto-approved)'} · ${formatDate(refund.reviewedAt)}`
                : null
            }
          />
          <Row
            label="Transferred"
            value={
              refund.processedAt
                ? `${formatDate(refund.processedAt)} · ref ${refund.refundTransactionId ?? '—'}`
                : null
            }
          />
        </Section>

        <Section title="Guest">
          <Row label="Name" value={refund.requesterUser.fullName} />
          <Row label="Email" value={refund.requesterUser.email} />
          <Row label="Phone" value={refund.requesterUser.phone} />
        </Section>

        <Section title="Booking">
          <Row label="Code" value={booking.bookingCode} />
          <Row label="Room type" value={booking.roomType.name} />
          <Row
            label="Stay"
            value={`${formatDate(booking.checkInDate)} → ${formatDate(booking.checkOutDate)}`}
          />
          <Row
            label="Booking total"
            value={formatCurrency(booking.totalAmount)}
          />
          <Row
            label="Cancelled at"
            value={booking.cancelledAt ? formatDate(booking.cancelledAt) : null}
          />
          <Row label="Cancellation reason" value={booking.cancellationReason} />
        </Section>

        <Section title="Payment">
          <Row
            label="Method"
            value={PAYMENT_METHOD_LABELS[refund.payment.paymentMethod]}
          />
          <Row
            label="Paid at"
            value={
              refund.payment.paidAt ? formatDate(refund.payment.paidAt) : null
            }
          />
          <Row
            label="Amount paid"
            value={formatCurrency(refund.payment.amount)}
          />
        </Section>
      </div>
    </Modal>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Amount({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p
        className={cn(
          'mt-0.5 text-lg font-bold tracking-tight tabular-nums',
          tone
        )}
      >
        {value}
      </p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </h3>
      <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200">
        {children}
      </dl>
    </div>
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
    <div className="flex gap-4 px-3.5 py-2.5">
      <dt className="w-40 shrink-0 text-xs font-medium text-slate-500">
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
