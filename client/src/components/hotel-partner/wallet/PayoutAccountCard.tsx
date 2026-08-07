import { useState } from 'react';
import { Building2, Eye, EyeOff, Landmark, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { HotelPayoutAccountSummary } from '@/types/hotel-revenue.types';
import { maskAccount } from './payout-labels';

interface PayoutAccountCardProps {
  account: HotelPayoutAccountSummary | null | undefined;
  isLoading: boolean;
  /** Chỉ chủ KS mới đổi được (BE trả 403 cho người khác) ⇒ người khác không thấy nút. */
  canEdit: boolean;
  onEdit: () => void;
}

/**
 * Tài khoản Platform Manager sẽ chuyển tiền vào.
 *
 * Số tài khoản **che sẵn**, có nút con mắt để mở: đây là màn hình đối tác hay mở giữa quầy lễ
 * tân, và số này chỉ cần đọc khi đối chiếu chứ không cần phơi ra suốt.
 *
 * ⚠️ `accountNumber === null` KHÔNG có nghĩa "chưa khai": BE chỉ trả số đầy đủ cho **chủ** khách
 * sạn, staff/manager luôn nhận `null`. Vì vậy hai trạng thái đó phải nói khác nhau — báo "chưa
 * có tài khoản" với người không đủ quyền là sai sự thật.
 */
export function PayoutAccountCard({
  account,
  isLoading,
  canEdit,
  onEdit,
}: PayoutAccountCardProps) {
  const [revealed, setRevealed] = useState(false);

  if (isLoading && !account) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-3 h-6 w-48" />
        <Skeleton className="mt-2 h-4 w-40" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Landmark className="h-4 w-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-800">Bank Account</h3>
        </div>
        {canEdit && account && (
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Change
          </Button>
        )}
      </div>

      {!account ? (
        <div className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center">
          <Building2 className="mx-auto mb-2 h-6 w-6 text-slate-300" />
          <p className="text-sm text-slate-500">No bank account on file</p>
          <p className="mt-1 text-xs text-slate-400">
            You need one before you can request a payout.
          </p>
          {canEdit && (
            <Button
              size="sm"
              onClick={onEdit}
              className="mt-3 bg-role-partner-primary text-white hover:bg-role-partner-secondary"
            >
              Add bank account
            </Button>
          )}
        </div>
      ) : (
        <dl className="space-y-3">
          <Row label="Account holder" value={account.accountHolder} />
          <Row
            label="Bank"
            value={
              account.bankBranch
                ? `${account.bankName} — ${account.bankBranch}`
                : account.bankName
            }
          />

          <div>
            <dt className="text-xs text-slate-500">Account number</dt>
            <dd className="mt-0.5 flex items-center gap-2">
              {account.accountNumber === null ? (
                // Không đủ quyền xem — nói đúng lý do thay vì để trống hoặc báo "chưa có".
                <span className="text-sm italic text-slate-400">
                  Hidden — only the hotel owner can see the full number
                </span>
              ) : (
                <>
                  <span className="font-mono text-base font-semibold tracking-wide text-slate-900">
                    {revealed
                      ? account.accountNumber
                      : maskAccount(account.accountNumber)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setRevealed(v => !v)}
                    aria-label={
                      revealed ? 'Hide account number' : 'Show account number'
                    }
                    aria-pressed={revealed}
                    className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                  >
                    {revealed ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </>
              )}
            </dd>
          </div>
        </dl>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd
        className="mt-0.5 truncate text-sm font-medium text-slate-800"
        title={value}
      >
        {value}
      </dd>
    </div>
  );
}
