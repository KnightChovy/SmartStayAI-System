import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { CreditCard, Loader2, QrCode, Timer } from 'lucide-react';
import { toast } from 'sonner';
import { usePaymentHold } from '@/hooks/bookings';
import { useCreateSepayPayment, useCreateVnpayPayment } from '@/hooks/payments';
import { queryKeys } from '@/constants/queryKeys';
import { errorMessage } from '@/utils/errorMessage';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import SepayQrModal from '@/components/booking/SepayQrModal';
import type { Booking } from '@/types/booking.types';
import type { SepayPaymentInfo } from '@/types/payment.types';

interface PayNowActionProps {
  booking: Booking;
  /** Nhãn nút — mặc định "Thanh toán ngay". Chỗ khách vừa thất bại nên truyền "Thử thanh toán lại". */
  label?: string;
  size?: 'sm' | 'default' | 'lg';
  /** Ẩn đồng hồ cạnh nút ở nơi đã có banner riêng nói hạn giữ chỗ (khỏi lặp một thông tin 2 lần). */
  showCountdown?: boolean;
  className?: string;
  /** SePay đã được webhook xác nhận — nơi gọi tự quyết định điều hướng / đóng màn. */
  onPaid?: () => void;
}

/**
 * Nút trả tiền cho booking **đã tạo nhưng chưa thanh toán**.
 *
 * Luồng đặt phòng tạo booking TRƯỚC khi thanh toán, nên khách huỷ ở cổng (hoặc chỉ đóng tab)
 * sẽ để lại một đơn `pending` còn nguyên hạn giữ chỗ — BE không huỷ đơn ở callback, chỉ đánh
 * dấu `Payment` row là `failed`. Component này là đường quay lại trả tiền cho đúng đơn đó.
 *
 * Tự ẩn khi đơn không còn ở trạng thái chờ tiền hoặc đã quá hạn giữ chỗ (xem `usePaymentHold`),
 * nên nhúng vô điều kiện ở mọi nơi hiển thị booking.
 */
export default function PayNowAction({
  booking,
  label,
  size = 'lg',
  showCountdown = true,
  className,
  onPaid,
}: PayNowActionProps) {
  const { t } = useTranslation('booking');
  const queryClient = useQueryClient();
  const createVnpay = useCreateVnpayPayment();
  const createSepay = useCreateSepayPayment();
  const [sepayInfo, setSepayInfo] = useState<SepayPaymentInfo | null>(null);
  const { awaitingPayment, countdown } = usePaymentHold(booking);

  const handleConfirmed = useCallback(() => {
    setSepayInfo(null);
    queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
    onPaid?.();
  }, [queryClient, onPaid]);

  if (!awaitingPayment) {
    return null;
  }

  const busy = createVnpay.isPending || createSepay.isPending;

  const pay = async (method: 'vnpay' | 'sepay') => {
    try {
      // SePay không redirect: hiện QR rồi để `SepayQrModal` poll booking tới khi webhook confirm.
      if (method === 'sepay') {
        setSepayInfo(await createSepay.mutateAsync(booking.id));
        return;
      }
      const { paymentUrl } = await createVnpay.mutateAsync(booking.id);
      window.location.href = paymentUrl;
    } catch (err) {
      // Vẫn có thể 400 dù đã gate ở client: hạn giữ chỗ hết đúng lúc bấm, hoặc cron vừa huỷ đơn.
      // Hiện message thật của BE rồi nạp lại booking để nút tự biến mất, thay vì mời bấm tiếp.
      toast.error(errorMessage(err, t('payment.payError')));
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
    }
  };

  return (
    <>
      <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1.5', className)}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="cta" size={size} disabled={busy}>
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CreditCard className="size-4" />
              )}
              {label ?? t('payment.payNow')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onSelect={() => pay('vnpay')}>
              <CreditCard className="size-4" />
              {t('payment.payWithVnpay')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => pay('sepay')}>
              <QrCode className="size-4" />
              {t('payment.payWithSepay')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {showCountdown && countdown && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700">
            <Timer className="size-4" aria-hidden="true" />
            {t('payment.holdCountdown', { time: countdown })}
          </span>
        )}
      </div>

      <SepayQrModal
        open={!!sepayInfo}
        onClose={() => setSepayInfo(null)}
        bookingId={booking.id}
        info={sepayInfo}
        onConfirmed={handleConfirmed}
      />
    </>
  );
}
