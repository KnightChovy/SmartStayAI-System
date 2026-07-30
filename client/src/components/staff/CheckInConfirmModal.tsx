import { useEffect, useRef, useState } from 'react';
import { CalendarClock, LogIn, Loader2, X, BedDouble } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/utils/formatDate';

interface CheckInConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
  /** Trước cửa sổ check-in → không cho xác nhận. */
  disabled?: boolean;
  guestName: string;
  bookingCode: string;
  roomTypeName: string;
  /** Phòng lễ tân đã chọn (bỏ trống = để BE tự gán phòng trống). */
  roomLabel?: string | null;
  checkInDate: string;
  checkOutDate: string;
  numNights: number;
  voucherCode?: string | null;
  /** Cảnh báo (vd ngày nhận phòng chưa tới). */
  warning?: string | null;
}

/**
 * Check-in là thao tác KHÔNG hoàn tác được từ quầy, nên nút xác nhận chỉ bật sau một
 * khoảng ngắn kể từ lúc modal hiện ra: cú click theo quán tính từ thao tác trước đó
 * (vd double-click nút "Tra cứu booking" ở modal quét) sẽ rơi vào nút đang disabled
 * thay vì check-in luôn cho khách.
 */
const CONFIRM_ARM_DELAY_MS = 400;

/**
 * Modal xác nhận check-in — lễ tân bấm "Check-in" ở panel thao tác mới mở modal này.
 * Hiển thị tóm tắt booking; bấm "Confirm check-in" thì mới thực sự gọi API check-in.
 *
 * Phần thân tách ra `ConfirmDialog` để mỗi lần mở là một lần mount mới: `armed` tự khởi
 * tạo lại `false`, không phải reset bằng setState trong effect.
 */
export function CheckInConfirmModal({ open, ...props }: CheckInConfirmModalProps) {
  if (!open) return null;
  return <ConfirmDialog {...props} />;
}

type ConfirmDialogProps = Omit<CheckInConfirmModalProps, 'open'>;

function ConfirmDialog({
  onClose,
  onConfirm,
  isPending,
  disabled = false,
  guestName,
  bookingCode,
  roomTypeName,
  roomLabel,
  checkInDate,
  checkOutDate,
  numNights,
  voucherCode,
  warning,
}: ConfirmDialogProps) {
  // Chỉ đóng khi cả nhấn lẫn thả đều ở trên nền: nhấn trong hộp thoại rồi thả ra ngoài
  // (kéo chọn chữ) không được tính là muốn đóng.
  const pressedBackdropRef = useRef(false);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setArmed(true), CONFIRM_ARM_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={e => {
        pressedBackdropRef.current = e.target === e.currentTarget;
      }}
      onClick={e => {
        if (pressedBackdropRef.current && e.target === e.currentTarget) onClose();
        pressedBackdropRef.current = false;
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
            {roomLabel && <Row label="Room" value={roomLabel} />}
            {voucherCode && <Row label="Voucher" value={voucherCode} mono />}
          </dl>

          {!disabled && !roomLabel && (
            <p className="flex items-start gap-2 text-xs text-slate-500">
              <BedDouble className="mt-0.5 size-3.5 shrink-0" />
              An available room of this type will be assigned automatically.
            </p>
          )}

          {warning && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-700">
              <CalendarClock className="mt-0.5 size-3.5 shrink-0" />
              {warning}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={onConfirm}
            disabled={isPending || disabled || !armed}
          >
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
