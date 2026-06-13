import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, BedDouble, CalendarDays, ShieldCheck, Users } from 'lucide-react';
import { useCreateBooking } from '@/hooks/bookings/use-bookings';
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

export default function BookingCheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore(state => state.user);
  const state = (location.state as CheckoutState | null) ?? {};
  const { hotel, roomType, checkIn, checkOut, guests = 2 } = state;

  const [step, setStep] = useState(0);
  const [payment, setPayment] = useState<PaymentMethod>('vnpay');
  const createBooking = useCreateBooking();

  const form = useForm<GuestDetailsValues>({
    resolver: zodResolver(guestDetailsSchema),
    defaultValues: {
      fullName: user?.name ?? '',
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
          title="No room selected"
          description="Start by searching for a stay and picking a room to book."
          action={
            <Button className="bg-on-surface text-white hover:bg-primary" onClick={() => navigate(ROUTES.search)}>
              Find a stay
            </Button>
          }
        />
      </div>
    );
  }

  const handleConfirm = async () => {
    const values = form.getValues();
    const booking = await createBooking.mutateAsync({
      hotelId: roomType.hotelId,
      roomTypeId: roomType.id,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      numGuests: guests,
      specialRequests: values.specialRequests || undefined,
    });
    navigate(ROUTES.bookingSuccess(booking.id), { state: { booking, hotel, roomType } });
  };

  const goPayment = form.handleSubmit(() => setStep(1));

  return (
    <div className="w-full py-10">
      <div className="mx-auto max-w-6xl px-margin-mobile md:px-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant hover:text-primary"
        >
          <ArrowLeft className="size-4" /> Back
        </button>

        <h1 className="font-be-vietnam text-3xl font-bold text-on-surface">Complete your booking</h1>

        <div className="mt-6 max-w-xl">
          <CheckoutStepper current={step} />
        </div>

        <div className="mt-8 flex flex-col gap-8 lg:flex-row">
          {/* Main */}
          <div className="min-w-0 flex-1">
            {/* Step 1 — Guest details */}
            {step === 0 && (
              <form
                onSubmit={goPayment}
                className="space-y-4 rounded-2xl border border-outline-variant/30 bg-surface p-6"
              >
                <h2 className="font-be-vietnam text-lg font-semibold text-on-surface">Guest details</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="fullName">Full name</Label>
                    <Input id="fullName" {...form.register('fullName')} />
                    {form.formState.errors.fullName && (
                      <p className="text-xs text-error">{form.formState.errors.fullName.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" {...form.register('phone')} />
                    {form.formState.errors.phone && (
                      <p className="text-xs text-error">{form.formState.errors.phone.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" {...form.register('email')} />
                    {form.formState.errors.email && (
                      <p className="text-xs text-error">{form.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <Label htmlFor="specialRequests">Special requests (optional)</Label>
                    <textarea
                      id="specialRequests"
                      rows={3}
                      {...form.register('specialRequests')}
                      className="rounded-xl border border-outline-variant/40 bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
                      placeholder="Late check-in, high floor, extra bed…"
                    />
                  </div>
                </div>
                <Button type="submit" size="lg" className="bg-on-surface text-white hover:bg-primary">
                  Continue to payment <ArrowRight className="size-4" />
                </Button>
              </form>
            )}

            {/* Step 2 — Payment */}
            {step === 1 && (
              <div className="space-y-5 rounded-2xl border border-outline-variant/30 bg-surface p-6">
                <h2 className="font-be-vietnam text-lg font-semibold text-on-surface">Payment method</h2>
                <PaymentMethodSelect value={payment} onChange={setPayment} />
                <p className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                  <ShieldCheck className="size-4 text-primary" />
                  This is a demo checkout — no real charge is made.
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" size="lg" onClick={() => setStep(0)}>
                    Back
                  </Button>
                  <Button
                    size="lg"
                    className="bg-on-surface text-white hover:bg-primary"
                    onClick={() => setStep(2)}
                  >
                    Review booking <ArrowRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3 — Confirm */}
            {step === 2 && (
              <div className="space-y-5 rounded-2xl border border-outline-variant/30 bg-surface p-6">
                <h2 className="font-be-vietnam text-lg font-semibold text-on-surface">Review &amp; confirm</h2>
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-on-surface-variant">Guest</dt>
                    <dd className="font-medium text-on-surface">{form.getValues('fullName')}</dd>
                  </div>
                  <div>
                    <dt className="text-on-surface-variant">Contact</dt>
                    <dd className="font-medium text-on-surface">{form.getValues('email')}</dd>
                  </div>
                  <div>
                    <dt className="text-on-surface-variant">Payment</dt>
                    <dd className="font-medium uppercase text-on-surface">{payment}</dd>
                  </div>
                  <div>
                    <dt className="text-on-surface-variant">Guests</dt>
                    <dd className="font-medium text-on-surface">{guests}</dd>
                  </div>
                </dl>
                {createBooking.isError && (
                  <p className="rounded-xl bg-error/10 px-3 py-2 text-sm text-error">
                    Could not create booking. The room may no longer be available for these dates.
                  </p>
                )}
                <div className="flex gap-3">
                  <Button variant="outline" size="lg" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button
                    size="lg"
                    className="bg-primary text-on-primary hover:bg-primary/90"
                    disabled={createBooking.isPending}
                    onClick={handleConfirm}
                  >
                    {createBooking.isPending ? 'Confirming…' : 'Confirm booking'}
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
                  <BedDouble className="size-4" /> {nights} night{nights === 1 ? '' : 's'}
                </p>
                <p className="flex items-center gap-2">
                  <Users className="size-4" /> {guests} guest{guests === 1 ? '' : 's'}
                </p>
              </div>

              <div className="mt-5 border-t border-outline-variant/30 pt-5">
                <PriceSummary
                  lines={[
                    {
                      label: `Room × ${nights} night${nights === 1 ? '' : 's'}`,
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
