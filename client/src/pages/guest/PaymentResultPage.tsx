import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle } from 'lucide-react';
import { queryKeys } from '@/constants/queryKeys';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/button';
import type { PaymentResultStatus } from '@/types/payment.types';

/**
 * Trang VNPay redirect khách về sau khi thanh toán
 * (`/booking/payment-result?status=success|failed&bookingCode=...`).
 * Backend đã xác minh chữ ký + cập nhật booking; trang này chỉ hiển thị kết quả.
 */
export default function PaymentResultPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const status: PaymentResultStatus = params.get('status') === 'success' ? 'success' : 'failed';
  const bookingCode = params.get('bookingCode') ?? '';
  const success = status === 'success';

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
              {success ? 'Payment successful!' : 'Payment failed'}
            </h1>
            <p className="mt-2 max-w-md text-sm text-on-surface-variant">
              {success
                ? 'Your booking has been confirmed and a confirmation email is on its way. You can view your voucher in My Bookings.'
                : 'We could not complete your payment. Your room is held briefly — you can try paying again from My Bookings before the hold expires.'}
            </p>

            {bookingCode && (
              <div className="mt-6 rounded-xl bg-surface-container-low px-5 py-3">
                <p className="text-xs text-on-surface-variant">Booking code</p>
                <p className="font-be-vietnam text-lg font-bold tracking-wider text-on-surface">
                  {bookingCode}
                </p>
              </div>
            )}

            <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                className="bg-on-surface text-white hover:bg-primary"
                onClick={() => navigate(ROUTES.accountBookings)}
              >
                View my bookings
              </Button>
              {!success && (
                <Button variant="outline" size="lg" onClick={() => navigate(ROUTES.search)}>
                  Back to search
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
