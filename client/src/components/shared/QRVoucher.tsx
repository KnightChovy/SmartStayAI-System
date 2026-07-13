import { cn } from '@/lib/cn';

interface QRVoucherProps {
  data: string;
  label?: string;
  size?: number;
  className?: string;
}

export default function QRVoucher({
  data,
  label,
  size = 180,
  className,
}: QRVoucherProps) {
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    data
  )}`;
  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div className="rounded-2xl border border-outline-variant/30 bg-white p-3">
        <img src={src} alt={`QR voucher ${data}`} width={size} height={size} />
      </div>
      {label && (
        <p className="font-mono text-sm font-semibold tracking-wider text-on-surface">
          {label}
        </p>
      )}
    </div>
  );
}
