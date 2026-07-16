import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, BedDouble, CalendarDays, ShieldCheck, Users } from 'lucide-react';
import { useCreateBooking } from '@/hooks/bookings';
import { useCreateVnpayPayment } from '@/hooks/payments';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/constants/routes';
import { guestDetailsSchema, type GuestDetailsValues } from '@/validations/checkout.validation';
import CheckoutStepper from '@/components/booking/CheckoutStepper';
import PaymentMethodSelect, { type PaymentMethod } from '@/components/booking/PaymentMethodSelect';
import PriceSummary from '@/components/shared/PriceSummary';
import EmptyState from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDateShort, nightsBetween } from '@/utils/formatDate';
import type { HotelSearchResult, RoomType } from '@/types/hotel.types';

interface CheckoutState {
  hotel?: HotelSearchResult | null;
  roomType?: RoomType;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
}

/** Lấy message lỗi từ axios error (nếu có) mà không dùng `any`. */
function errorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const resp = (err as { response?: { data?: { message?: string } } }).response;
    return resp?.data?.message ?? fallback;
  }
  return fallback;
}

export default function BookingCheckoutPage() {
  const { t } = useTranslation(['booking', 'common']);
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore(state => state.user);
  const state = (location.state as CheckoutState | null) ?? {};
  const { hotel, roomType, checkIn, checkOut, guests = 2 } = state;

  const [step, setStep] = useState(0);
  const [payment, setPayment] = useState<PaymentMethod>('vnpay');
  const createBooking = useCreateBooking();
  const createPayment = useCreateVnpayPayment();
  // Giữ id booking đã tạo: bấm thanh toán lại chỉ gọi lại VNPay, không tạo booking trùng
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);

  const form = useForm<GuestDetailsValues>({
    resolver: zodResolver(guestDetailsSchema),
    defaultValues: {
      fullName: user?.fullName ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      specialRequests: '',
    },
  });

  const nights = nightsBetween(checkIn, checkOut);
  const subtotal = useMemo(() => {
    if (!roomType) return 0;
    if (roomType.totalPrice) return Number(roomType.totalPrice);
    return Number(roomType.basePrice) * nights;
  }, [roomType, nights]);

  // Thiếu dữ liệu phòng (vào thẳng URL) → mời quay lại tìm phòng
  if (!roomType || !checkIn || !checkOut) {
    return (
      <div className="mx-auto max-w-2xl px-margin-mobile py-16 md:px-8">
        <EmptyState
          icon={BedDouble}
          title={t('emptyTitle')}
          description={t('emptyDesc')}
          action={
            <Button className="bg-on-surface text-white hover:bg-primary" onClick={() => navigate(ROUTES.search)}>
              {t('findStay')}
            </Button>
          }
        />
      </div>
    );
  }

  const handleConfirm = async () => {
    try {
      // Tạo booking (pending, giữ chỗ) đúng một lần; lần bấm sau chỉ tạo lại URL VNPay.
      let bookingId = createdBookingId;
      if (!bookingId) {
        const values = form.getValues();
        const booking = await createBooking.mutateAsync({
          hotelId: roomType.hotelId,
          roomTypeId: roomType.id,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          numGuests: guests,
          specialRequests: values.specialRequests || undefined,
        });
        bookingId = booking.id;
        setCreatedBookingId(bookingId);
      }
      // Lấy URL cổng VNPay rồi chuyển trình duyệt sang để khách thanh toán.
      const { paymentUrl } = await createPayment.mutateAsync(bookingId);
      window.location.href = paymentUrl;
    } catch {
      // Lỗi hiển thị qua createBooking.isError / createPayment.isError ở bước review.
    }
  };

  const goPayment = form.handleSubmit(() => setStep(1));

  return (
    <div className="w-full py-10">
      <div className="mx-auto max-w-6xl px-margin-mobile md:px-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant hover:text-primary"
        >
          <ArrowLeft className="size-4" /> {t('common:back')}
        </button>

        <h1 className="font-be-vietnam text-[60px] font-bold text-on-surface">{t('title')}</h1>

        <div className="mt-8 flex flex-col gap-8 lg:flex-row">
          {/* Main */}
          <div className="min-w-0 flex-1">
            <div className="mb-8">
              <CheckoutStepper current={step} />
            </div>

            {/* Step 1 — Guest details */}
            {step === 0 && (
              <form
                onSubmit={goPayment}
                className="space-y-4 rounded-2xl border border-outline-variant/30 bg-surface p-6"
              >
                <h2 className="font-be-vietnam text-lg font-semibold text-on-surface">{t('guest.title')}</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="fullName">{t('guest.fullName')}</Label>
                    <Input id="fullName" {...form.register('fullName')} />
                    {form.formState.errors.fullName && (
                      <p className="text-xs text-error">{form.formState.errors.fullName.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="phone">{t('guest.phone')}</Label>
                    <Input id="phone" {...form.register('phone')} />
                    {form.formState.errors.phone && (
                      <p className="text-xs text-error">{form.formState.errors.phone.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <Label htmlFor="email">{t('guest.email')}</Label>
                    <Input id="email" type="email" {...form.register('email')} />
                    {form.formState.errors.email && (
                      <p className="text-xs text-error">{form.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <Label htmlFor="specialRequests">{t('guest.specialRequests')}</Label>
                    <textarea
                      id="specialRequests"
                      rows={3}
                      {...form.register('specialRequests')}
                      className="rounded-xl border border-outline-variant/40 bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
                      placeholder={t('guest.specialRequestsPlaceholder')}
                    />
                  </div>
                </div>
                <Button type="submit" size="lg" className="bg-on-surface text-white hover:bg-primary">
                  {t('guest.continue')} <ArrowRight className="size-4" />
                </Button>
              </form>
            )}

            {/* Step 2 — Payment */}
            {step === 1 && (
              <div className="space-y-5 rounded-2xl border border-outline-variant/30 bg-surface p-6">
                <h2 className="font-be-vietnam text-lg font-semibold text-on-surface">{t('payment.title')}</h2>
                <PaymentMethodSelect value={payment} onChange={setPayment} />
                <p className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                  <ShieldCheck className="size-4 text-primary" />
                  {t('payment.secureNote')}
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" size="lg" onClick={() => setStep(0)}>
                    {t('common:back')}
                  </Button>
                  <Button
                    size="lg"
                    className="bg-on-surface text-white hover:bg-primary"
                    onClick={() => setStep(2)}
                  >
                    {t('payment.review')} <ArrowRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3 — Confirm */}
            {step === 2 && (
              <div className="space-y-5 rounded-2xl border border-outline-variant/30 bg-surface p-6">
                <h2 className="font-be-vietnam text-lg font-semibold text-on-surface">{t('confirm.title')}</h2>
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-on-surface-variant">{t('confirm.guest')}</dt>
                    <dd className="font-medium text-on-surface">{form.getValues('fullName')}</dd>
                  </div>
                  <div>
                    <dt className="text-on-surface-variant">{t('confirm.email')}</dt>
                    <dd className="font-medium text-on-surface">{form.getValues('email')}</dd>
                  </div>
                  <div>
                    <dt className="text-on-surface-variant">{t('confirm.phone')}</dt>
                    <dd className="font-medium text-on-surface">{form.getValues('phone')}</dd>
                  </div>
                  <div>
                    <dt className="text-on-surface-variant">{t('confirm.guests')}</dt>
                    <dd className="font-medium text-on-surface">{guests}</dd>
                  </div>
                  <div>
                    <dt className="text-on-surface-variant">{t('confirm.payment')}</dt>
                    <dd className="font-medium text-on-surface">
                      {{
                        vnpay: t('methods.vnpay.label'),
                        sepay: t('methods.sepay.label'),
                        stripe: t('methods.stripe.label'),
                        cash: t('methods.cash.label'),
                      }[payment]}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-on-surface-variant">{t('confirm.specialRequests')}</dt>
                    <dd className="font-medium text-on-surface">
                      {form.getValues('specialRequests')?.trim() || t('confirm.none')}
                    </dd>
                  </div>
                </dl>
                {createBooking.isError && (
                  <p className="rounded-xl bg-error/10 px-3 py-2 text-sm text-error">
                    {errorMessage(createBooking.error, t('confirm.errorBooking'))}
                  </p>
                )}
                {createPayment.isError && (
                  <p className="rounded-xl bg-error/10 px-3 py-2 text-sm text-error">
                    {errorMessage(createPayment.error, t('confirm.errorPayment'))}
                  </p>
                )}
                <div className="flex gap-3">
                  <Button variant="outline" size="lg" onClick={() => setStep(1)}>
                    {t('common:back')}
                  </Button>
                  <Button
                    size="lg"
                    className="bg-primary text-on-primary hover:bg-primary/90"
                    disabled={createBooking.isPending || createPayment.isPending}
                    onClick={handleConfirm}
                  >
                    {createBooking.isPending
                      ? t('confirm.creatingBooking')
                      : createPayment.isPending
                        ? t('confirm.redirecting')
                        : createdBookingId
                          ? t('confirm.retryPayment')
                          : t('confirm.confirmPay')}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Summary sidebar */}
          <aside className="lg:w-80 lg:shrink-0">
            <div className="rounded-2xl border border-outline-variant/30 bg-surface p-6 lg:sticky lg:top-24">
              {hotel && (
                <h3 className="font-be-vietnam font-semibold text-on-surface">{hotel.name}</h3>
              )}
              <p className="mt-1 text-sm text-on-surface-variant">{roomType.name}</p>

              <div className="mt-4 space-y-2 text-sm text-on-surface-variant">
                <p className="flex items-center gap-2">
                  <CalendarDays className="size-4" />
                  {formatDateShort(checkIn)} → {formatDateShort(checkOut)}
                </p>
                <p className="flex items-center gap-2">
                  <BedDouble className="size-4" /> {t('common:nights', { count: nights })}
                </p>
                <p className="flex items-center gap-2">
                  <Users className="size-4" /> {t('common:guestsCount', { count: guests })}
                </p>
              </div>

              <div className="mt-5 border-t border-outline-variant/30 pt-5">
                <PriceSummary
                  lines={[
                    {
                      label: t('summary.roomLine', { count: nights }),
                      value: subtotal,
                    },
                  ]}
                  total={subtotal}
                />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
