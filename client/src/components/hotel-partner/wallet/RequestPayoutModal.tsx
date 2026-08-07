import { useState } from 'react';
import { HandCoins, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/hotel-partner/shared/Modal';
import { useRequestPayout } from '@/hooks/payouts';
import { cn } from '@/lib/cn';
import { errorMessage } from '@/utils/errorMessage';
import { formatCurrency } from '@/utils/formatCurrency';
import { MIN_PAYOUT_AMOUNT } from '@/types/payout.types';

interface RequestPayoutModalProps {
  open: boolean;
  onClose: () => void;
  hotelId: string;
  /** Số dư rút được, dạng chuỗi từ BE. */
  available: string | undefined;
}

/**
 * Tạo yêu cầu rút tiền.
 *
 * Nói TRƯỚC hệ quả thay vì để đối tác phát hiện sau khi bấm: tiền **rời "Available" ngay lúc
 * gửi yêu cầu**, không đợi duyệt. Đây là thứ dễ gây hoảng nhất ("sao số dư tụt?"), nên nó
 * được hiện ngay dưới ô nhập dưới dạng số dư còn lại sau khi rút.
 */
export function RequestPayoutModal({
  open,
  onClose,
  hotelId,
  available,
}: RequestPayoutModalProps) {
  const [raw, setRaw] = useState('');
  const requestPayout = useRequestPayout(hotelId);

  const availableNum = Number(available ?? 0);
  const amount = Number(raw.replace(/\D/g, ''));
  const hasInput = raw.trim() !== '' && amount > 0;

  // Kiểm cùng ngưỡng BE (min 100.000 + không vượt số dư) để báo ngay tại chỗ, thay vì để
  // đối tác bấm Gửi rồi ăn 400.
  const error = !hasInput
    ? null
    : amount < MIN_PAYOUT_AMOUNT
      ? `The minimum payout is ${formatCurrency(MIN_PAYOUT_AMOUNT)}`
      : amount > availableNum
        ? `You can withdraw at most ${formatCurrency(availableNum)}`
        : null;

  const canSubmit = hasInput && !error && !requestPayout.isPending;

  const close = () => {
    setRaw('');
    onClose();
  };

  const submit = async () => {
    if (!canSubmit) return;
    try {
      await requestPayout.mutateAsync({ amount });
      toast.success(`Payout request for ${formatCurrency(amount)} submitted`);
      close();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not submit the payout request'));
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Request a payout"
      description="The platform transfers to your registered bank account"
      icon={HandCoins}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={!canSubmit}
            className="bg-role-partner-primary text-white hover:bg-role-partner-secondary"
          >
            {requestPayout.isPending ? 'Submitting…' : 'Submit request'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs text-slate-500">Available for payout</p>
          <p className="mt-0.5 text-2xl font-bold tabular-nums text-emerald-600">
            {formatCurrency(available)}
          </p>
        </div>

        <div>
          <label
            htmlFor="payout-amount"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Amount to withdraw
          </label>
          <div className="relative">
            <input
              id="payout-amount"
              inputMode="numeric"
              autoComplete="off"
              // Chỉ nhận chữ số rồi tự chấm phân cách: gõ "1.000.000" hay "1000000" đều ra
              // một số, khỏi phải đoán định dạng nào được chấp nhận.
              value={amount > 0 ? amount.toLocaleString('vi-VN') : raw}
              onChange={e => setRaw(e.target.value)}
              placeholder="0"
              aria-invalid={!!error}
              aria-describedby={error ? 'payout-amount-error' : undefined}
              className={cn(
                'w-full rounded-lg border px-3 py-2 pr-12 text-right text-lg font-semibold tabular-nums outline-none',
                error
                  ? 'border-red-300 focus:border-red-500'
                  : 'border-slate-200 focus:border-role-partner-primary'
              )}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              VNĐ
            </span>
          </div>

          {error ? (
            <p id="payout-amount-error" className="mt-1.5 text-xs text-red-600">
              {error}
            </p>
          ) : (
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <p className="text-xs text-slate-400">
                Minimum {formatCurrency(MIN_PAYOUT_AMOUNT)}
              </p>
              <button
                type="button"
                onClick={() => setRaw(String(Math.floor(availableNum)))}
                disabled={availableNum < MIN_PAYOUT_AMOUNT}
                className="text-xs font-medium text-role-partner-primary hover:underline disabled:cursor-not-allowed disabled:text-slate-300 disabled:no-underline"
              >
                Withdraw all
              </button>
            </div>
          )}
        </div>

        {/* Hệ quả tức thì — phải nói trước khi bấm, không phải sau. */}
        {hasInput && !error && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            <p className="flex items-start gap-2">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                {formatCurrency(amount)} leaves your available balance as soon
                as you submit — it moves to <strong>Pending payout</strong>{' '}
                until the platform transfers it. Available balance will read{' '}
                <strong>{formatCurrency(availableNum - amount)}</strong>.
              </span>
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
