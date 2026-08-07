import { useState } from 'react';
import { AlertTriangle, Banknote, Check, Copy, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ManagerModal } from '@/components/manager/shared/ManagerModal';
import { TableSkeleton } from '@/components/shared/skeletons';
import { usePlatformPayout, useReviewPayout } from '@/hooks/payouts';
import { cn } from '@/lib/cn';
import { errorMessage } from '@/utils/errorMessage';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import type { PlatformPayout } from '@/types/payout.types';

interface PayoutReviewModalProps {
  /**
   * `null` = đóng. Dòng từ danh sách để header hiện ngay, không chờ request chi tiết.
   *
   * ⚠️ Nơi dùng phải truyền `key` theo id để đổi yêu cầu là **remount** — nếu không, lý do
   * từ chối đang gõ dở cho khoản này sẽ dính sang khoản kế tiếp.
   */
  payout: PlatformPayout | null;
  onClose: () => void;
}

type Mode = 'idle' | 'approve' | 'reject';

/**
 * Duyệt một yêu cầu rút tiền.
 *
 * Điểm quan trọng nhất về mặt UX: **bấm "Mark as paid" KHÔNG chuyển tiền** — hệ thống không
 * nối ngân hàng, Platform Manager tự chuyển khoản tay rồi mới vào đây ghi nhận. Nếu để nhãn
 * "Approve" trơn thì người duyệt rất dễ bấm trước khi chuyển, và đối tác thấy trạng thái
 * "Paid" trong khi tiền chưa hề rời ngân hàng. Vì vậy modal bày rõ thứ tự: chuyển trước → ghi
 * nhận sau, kèm số tài khoản copy được đặt ngay trên nút.
 */
export function PayoutReviewModal({ payout, onClose }: PayoutReviewModalProps) {
  const [mode, setMode] = useState<Mode>('idle');
  const [reference, setReference] = useState('');
  const [reason, setReason] = useState('');

  const detail = usePlatformPayout(payout?.id ?? null);
  const review = useReviewPayout();

  if (!payout) return null;

  const account = detail.data?.payoutAccount;
  const isPending = payout.status === 'pending';

  const submit = async () => {
    if (mode === 'reject' && reason.trim().length === 0) return;
    try {
      await review.mutateAsync({
        payoutId: payout.id,
        // Payload dựng tay theo union, KHÔNG spread state: gửi `payoutTransactionId` kèm
        // `reject` là field vô nghĩa cho một quyết định từ chối.
        payload:
          mode === 'approve'
            ? {
                decision: 'approve',
                ...(reference.trim() && {
                  payoutTransactionId: reference.trim(),
                }),
              }
            : { decision: 'reject', notes: reason.trim() },
      });
      toast.success(
        mode === 'approve'
          ? `Recorded ${formatCurrency(payout.amount)} as paid`
          : `Declined — ${formatCurrency(payout.amount)} returned to the hotel`
      );
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not update this payout request'));
    }
  };

  return (
    <ManagerModal
      open
      onClose={onClose}
      title={payout.hotel.name}
      description={`Requested ${formatDate(payout.createdAt)} · ${payout.hotel.city}`}
      icon={Banknote}
      size="md"
      footer={
        isPending ? (
          mode === 'idle' ? (
            <>
              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => setMode('reject')}
              >
                <X className="mr-1.5 h-4 w-4" />
                Decline
              </Button>
              <Button
                onClick={() => setMode('approve')}
                className="bg-role-manager-primary text-white hover:bg-role-manager-secondary"
              >
                <Check className="mr-1.5 h-4 w-4" />
                I have transferred it
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setMode('idle')}>
                Back
              </Button>
              <Button
                onClick={submit}
                disabled={
                  review.isPending ||
                  (mode === 'reject' && reason.trim().length === 0)
                }
                className={cn(
                  'text-white',
                  mode === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                )}
              >
                {review.isPending
                  ? 'Saving…'
                  : mode === 'approve'
                    ? 'Confirm as paid'
                    : 'Confirm decline'}
              </Button>
            </>
          )
        ) : (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )
      }
    >
      <div className="space-y-5">
        {/* Số tiền phải chuyển — thứ người duyệt cần đọc chính xác nhất. */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs text-slate-500">Amount to transfer</p>
          <p className="mt-0.5 text-3xl font-bold tabular-nums text-slate-900">
            {formatCurrency(payout.amount)}
          </p>
        </div>

        {mode === 'idle' && (
          <>
            {detail.isLoading && !account ? (
              <TableSkeleton rows={4} columns={2} />
            ) : detail.isError ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                Could not load the bank details. Do not mark this as paid until
                you can see where to send the money.
              </p>
            ) : account ? (
              <div className="rounded-xl border border-slate-200">
                <p className="border-b border-slate-100 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Send to
                </p>
                <dl className="divide-y divide-slate-100">
                  <BankRow label="Account holder" value={account.accountHolder} copyable />
                  <BankRow label="Bank" value={account.bankName} />
                  <BankRow
                    label="Account number"
                    value={account.accountNumber}
                    copyable
                    emphasis
                  />
                  {account.bankBranch && (
                    <BankRow label="Branch" value={account.bankBranch} />
                  )}
                  {account.swiftCode && (
                    <BankRow label="SWIFT" value={account.swiftCode} copyable />
                  )}
                </dl>
              </div>
            ) : null}

            {isPending && (
              <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  This screen does not move money. Make the bank transfer
                  yourself first, then come back and record it — the hotel sees
                  &quot;Paid&quot; the moment you do.
                </span>
              </p>
            )}
          </>
        )}

        {mode === 'approve' && (
          <div className="space-y-3">
            <p className="rounded-lg bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800">
              Confirm only if the transfer of{' '}
              <strong>{formatCurrency(payout.amount)}</strong> to{' '}
              <strong>{account?.accountHolder ?? 'the account above'}</strong>{' '}
              has already left the bank. This cannot be undone.
            </p>
            <div>
              <label
                htmlFor="payout-reference"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Bank reference{' '}
                <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                id="payout-reference"
                value={reference}
                onChange={e => setReference(e.target.value)}
                maxLength={255}
                placeholder="e.g. FT26080712345"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm outline-none focus:border-role-manager-primary"
              />
              <p className="mt-1 text-xs text-slate-400">
                Shown to the hotel so they can match it against their bank
                statement.
              </p>
            </div>
          </div>
        )}

        {mode === 'reject' && (
          <div className="space-y-3">
            <p className="rounded-lg bg-red-50 px-3 py-2.5 text-xs text-red-700">
              <strong>{formatCurrency(payout.amount)}</strong> goes straight back
              to the hotel&apos;s available balance. They can request it again.
            </p>
            <div>
              <label
                htmlFor="payout-reason"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                id="payout-reason"
                value={reason}
                onChange={e => setReason(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Tell the hotel why, e.g. bank details do not match the registered business."
                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-role-manager-primary"
              />
              {/* Bắt buộc nhập lý do dù BE cho phép trống: từ chối tiền mà không nói vì sao
                  thì đối tác chỉ biết gửi lại y hệt và bị từ chối tiếp. */}
              <p className="mt-1 text-xs text-slate-400">
                {reason.trim().length === 0
                  ? 'Required — the hotel sees this message.'
                  : `${reason.length}/500`}
              </p>
            </div>
          </div>
        )}

        {/* Yêu cầu đã xử lý: chỉ xem lại kết quả, không có hành động nào. */}
        {!isPending && (
          <div className="space-y-2 rounded-xl border border-slate-200 px-4 py-3 text-sm">
            {payout.processedAt && (
              <Line label="Processed" value={formatDate(payout.processedAt)} />
            )}
            {payout.payoutTransactionId && (
              <Line label="Bank reference" value={payout.payoutTransactionId} mono />
            )}
            {payout.notes && <Line label="Note" value={payout.notes} />}
          </div>
        )}
      </div>
    </ManagerModal>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function BankRow({
  label,
  value,
  copyable = false,
  emphasis = false,
}: {
  label: string;
  value: string;
  copyable?: boolean;
  emphasis?: boolean;
}) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error('Could not copy — select the text manually');
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5">
      <dt className="shrink-0 text-xs text-slate-500">{label}</dt>
      <dd className="flex min-w-0 items-center gap-2">
        <span
          className={cn(
            'truncate text-right',
            emphasis
              ? 'font-mono text-base font-bold tracking-wide text-slate-900'
              : 'text-sm text-slate-700'
          )}
        >
          {value}
        </span>
        {copyable && (
          <button
            type="button"
            onClick={copy}
            aria-label={`Copy ${label}`}
            className="shrink-0 rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        )}
      </dd>
    </div>
  );
}

function Line({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-xs text-slate-500">{label}</span>
      <span
        className={cn(
          'text-right text-sm text-slate-800',
          mono && 'font-mono text-xs'
        )}
      >
        {value}
      </span>
    </div>
  );
}
