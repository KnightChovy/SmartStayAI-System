import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Search, Loader2, X, QrCode } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';
import { useLookupBooking } from '@/hooks/staff';
import { errorMessage } from '@/utils/errorMessage';
import { VOUCHER_CODE_MAX } from '@/validations/staff-booking.validation';

interface QrCheckInModalProps {
  open: boolean;
  onClose: () => void;
  hotelId: string | undefined;
  /** Gọi khi tra được booking (bookingId để điều hướng + voucherCode đã quét để check-in). */
  onFound: (bookingId: string, voucherCode: string) => void;
}

const SCANNER_ELEMENT_ID = 'staff-qr-check-in-reader';

/**
 * QR mã hoá dạng `SMARTSTAY|<voucherCode>|<bookingCode>` (backend `BookingVoucher.qrData`).
 * Tách lấy voucherCode; chuỗi không đúng định dạng thì coi nguyên văn là voucherCode.
 */
function extractVoucherCode(scanned: string): string {
  const parts = scanned.trim().split('|');
  if (parts.length === 3 && parts[0] === 'SMARTSTAY') return parts[1];
  return scanned.trim();
}

/**
 * Modal check-in kiểu "quầy vé rạp phim": quét QR bằng camera trình duyệt (html5-qrcode)
 * hoặc nhập tay mã e-voucher, tra ra booking rồi báo lên cho FrontDeskPage điều hướng.
 */
export function QrCheckInModal({
  open,
  onClose,
  hotelId,
  onFound,
}: QrCheckInModalProps) {
  const [code, setCode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const lookup = useLookupBooking(hotelId);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const busyRef = useRef(false);

  function runLookup(voucherCode: string) {
    if (!voucherCode || busyRef.current) return;
    // Trần 50 khớp Joi `lookupBookingByVoucher` của BE. `maxLength` trên ô nhập chỉ chặn được
    // đường gõ tay — mã đến từ QR quét được cũng đi qua đây nên phải kiểm ở cả hai đường.
    if (voucherCode.length > VOUCHER_CODE_MAX) {
      setCodeError(`Mã e-voucher tối đa ${VOUCHER_CODE_MAX} ký tự.`);
      return;
    }
    setCodeError(null);
    busyRef.current = true;
    lookup.mutate(voucherCode, {
      onSuccess: booking => {
        busyRef.current = false;
        setCode('');
        onFound(booking.id, voucherCode);
      },
      onError: () => {
        busyRef.current = false;
      },
    });
  }

  // Camera lifecycle: start when the modal opens, always stop/clear on close/unmount.
  useEffect(() => {
    if (!open) return;
    const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
    scannerRef.current = scanner;
    let cameraStarted = false;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 220 },
        decodedText => runLookup(extractVoucherCode(decodedText)),
        () => {} // ignore per-frame "not found" noise
      )
      .then(() => {
        cameraStarted = true;
        setCameraError(null);
      })
      .catch(() =>
        setCameraError(
          'Không truy cập được camera. Kiểm tra quyền trình duyệt.'
        )
      );

    return () => {
      scannerRef.current = null;
      // Camera never actually started (permission denied/no device) — stop() throws in that state.
      if (!cameraStarted) return;
      scanner
        .stop()
        .then(() => scanner.clear())
        .catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, hotelId]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onMouseDown={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <QrCode className="size-4 text-slate-500" />
            <h2 className="font-semibold text-slate-900">Scan check-in</h2>
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

        <div className="px-5 py-4">
          <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-xl bg-slate-900">
            <div
              id={SCANNER_ELEMENT_ID}
              className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
            />
            {cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900 px-4 text-center text-xs text-slate-300">
                {cameraError}
              </div>
            )}
            {lookup.isPending && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="size-8 animate-spin text-white" />
              </div>
            )}
          </div>

          {lookup.isError && (
            <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">
              {errorMessage(
                lookup.error,
                'Không tìm thấy booking khớp mã voucher này.'
              )}
            </p>
          )}

          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">
              Hoặc nhập mã e-voucher
            </label>
            <div className="relative">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={code}
                maxLength={VOUCHER_CODE_MAX}
                aria-invalid={!!codeError}
                onChange={e => {
                  setCode(e.target.value);
                  setCodeError(null);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') runLookup(code.trim());
                }}
                placeholder="VD: VC1A2B3C4D"
                className="pl-9"
                autoCapitalize="characters"
              />
            </div>
            {codeError && <p className="mt-1.5 text-xs text-rose-600">{codeError}</p>}
            <button
              type="button"
              onClick={() => runLookup(code.trim())}
              disabled={!code.trim() || lookup.isPending}
              className={cn(
                'mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-2 text-sm font-medium text-white transition-colors',
                'disabled:opacity-50'
              )}
            >
              {lookup.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
              Tra cứu booking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
