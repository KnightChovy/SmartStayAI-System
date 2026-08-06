import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/hotel-partner/shared/Modal';
import { Pill } from '@/components/hotel-partner/shared/Pill';
import {
  COMMISSION_STATUS_CONFIG,
  formatRate,
} from '@/components/shared/commission-labels';
import { cn } from '@/lib/cn';
import { formatDate } from '@/utils/formatDate';
import { AGREEMENT_MONTHS } from '@/validations/commission-rate.validation';
import type { CommissionRateRequest } from '@/types/commission-rate.types';

interface CommissionRequestDetailModalProps {
  request: CommissionRateRequest;
  onClose: () => void;
}

/**
 * Toàn bộ nội dung một đơn.
 *
 * Bảng chỉ đủ chỗ cho bản rút gọn — `reason` tới 1000 ký tự và `rejectionReason` tới 500,
 * hai thứ đối tác cần đọc nguyên văn nhất thì lại là hai thứ bị cắt trước tiên.
 */
export function CommissionRequestDetailModal({
  request,
  onClose,
}: CommissionRequestDetailModalProps) {
  const cfg = COMMISSION_STATUS_CONFIG[request.status];
  const StatusIcon = cfg.icon;

  return (
    <Modal
      open
      onClose={onClose}
      title="Commission request"
      description={`${request.hotel.name} · ${request.hotel.city}`}
      icon={FileText}
      size="md"
      footer={
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Pill className={cfg.class}>
            <StatusIcon className="h-3 w-3" />
            {cfg.label}
          </Pill>
          {request.isRenewal && <Pill tone="blue">Renewal</Pill>}
        </div>

        {/* Mức đối chiếu → mức xin */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-xs font-medium text-slate-500">
              {request.status === 'pending'
                ? 'Rate if not approved'
                : 'Compared against'}
            </p>
            <p className="mt-0.5 text-2xl font-bold tabular-nums text-slate-700">
              {formatRate(request.currentRate)}
            </p>
          </div>
          <div
            className={cn(
              'rounded-xl border p-4',
              request.status === 'approved'
                ? 'border-emerald-200 bg-emerald-50/60'
                : 'border-slate-200 bg-slate-50/60'
            )}
          >
            <p
              className={cn(
                'text-xs font-medium',
                request.status === 'approved'
                  ? 'text-emerald-700'
                  : 'text-slate-500'
              )}
            >
              Requested rate
            </p>
            <p
              className={cn(
                'mt-0.5 text-2xl font-bold tabular-nums',
                request.status === 'approved'
                  ? 'text-emerald-700'
                  : 'text-slate-700'
              )}
            >
              {formatRate(request.requestedRate)}
            </p>
          </div>
        </div>

        {request.isRenewal && (
          <p className="rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-xs text-blue-900">
            This is a <strong>renewal</strong>, so it is compared against the
            base rate that applies <strong>after</strong> your current agreement
            expires — not the rate you pay today.
          </p>
        )}

        {/* Lý do đối tác đã gửi — đủ, không cắt */}
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Your reason
          </h3>
          <p className="whitespace-pre-wrap rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
            {request.reason}
          </p>
        </div>

        {/* Kết quả */}
        {request.status === 'rejected' && (
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Why it was rejected
            </h3>
            <p className="whitespace-pre-wrap rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {request.rejectionReason ?? (
                <span className="italic text-red-400">No reason given</span>
              )}
            </p>
          </div>
        )}

        {request.agreement && (
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Agreement created
            </h3>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
              <p className="text-sm font-semibold text-emerald-800">
                {formatRate(request.agreement.rate)} for {AGREEMENT_MONTHS}{' '}
                months
              </p>
              <p className="mt-0.5 text-xs text-emerald-700">
                {formatDate(request.agreement.effectiveFrom)} →{' '}
                {request.agreement.effectiveTo
                  ? formatDate(request.agreement.effectiveTo)
                  : '—'}
              </p>
            </div>
          </div>
        )}

        {/* Vết xử lý */}
        <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200">
          <Row
            label="Submitted by"
            value={
              request.requestedByUser.fullName ?? request.requestedByUser.email
            }
          />
          <Row label="Email" value={request.requestedByUser.email} />
          <Row label="Submitted" value={formatDate(request.createdAt)} />
          <Row
            label="Reviewed by"
            value={
              request.reviewedAt
                ? // `reviewedByUser` null nhưng đã có `reviewedAt` = hệ thống tự xử lý.
                  (request.reviewedByUser?.fullName ??
                  request.reviewedByUser?.email ??
                  'System')
                : null
            }
          />
          <Row
            label="Reviewed"
            value={request.reviewedAt ? formatDate(request.reviewedAt) : null}
          />
        </dl>
      </div>
    </Modal>
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
      <dt className="w-32 shrink-0 text-xs font-medium text-slate-500">
        {label}
      </dt>
      <dd className="min-w-0 flex-1 text-sm text-slate-700">
        {value ? (
          value
        ) : (
          <span className="italic text-slate-400">Not reviewed yet</span>
        )}
      </dd>
    </div>
  );
}
