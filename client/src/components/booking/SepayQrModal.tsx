import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Copy, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { bookingService } from '@/services/booking.service';
import { queryKeys } from '@/constants/queryKeys';
import { useMoney } from '@/hooks/currency';
import { Button } from '@/components/ui/button';
import type { SepayPaymentInfo } from '@/types/payment.types';

/** Nhịp hỏi lại trạng thái booking (SePay xác nhận qua webhook, không redirect). */
const POLL_MS = 4000;

interface SepayQrModalProps {
  open: boolean;
  onClose: () => void;
  bookingId: string;
  info: SepayPaymentInfo | null;
  /** Booking đã được webhook xác nhận → điều hướng sang trang thành công. */
  onConfirmed: () => void;
}

/**
 * Màn QR chuyển khoản SePay. Khác VNPay ở chỗ **không redirect**: khách quét QR,
 * SePay gọi webhook về BE, BE confirm booking → FE poll `GET /bookings/:id` cho
 * tới khi `status !== 'pending'` rồi tự chuyển trang.
 */
export default function SepayQrModal({
  open,
  onClose,
  bookingId,
  info,
  onConfirmed,
}: SepayQrModalProps) {
  const { t } = useTranslation('booking');
  const { format } = useMoney();

  const { data: booking } = useQuery({
    queryKey: queryKeys.bookings.detail(bookingId),
    queryFn: () => bookingService.getById(bookingId),
    enabled: open && !!bookingId,
    refetchInterval: open ? POLL_MS : false,
  });

  // Webhook đã xác nhận → thoát khỏi màn QR.
  useEffect(() => {
    if (open && booking && booking.status !== 'pending') onConfirmed();
  }, [open, booking, onConfirmed]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !info) return null;

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(t('sepay.copied'));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-surface shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4 border-b border-outline-variant/30 px-6 py-4">
          <div>
            <h2 className="font-be-vietnam text-lg font-bold text-on-surface">
              {t('sepay.title')}
            </h2>
            <p className="mt-0.5 text-xs text-on-surface-variant">{t('sepay.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('sepay.close')}
            className="flex size-11 shrink-0 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <img
            src={info.qrUrl}
            alt={t('sepay.qrAlt')}
            className="mx-auto w-56 rounded-xl border border-outline-variant/30 bg-white"
          />

          <dl className="space-y-2 rounded-xl bg-surface-container-low p-3 text-sm">
            <Row label={t('sepay.amount')} value={format(info.amount)} />
            <Row label={t('sepay.bank')} value={info.bankCode} />
            <Row label={t('sepay.account')} value={info.accountNumber} onCopy={copy} mono />
            <Row label={t('sepay.content')} value={info.transferContent} onCopy={copy} mono />
          </dl>

          {/* Nội dung CK sai → webhook không khớp được → nhấn mạnh */}
          <p className="rounded-xl bg-amber-500/10 p-3 text-xs text-amber-800">
            {t('sepay.keepContent')}
          </p>

          <p className="flex items-center justify-center gap-2 text-sm text-on-surface-variant">
            <Loader2 className="size-4 animate-spin text-primary" aria-hidden="true" />
            {t('sepay.waiting')}
          </p>
        </div>

        <div className="flex justify-end gap-3 border-t border-outline-variant/30 px-6 py-4">
          <Button type="button" variant="outline" className="min-h-11" onClick={onClose}>
            {t('sepay.payLater')}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  onCopy,
  mono,
}: {
  label: string;
  value: string;
  onCopy?: (v: string) => void;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-on-surface-variant">{label}</dt>
      <dd className="flex items-center gap-1.5">
        <span className={`font-semibold text-on-surface${mono ? ' font-mono' : ''}`}>{value}</span>
        {onCopy && (
          <button
            type="button"
            onClick={() => onCopy(value)}
            className="rounded p-1 text-on-surface-variant hover:bg-surface"
            aria-label={`Copy ${label}`}
          >
            <Copy className="size-3.5" />
          </button>
        )}
      </dd>
    </div>
  );
}
