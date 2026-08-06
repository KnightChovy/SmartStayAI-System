import { AlertTriangle, CalendarClock, LogIn, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { formatDate } from '@/utils/formatDate';

interface CheckInConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
  /** Ngoài cửa sổ check-in (chưa tới giờ, hoặc đã quá kỳ lưu trú) → không cho xác nhận. */
  disabled?: boolean;
  guestName: string;
  bookingCode: string;
  roomTypeName: string;
  checkInDate: string;
  checkOutDate: string;
  numNights: number;
  voucherCode?: string | null;
  /** Phòng lễ tân đã chọn tay; bỏ trống = để BE tự gán phòng trống cùng loại. */
  roomNumber?: string | null;
  /** Cảnh báo (vd chưa tới ngày nhận phòng, hoặc đã quá kỳ lưu trú). */
  warning?: string | null;
  /** `true` = cảnh báo là ngõ cụt (không bao giờ check-in được nữa) → tô đỏ thay vì vàng. */
  blocking?: boolean;
}

/**
 * Modal xác nhận check-in — bật tự động sau khi quét QR ở quầy lễ tân.
 * Hiển thị tóm tắt booking; bấm "Confirm check-in" thì gọi check-in (BE tự gán phòng trống).
 */
export function CheckInConfirmModal({
  open,
  onClose,
  onConfirm,
  isPending,
  disabled = false,
  guestName,
  bookingCode,
  roomTypeName,
  checkInDate,
  checkOutDate,
  numNights,
  voucherCode,
  roomNumber,
  warning,
  blocking = false,
}: CheckInConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl" role="dialog" aria-modal="true">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <LogIn className="size-4 text-slate-500" />
            <h2 className="font-semibold text-slate-900">Confirm check-in</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-3 px-5 py-4">
          <div>
            <p className="text-base font-semibold text-slate-900">{guestName}</p>
            <p className="font-mono text-xs text-slate-400">{bookingCode}</p>
          </div>

          <dl className="space-y-1.5 rounded-lg bg-slate-50 p-3 text-sm">
            <Row label="Room type" value={roomTypeName} />
            <Row
              label="Stay"
              value={`${formatDate(checkInDate)} → ${formatDate(checkOutDate)} (${numNights} night${numNights === 1 ? '' : 's'})`}
            />
            {voucherCode && <Row label="Voucher" value={voucherCode} mono />}
            {roomNumber && <Row label="Room" value={roomNumber} />}
          </dl>

          {!disabled && (
            <p className="text-xs text-slate-500">
              {roomNumber
                ? `Room ${roomNumber} will be assigned to this guest.`
                : 'An available room of this type will be assigned automatically.'}
            </p>
          )}

          {warning && (
            <div
              className={cn(
                'flex items-start gap-2 rounded-lg p-2.5 text-xs',
                blocking ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
              )}
            >
              {blocking ? (
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              ) : (
                <CalendarClock className="mt-0.5 size-3.5 shrink-0" />
              )}
              {warning}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="button" onClick={onConfirm} disabled={isPending || disabled}>
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Checking in…
              </>
            ) : (
              <>
                <LogIn className="size-4" /> Confirm check-in
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className={`text-right font-medium text-slate-900${mono ? ' font-mono' : ''}`}>{value}</span>
    </div>
  );
}
