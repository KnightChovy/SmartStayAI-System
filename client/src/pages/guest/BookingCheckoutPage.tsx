import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowRight,
  Bed,
  BedDouble,
  CalendarDays,
  Clock,
  Eye,
  Lock,
  MapPin,
  Maximize,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useProfile } from '@/hooks/account';
import { useCreateBooking } from '@/hooks/bookings';
import { useMoney } from '@/hooks/currency';
import { useHotel } from '@/hooks/hotels';
import { useCreateSepayPayment, useCreateVnpayPayment } from '@/hooks/payments';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/constants/routes';
import { guestDetailsSchema, type GuestDetailsValues } from '@/validations/checkout.validation';
import CheckoutStepper from '@/components/booking/CheckoutStepper';
import PaymentMethodSelect, { type PaymentMethod } from '@/components/booking/PaymentMethodSelect';
import SepayQrModal from '@/components/booking/SepayQrModal';
import HotelPolicies from '@/components/guest/HotelPolicies';
import PriceSummary from '@/components/shared/PriceSummary';
import StarRating from '@/components/shared/StarRating';
import EmptyState from '@/components/shared/EmptyState';
import BackLink from '@/components/shared/BackLink';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatAddress } from '@/utils/formatAddress';
import { formatDateShort, nightsBetween } from '@/utils/formatDate';
import type { HotelDetail, RoomType } from '@/types/hotel.types';
import type { SepayPaymentInfo } from '@/types/payment.types';

interface CheckoutState {
  /** Khách sạn truyền từ trang chi tiết — có `cancellationPolicy` để hiện ở tóm tắt. */
  hotel?: HotelDetail | null;
  roomType?: RoomType;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
}

/** Dấu bắt buộc cho label — có text ẩn cho screen reader (WCAG 3.3.2). */
function RequiredMark({ label }: { label: string }) {
  return (
    <span className="text-error" aria-hidden="false">
      *<span className="sr-only"> ({label})</span>
    </span>
  );
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
  const { format } = useMoney();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const state = (location.state as CheckoutState | null) ?? {};
  const { hotel: hotelSeed, roomType, checkIn, checkOut, guests = 2 } = state;

  // Router state chỉ mang bản tóm tắt từ trang chi tiết, nên nhiều field trong schema
  // (giờ nhận/trả phòng, cọc, tuổi tối thiểu, chính sách…) không tới được đây. Fetch bản
  // đầy đủ theo hotelId để trang đặt phòng luôn hiện đúng những gì DB đang có.
  const { data: hotelDetail } = useHotel(roomType?.hotelId ?? '', hotelSeed);
  const hotel = hotelDetail ?? hotelSeed;

  const [step, setStep] = useState(0);
  const [payment, setPayment] = useState<PaymentMethod>('vnpay');
  const createBooking = useCreateBooking();
  const createPayment = useCreateVnpayPayment();
  const createSepay = useCreateSepayPayment();
  const [sepayInfo, setSepayInfo] = useState<SepayPaymentInfo | null>(null);
  // Giữ id booking đã tạo: bấm thanh toán lại chỉ gọi lại VNPay, không tạo booking trùng
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);

  // Nguồn thật của hồ sơ là `GET /users/me`, KHÔNG phải `authStore`: store chỉ giữ ảnh chụp
  // user tại thời điểm đăng nhập và không bao giờ refresh, nên số điện thoại khách lưu ở trang
  // Account sau đó không tới được đây (ô Phone trống dù tài khoản đã có sđt). Store vẫn dùng
  // làm giá trị mồi để form có sẵn chữ trong lúc chờ API.
  const { data: profile } = useProfile({ enabled: isAuthenticated });

  const form = useForm<GuestDetailsValues>({
    resolver: zodResolver(guestDetailsSchema),
    // Xác thực ngay khi rời ô (phòng ngừa lỗi) thay vì chỉ khi submit.
    mode: 'onBlur',
    // Giá trị mồi từ store — hiện ngay lúc mount, trước khi `/users/me` trả về.
    defaultValues: {
      fullName: user?.fullName ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      specialRequests: '',
    },
    // Hồ sơ về sau khi form đã mount, nên phải nạp lại qua `values` (API reactive của RHF).
    // `keepDirtyValues` giữ nguyên những ô khách đã tự sửa.
    values: profile
      ? {
          fullName: profile.fullName ?? '',
          email: profile.email ?? '',
          phone: profile.phone ?? '',
          specialRequests: '',
        }
      : undefined,
    resetOptions: { keepDirtyValues: true },
  });

  const nights = nightsBetween(checkIn, checkOut);
  const subtotal = useMemo(() => {
    if (!roomType) return 0;
    if (roomType.totalPrice) return Number(roomType.totalPrice);
    return Number(roomType.basePrice) * nights;
  }, [roomType, nights]);
  /** Giá mỗi đêm suy từ tổng (khớp tuyệt đối với tổng, tránh lệch do làm tròn). */
  const perNight = nights > 0 ? subtotal / nights : Number(roomType?.basePrice ?? 0);

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
      // Tạo booking đúng một lần; bấm lại chỉ tạo lại URL thanh toán.
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
          // Phải gửi đúng phương thức khách chọn — trước đây bỏ trống nên BE luôn
          // mặc định 'vnpay', khiến "Thanh toán tại chỗ" vẫn bị đẩy sang VNPay.
          paymentMethod: payment,
        });
        bookingId = booking.id;
        setCreatedBookingId(bookingId);
      }

      // SePay: không redirect — hiện QR, SePay gọi webhook về BE, FE poll booking.
      if (payment === 'sepay') {
        const info = await createSepay.mutateAsync(bookingId);
        setSepayInfo(info);
        return;
      }

      // VNPay: lấy URL cổng rồi chuyển trình duyệt sang để khách thanh toán.
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
        <BackLink fallbackTo={ROUTES.search} />

        {/* H1 ~30px: nhãn trang không được lấn át form + giá (cấp bậc trực quan) */}
        <h1 className="font-be-vietnam text-3xl font-bold text-on-surface">{t('title')}</h1>

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
                    <Label htmlFor="fullName">
                      {t('guest.fullName')} <RequiredMark label={t('guest.requiredMark')} />
                    </Label>
                    <Input
                      id="fullName"
                      autoComplete="name"
                      aria-required="true"
                      aria-invalid={!!form.formState.errors.fullName}
                      {...form.register('fullName')}
                    />
                    {form.formState.errors.fullName && (
                      <p className="text-xs text-error">{form.formState.errors.fullName.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="phone">
                      {t('guest.phone')} <RequiredMark label={t('guest.requiredMark')} />
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      aria-required="true"
                      aria-invalid={!!form.formState.errors.phone}
                      {...form.register('phone')}
                    />
                    {form.formState.errors.phone && (
                      <p className="text-xs text-error">{form.formState.errors.phone.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <Label htmlFor="email">
                      {t('guest.email')} <RequiredMark label={t('guest.requiredMark')} />
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      aria-required="true"
                      aria-invalid={!!form.formState.errors.email}
                      {...form.register('email')}
                    />
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
                <Button
                  type="submit"
                  size="lg"
                  className="min-h-12 bg-on-surface text-white hover:bg-primary"
                  disabled={!form.formState.isValid}
                >
                  {t('guest.continue')} <ArrowRight className="size-4" />
                </Button>
              </form>
            )}

            {/* Step 2 — Payment */}
            {step === 1 && (
              <div className="space-y-5 rounded-2xl border border-outline-variant/30 bg-surface p-6">
                <h2 className="font-be-vietnam text-lg font-semibold text-on-surface">{t('payment.title')}</h2>
                <PaymentMethodSelect value={payment} onChange={setPayment} />
                <div className="space-y-1.5 rounded-xl bg-emerald-500/5 p-3">
                  {/* Ghi chú phải khớp phương thức đã chọn: VNPay redirect, SePay hiện QR */}
                  <p className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                    <ShieldCheck className="size-4 shrink-0 text-primary" aria-hidden="true" />
                    {payment === 'sepay' ? t('payment.sepayNote') : t('payment.secureNote')}
                  </p>
                  {/* Đảo ngược rủi ro: nói rõ chưa bị trừ tiền ở bước này */}
                  <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                    <Lock className="size-4 shrink-0" aria-hidden="true" />
                    {t('payment.notCharged')}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    className="min-h-12"
                    onClick={() => setStep(0)}
                  >
                    {t('common:back')}
                  </Button>
                  <Button
                    size="lg"
                    className="min-h-12 bg-on-surface text-white hover:bg-primary"
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
                {/*
                  Chính sách của chính khách sạn (giờ nhận/trả, huỷ, trẻ em, thú cưng, hút thuốc,
                  tuổi tối thiểu, số đêm tối đa, cọc, liên hệ) — khách phải thấy TRƯỚC khi trả tiền,
                  không phải chỉ ở trang chi tiết. Component tự ẩn khi khách sạn chưa nhập gì.
                */}
                {hotelDetail && <HotelPolicies hotel={hotelDetail} compact />}

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
                    disabled={createBooking.isPending || createPayment.isPending || createSepay.isPending}
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
                <>
                  <h3 className="font-be-vietnam font-semibold text-on-surface">{hotel.name}</h3>
                  {hotel.starRating ? (
                    <StarRating value={hotel.starRating} size={13} className="mt-1" />
                  ) : null}
                  <p className="mt-1 flex items-start gap-1.5 text-xs text-on-surface-variant">
                    <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                    {formatAddress(hotel.address, hotel.district, hotel.city, hotel.country)}
                  </p>
                </>
              )}
              <p className="mt-3 text-sm font-medium text-on-surface">{roomType.name}</p>

              {/* Thông số phòng từ DB: ưu tiên cấu hình giường chi tiết, fallback `bedType` cũ. */}
              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-on-surface-variant">
                {roomType.beds && roomType.beds.length > 0 ? (
                  <span className="flex items-center gap-1">
                    <Bed className="size-3.5" aria-hidden="true" />
                    {roomType.beds
                      .map(b => `${b.quantity}× ${b.bedType.replace(/_/g, ' ')}`)
                      .join(', ')}
                  </span>
                ) : (
                  roomType.bedType && (
                    <span className="flex items-center gap-1">
                      <Bed className="size-3.5" aria-hidden="true" /> {roomType.bedType}
                    </span>
                  )
                )}
                {roomType.areaSqm && (
                  <span className="flex items-center gap-1">
                    <Maximize className="size-3.5" aria-hidden="true" /> {roomType.areaSqm}{' '}
                    {roomType.sizeUnit === 'sqft' ? 'ft²' : 'm²'}
                  </span>
                )}
                {roomType.viewType && (
                  <span className="flex items-center gap-1">
                    <Eye className="size-3.5" aria-hidden="true" /> {roomType.viewType}
                  </span>
                )}
              </div>

              <div className="mt-4 space-y-2 text-sm text-on-surface-variant">
                <p className="flex items-center gap-2">
                  <CalendarDays className="size-4" />
                  {formatDateShort(checkIn)} → {formatDateShort(checkOut)}
                </p>
                {/* Giờ nhận/trả phòng có sẵn trong DB nhưng trước đây chỉ hiện ở trang chi tiết. */}
                {(hotel?.checkInTime || hotel?.checkOutTime) && (
                  <p className="flex items-center gap-2">
                    <Clock className="size-4" />
                    {[
                      hotel.checkInTime ? t('summary.checkInFrom', { time: hotel.checkInTime }) : null,
                      hotel.checkOutTime ? t('summary.checkOutUntil', { time: hotel.checkOutTime }) : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}
                <p className="flex items-center gap-2">
                  <BedDouble className="size-4" /> {t('common:nights', { count: nights })}
                </p>
                <p className="flex items-center gap-2">
                  <Users className="size-4" /> {t('common:guestsCount', { count: guests })}
                  {roomType.maxOccupancy ? (
                    <span className="text-xs">
                      {t('summary.maxOccupancy', { count: roomType.maxOccupancy })}
                    </span>
                  ) : null}
                </p>
              </div>

              <div className="mt-5 border-t border-outline-variant/30 pt-5">
                {/*
                  Breakdown từng khoản từ data sẵn có: giá/đêm × số đêm → tổng.
                  BE gộp thuế vào `totalAmount` (không tách trường tax/fee) nên dòng
                  Thuế & phí ghi rõ "Đã bao gồm" thay vì bịa một con số.
                */}
                <PriceSummary
                  lines={[
                    {
                      label: t('summary.perNightLine', {
                        price: format(perNight),
                        count: nights,
                      }),
                      value: subtotal,
                    },
                    { label: t('summary.taxesFees'), valueText: t('summary.included') },
                  ]}
                  total={subtotal}
                  totalLabel={t('summary.totalInclTaxes')}
                />
                <div className="mt-4 border-t border-outline-variant/30 pt-4">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-on-surface">
                    <ShieldCheck className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                    {t('trust.cancellation')}
                  </p>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    {hotel?.cancellationPolicy || t('trust.cancellationFallback')}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* SePay: QR + chờ webhook đối soát (không redirect như VNPay) */}
      <SepayQrModal
        open={!!sepayInfo}
        onClose={() => setSepayInfo(null)}
        bookingId={createdBookingId ?? ''}
        info={sepayInfo}
        onConfirmed={() => {
          setSepayInfo(null);
          if (createdBookingId) navigate(ROUTES.bookingSuccess(createdBookingId));
        }}
      />
    </div>
  );
}
