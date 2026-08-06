import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useMyBookings } from '@/hooks/bookings';
import { queryKeys } from '@/constants/queryKeys';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/button';
import PayNowAction from '@/components/booking/PayNowAction';
import type { PaymentResultStatus } from '@/types/payment.types';

/**
 * Trang VNPay redirect khách về sau khi thanh toán
 * (`/booking/payment-result?status=success|failed&bookingCode=...`).
 * Backend đã xác minh chữ ký + cập nhật booking; trang này chỉ hiển thị kết quả.
 */
export default function PaymentResultPage() {
  const { t } = useTranslation('booking');
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const status: PaymentResultStatus = params.get('status') === 'success' ? 'success' : 'failed';
  const bookingCode = params.get('bookingCode') ?? '';
  const success = status === 'success';

  // Thanh toán hỏng KHÔNG huỷ booking — BE chỉ đánh dấu `Payment` là `failed`, đơn vẫn `pending`
  // và vẫn còn hạn giữ chỗ. Nên mời khách trả lại ngay tại đây thay vì bắt tự mò vào Đặt phòng
  // của tôi. VNPay chỉ trả về `bookingCode` và BE không có endpoint tra theo mã ⇒ lấy từ danh
  // sách đơn của chính khách (cùng cách `MyBookingsPage` đang làm).
  const { data: myBookings } = useMyBookings({ limit: 100 }, { enabled: !success });
  const unpaidBooking =
    myBookings?.results.find(b => b.bookingCode === bookingCode) ?? null;

  // Thanh toán xong → booking đổi trạng thái, làm mới danh sách booking của khách
  useEffect(() => {
    if (success) {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
    }
  }, [success, queryClient]);

  return (
    <div className="w-full py-12">
      <div className="mx-auto max-w-2xl px-margin-mobile md:px-8">
        <div className="overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface">
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <div
              className={`flex size-16 items-center justify-center rounded-full ${
                success ? 'bg-primary/15 text-primary' : 'bg-error/10 text-error'
              }`}
            >
              {success ? <CheckCircle2 className="size-9" /> : <XCircle className="size-9" />}
            </div>

            <h1 className="mt-4 font-be-vietnam text-2xl font-bold text-on-surface">
              {success ? t('result.successTitle') : t('result.failedTitle')}
            </h1>
            <p className="mt-2 max-w-md text-sm text-on-surface-variant">
              {success ? t('result.successBody') : t('result.failedBody')}
            </p>

            {bookingCode && (
              <div className="mt-6 rounded-xl bg-surface-container-low px-5 py-3">
                <p className="text-xs text-on-surface-variant">{t('result.bookingCode')}</p>
                <p className="font-be-vietnam text-lg font-bold tracking-wider text-on-surface">
                  {bookingCode}
                </p>
              </div>
            )}

            {/* Tự ẩn nếu đơn đã hết hạn giữ chỗ / đã được thanh toán bằng đường khác */}
            {unpaidBooking && (
              <PayNowAction
                booking={unpaidBooking}
                label={t('confirm.retryPayment')}
                className="mt-8 justify-center"
                onPaid={() => navigate(ROUTES.accountBookings)}
              />
            )}

            <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                className="bg-on-surface text-white hover:bg-primary"
                onClick={() => navigate(ROUTES.accountBookings)}
              >
                {t('result.viewBookings')}
              </Button>
              {!success && (
                <Button variant="outline" size="lg" onClick={() => navigate(ROUTES.search)}>
                  {t('result.backToSearch')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
