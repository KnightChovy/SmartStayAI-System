import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';

interface QRVoucherProps {
  /**
   * Dữ liệu mã hóa vào QR — PHẢI là `booking.voucher.qrData`
   * (định dạng `StayHub|<voucherCode>|<bookingCode>`, staff quét theo voucherCode).
   * Không truyền `bookingCode` vào đây: endpoint tra cứu check-in chỉ nhận voucherCode,
   * nên một QR mã hoá bookingCode sẽ luôn "not found" khi quét.
   */
  data: string | null | undefined;
  label?: string;
  size?: number;
  className?: string;
  /** Hiển thị khi booking chưa phát voucher (vd đơn online chưa thanh toán). */
  emptyHint?: string;
}

/**
 * Hiển thị mã QR cho e-voucher. Dùng dịch vụ ảnh QR công khai để render
 * (không cần thư viện QR phía client). Khi chưa có `data` (voucher chưa phát)
 * thì hiện ô thông báo thay vì QR không quét được.
 */
export default function QRVoucher({
  data,
  label,
  size = 180,
  className,
  emptyHint,
}: QRVoucherProps) {
  const { t } = useTranslation('common');
  const hint = emptyHint ?? t('qrEmptyHint');
  if (!data) {
    return (
      <div className={cn('flex flex-col items-center gap-3', className)}>
        <div
          className="flex items-center justify-center rounded-2xl border border-dashed border-outline-variant/50 bg-surface p-4 text-center text-xs text-on-surface-variant"
          style={{ width: size, height: size }}
        >
          {hint}
        </div>
        {label && (
          <p className="font-mono text-sm font-semibold tracking-wider text-on-surface">
            {label}
          </p>
        )}
      </div>
    );
  }

  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    data
  )}`;
  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div className="rounded-2xl border border-outline-variant/30 bg-white p-3">
        <img
          src={src}
          alt={`QR voucher ${label ?? ''}`}
          width={size}
          height={size}
        />
      </div>
      {label && (
        <p className="font-mono text-sm font-semibold tracking-wider text-on-surface">
          {label}
        </p>
      )}
    </div>
  );
}
