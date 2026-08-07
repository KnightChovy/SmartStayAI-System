import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useForm, useWatch } from 'react-hook-form';
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
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { useProfile, useUpdateProfile } from '@/hooks/account';
import { useCreateBooking } from '@/hooks/bookings';
import { useMoney } from '@/hooks/currency';
import { useHotel } from '@/hooks/hotels';
import {
  useCreateSepayPayment,
  useCreateVnpayPayment,
  usePayWithWallet,
} from '@/hooks/payments';
import { useMyWallet } from '@/hooks/wallet';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/constants/routes';
import { guestDetailsSchema, type GuestDetailsValues } from '@/validations/checkout.validation';
import CheckoutStepper from '@/components/booking/CheckoutStepper';
import PaymentMethodSelect, { type PaymentMethod } from '@/components/booking/PaymentMethodSelect';
import SepayQrModal from '@/components/booking/SepayQrModal';
import TermsModal from '@/components/booking/TermsModal';
import HotelPolicies from '@/components/guest/HotelPolicies';
import PriceSummary from '@/components/shared/PriceSummary';
import StarRating from '@/components/shared/StarRating';
import EmptyState from '@/components/shared/EmptyState';
import BackLink from '@/components/shared/BackLink';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { errorMessage } from '@/utils/errorMessage';
import { estimateTaxAndFees } from '@/utils/estimateTaxAndFees';
import { formatAddress } from '@/utils/formatAddress';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDateShort, nightsBetween } from '@/utils/formatDate';
import { isValidStayRange } from '@/utils/stayDates';
import type { HotelDetail, RoomType } from '@/types/hotel.types';
import type { SepayPaymentInfo } from '@/types/payment.types';

/** Số tiền THẬT của booking đã tạo — thay cho ước tính ngay khi có. */
interface BookingTotals {
  subtotal: string;
  discountAmount: string;
  taxAmount: string;
  feeAmount: string;
  totalAmount: string;
}

interface CheckoutState {
  /** Khách sạn truyền từ trang chi tiết — có `cancellationPolicy` để hiện ở tóm tắt. */
  hotel?: HotelDetail | null;
  roomType?: RoomType;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
  /** Cách CŨ (một số gộp) — chỉ còn để không vỡ state cũ đang nằm trong history. */
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

export default function BookingCheckoutPage() {
  const { t } = useTranslation(['booking', 'common']);
  const { format } = useMoney();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const state = (location.state as CheckoutState | null) ?? {};
  const { hotel: hotelSeed, roomType, checkIn, checkOut } = state;
  // State cũ (chỉ có `guests`) vẫn còn trong history của khách → coi toàn bộ là người lớn.
  const adults = state.adults ?? state.guests ?? 2;
  const children = state.children ?? 0;
  const guests = adults + children;

  // Router state chỉ mang bản tóm tắt từ trang chi tiết, nên nhiều field trong schema
  // (giờ nhận/trả phòng, cọc, tuổi tối thiểu, chính sách…) không tới được đây. Fetch bản
  // đầy đủ theo hotelId để trang đặt phòng luôn hiện đúng những gì DB đang có.
  const { data: hotelDetail, isPlaceholderData } = useHotel(roomType?.hotelId ?? '', hotelSeed);
  const hotel = hotelDetail ?? hotelSeed;

  const [step, setStep] = useState(0);
  const [payment, setPayment] = useState<PaymentMethod>('vnpay');
  const createBooking = useCreateBooking();
  const updateProfile = useUpdateProfile();
  const createPayment = useCreateVnpayPayment();
  const createSepay = useCreateSepayPayment();
  const [sepayInfo, setSepayInfo] = useState<SepayPaymentInfo | null>(null);
  // Giữ id booking đã tạo: bấm thanh toán lại chỉ gọi lại VNPay, không tạo booking trùng
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  // Số tiền thật của booking đã tạo + cờ báo lệch so với ước tính (xem `handleConfirm`).
  const [actualTotals, setActualTotals] = useState<BookingTotals | null>(null);
  const [priceChanged, setPriceChanged] = useState(false);
  // SS-402: đồng ý điều khoản (bắt buộc trước khi thanh toán). State ở cấp component nên GIỮ NGUYÊN
  // khi khách quay lại bước trước rồi tới lại (các bước chỉ là render có điều kiện, không unmount).
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  // Khách chủ động chọn tiêu số dư ví cho đơn này (mặc định KHÔNG).
  const [useWalletCredit, setUseWalletCredit] = useState(false);
  /**
   * Đã trừ ví cho booking đang tạo hay chưa. BẮT BUỘC phải nhớ: `handleConfirm` chạy lại được
   * (bấm lại sau khi thấy banner đổi giá, hoặc thanh toán cổng lỗi rồi thử lại) mà booking thì
   * chỉ tạo một lần — không có cờ này thì lượt bấm thứ hai lại gọi trừ ví thêm một lần nữa.
   */
  const [walletCharged, setWalletCharged] = useState(false);

  // Nguồn thật của hồ sơ là `GET /users/me`, KHÔNG phải `authStore`: store chỉ giữ ảnh chụp
  // user tại thời điểm đăng nhập và không bao giờ refresh, nên số điện thoại khách lưu ở trang
  // Account sau đó không tới được đây (ô Phone trống dù tài khoản đã có sđt). Store vẫn dùng
  // làm giá trị mồi để form có sẵn chữ trong lúc chờ API.
  const { data: profile } = useProfile({ enabled: isAuthenticated });
  // Ví chỉ có nghĩa với khách đã đăng nhập; `/booking` là route công khai nên phải gate.
  const { data: wallet } = useMyWallet({ enabled: isAuthenticated });
  const payWallet = usePayWithWallet();
  const walletBalance = Number(wallet?.balanceAvailable ?? 0);

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

  // SĐT tài khoản — nguồn DUY NHẤT mà BE dùng để liên hệ khách (xem `handleConfirm`).
  const profilePhone = profile?.phone?.trim() ?? '';
  // Khách đã có số trong hồ sơ nhưng đang gõ số khác ⇒ số tạm cho đơn này. Theo dõi ô nhập để
  // ghi chú bên dưới đổi ngay lúc gõ, không phải đợi submit mới biết.
  // Dùng `useWatch` (không phải `form.watch`) vì `watch` trả về hàm mới mỗi lần render nên
  // React Compiler bỏ qua memo hoá cả component.
  const watchedPhone = useWatch({ control: form.control, name: 'phone' })?.trim() ?? '';
  const isTempPhoneTyped = !!profilePhone && !!watchedPhone && watchedPhone !== profilePhone;

  const nights = nightsBetween(checkIn, checkOut);
  // TIỀN PHÒNG THUẦN (chưa thuế/phí). ⚠️ `roomType.totalPrice` từ `GET /hotels/:id/room-types`
  // giờ ĐÃ GỒM thuế/phí, nên KHÔNG được dùng làm subtotal nữa — trước đây dùng nó rồi cộng
  // tiếp thuế ước tính ⇒ khách thấy thuế hai lần. `subtotal` là field BE trả riêng cho đúng
  // khoản này; thiếu (vd phòng lấy từ endpoint chi tiết) thì mới suy từ giá đêm.
  const subtotal = useMemo(() => {
    if (!roomType) return 0;
    if (roomType.subtotal != null) return Number(roomType.subtotal);
    return Number(roomType.basePrice) * nights;
  }, [roomType, nights]);
  /** Giá mỗi đêm suy từ tổng (khớp tuyệt đối với tổng, tránh lệch do làm tròn). */
  const perNight = nights > 0 ? subtotal / nights : Number(roomType?.basePrice ?? 0);

  // `useHotel` dựng placeholder = seed + các relation RỖNG, nên trong lúc chờ API,
  // `hotelDetail.charges` là `[]` BỊA RA — đọc thẳng sẽ tính ra "không thuế" cho KS có VAT 8%.
  // Chỉ tin `hotelDetail` khi query đã về; chưa về thì dùng charges của seed (trang chi tiết
  // truyền nguyên `HotelDetail` sang nên thường đã có sẵn), còn không thì `undefined` = chưa biết.
  const charges = isPlaceholderData ? hotelSeed?.charges : hotelDetail?.charges;

  // Thuế/phí BE đã tính sẵn ở `GET /hotels/:id/room-types` (cùng hàm với lúc đặt) ⇒ ưu tiên
  // dùng số đó. Chỉ khi thiếu (phòng lấy từ endpoint chi tiết — endpoint đó KHÔNG trả thuế)
  // mới ước tính từ `charges`; không tính thì khách thấy tổng thấp hơn số VNPay/SePay charge.
  const quoted = useMemo(() => {
    if (roomType?.taxAmount == null || roomType?.feeAmount == null) return null;
    const taxAmount = Number(roomType.taxAmount);
    const feeAmount = Number(roomType.feeAmount);
    return { taxAmount, feeAmount, total: subtotal + taxAmount + feeAmount };
  }, [roomType, subtotal]);

  const estimated = useMemo(
    () => estimateTaxAndFees({ charges, subtotal, numNights: nights, numGuests: guests }),
    [charges, subtotal, nights, guests]
  );

  const estimate = quoted ?? estimated;

  // Booking đã tạo ⇒ chỉ hiện số của server. Chưa có ⇒ ước tính; chưa biết chính sách ⇒
  // về đúng hành vi cũ (chỉ tiền phòng) thay vì khẳng định "không thuế".
  const displaySubtotal = actualTotals ? Number(actualTotals.subtotal) : subtotal;
  const displayDiscount = actualTotals ? Number(actualTotals.discountAmount) : 0;
  const displayTax = actualTotals ? Number(actualTotals.taxAmount) : (estimate?.taxAmount ?? 0);
  const displayFee = actualTotals ? Number(actualTotals.feeAmount) : (estimate?.feeAmount ?? 0);
  const displayTotal = actualTotals
    ? Number(actualTotals.totalAmount)
    : (estimate?.total ?? subtotal);
  // So với số đang HIỂN THỊ (ước tính khi chưa tạo booking) nên chỉ dùng để chọn câu chú thích,
  // không dùng để quyết định luồng — con số chốt là `remainingToPay` mà BE trả về.
  const walletCoversAll = walletBalance >= displayTotal;

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

  // Chốt chặn cuối trước khi tạo booking thật: `checkIn`/`checkOut` tới đây qua router state,
  // các trang trước (chi tiết KS, chi tiết phòng) đã kẹp lại nhưng vẫn có thể bị bỏ qua nếu ai
  // đó tự dựng navigation state (đúng lý do BE cũng có `MAX_NIGHTS = 30` ở tầng service, không
  // chỉ tin FE) — chặn ở đây để khách thấy lỗi rõ ràng thay vì một câu 400 khó hiểu sau khi bấm
  // Xác nhận & Thanh toán.
  if (!isValidStayRange(checkIn, checkOut)) {
    return (
      <div className="mx-auto max-w-2xl px-margin-mobile py-16 md:px-8">
        <EmptyState
          icon={BedDouble}
          title={t('invalidDatesTitle')}
          description={t('invalidDatesDesc')}
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
    // Lần bấm thứ hai (sau khi đã thấy số thật) phải đi thẳng tới thanh toán.
    setPriceChanged(false);
    try {
      // Tạo booking đúng một lần; bấm lại chỉ tạo lại URL thanh toán.
      let bookingId = createdBookingId;
      if (!bookingId) {
        const values = form.getValues();

        // ----- SĐT: BE đọc `User.phone`, KHÔNG nhận qua payload (gửi vào là 400 "phone is not
        // allowed"), và chặn đặt khi hồ sơ chưa có số. Xem `booking.service.ts` → `createBooking`.
        const typedPhone = values.phone?.trim();
        const profilePhone = profile?.phone?.trim();

        // Hồ sơ CHƯA có số ⇒ buộc phải lưu lên hồ sơ, không thì BE chặn và khách không đặt được
        // dù đã điền SĐT ngay trên màn hình. Ô nhập có ghi chú rõ là số sẽ được lưu vào hồ sơ.
        if (!profilePhone && typedPhone) {
          await updateProfile.mutateAsync({ phone: typedPhone });
        }

        // Hồ sơ ĐÃ có số mà khách gõ số khác ⇒ coi là **số tạm cho đơn này**, KHÔNG đụng vào hồ sơ
        // (rất có thể là số người khác — đặt hộ bạn bè, số liên hệ chuyến đi). Nhưng BE vẫn gọi
        // `User.phone`, nên số tạm phải đi kèm ghi chú thì lễ tân mới thấy — nếu không, ô SĐT chỉ
        // là trang trí và khách tưởng KS sẽ gọi số vừa gõ.
        const isTempPhone = !!profilePhone && !!typedPhone && typedPhone !== profilePhone;
        const notes = [
          values.specialRequests?.trim() || null,
          isTempPhone ? t('confirm.tempPhoneNote', { phone: typedPhone }) : null,
        ].filter(Boolean);

        const booking = await createBooking.mutateAsync({
          hotelId: roomType.hotelId,
          roomTypeId: roomType.id,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          // Gửi TÁCH: BE đối chiếu riêng `numAdults` với `roomType.maxAdults` và `numChildren`
          // với `maxChildren`. Gộp hết vào `numGuests` như trước là khai trẻ em thành người lớn.
          numAdults: adults,
          numChildren: children,
          // BE giới hạn 1000 ký tự — cắt bớt còn hơn để 400 chặn cả lượt đặt.
          specialRequests: notes.length ? notes.join('\n').slice(0, 1000) : undefined,
          // Phải gửi đúng phương thức khách chọn — trước đây bỏ trống nên BE luôn
          // mặc định 'vnpay', khiến "Thanh toán tại chỗ" vẫn bị đẩy sang VNPay.
          paymentMethod: payment,
        });
        bookingId = booking.id;
        setCreatedBookingId(bookingId);

        // Server chốt giá, không phải ước tính của client. Lệch thì DỪNG LẠI cho khách
        // xem số thật trước — không bao giờ đẩy sang cổng thanh toán với số chưa từng hiện.
        setActualTotals({
          subtotal: booking.subtotal,
          discountAmount: booking.discountAmount,
          taxAmount: booking.taxAmount,
          feeAmount: booking.feeAmount,
          totalAmount: booking.totalAmount,
        });
        const quoted = estimate?.total ?? subtotal;
        // Dung sai nửa đồng: tiền VND, lệch thật luôn ≥ 1 — tránh banner vì rác dấu phẩy động.
        if (Math.abs(Number(booking.totalAmount) - quoted) >= 0.5) {
          setPriceChanged(true);
          return;
        }
      }

      // ----- Trừ ví TRƯỚC khi ra cổng.
      // Thứ tự này là bắt buộc: BE chỉ thu phần CÒN THIẾU ở cổng (`outstandingAmount`), nên trừ ví
      // trước thì VNPay/SePay tự thu ít đi. Làm ngược lại là khách trả đủ ở cổng rồi ví vẫn còn.
      if (useWalletCredit && walletBalance > 0 && !walletCharged) {
        try {
          const res = await payWallet.mutateAsync(bookingId);
          setWalletCharged(true);
          if (Number(res.remainingToPay) <= 0) {
            // Ví trả đủ ⇒ booking đã `confirmed`, KHÔNG được đẩy sang cổng nữa (BE sẽ trả 400
            // "Booking này đã được thanh toán đủ" và khách tưởng đặt phòng thất bại).
            navigate(ROUTES.bookingSuccess(bookingId));
            return;
          }
          toast.info(
            t('payment.walletPaidPartial', {
              amount: formatCurrency(res.walletApplied),
              remaining: formatCurrency(res.remainingToPay),
            })
          );
        } catch (err) {
          // Ví hỏng thì vẫn phải cho khách trả nốt qua cổng — booking đã tồn tại rồi, chặn ở đây
          // là bỏ khách lại với một đơn pending không có đường thanh toán.
          toast.error(errorMessage(err, t('payment.payError')));
        }
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
                    {form.formState.errors.phone ? (
                      <p className="text-xs text-error">{form.formState.errors.phone.message}</p>
                    ) : (
                      /* Ô này phải nói đúng số phận của cái số vừa gõ: hồ sơ trống thì nó sẽ được
                         lưu vào hồ sơ (BE bắt buộc mới đặt được); hồ sơ đã có số mà gõ khác thì
                         chỉ là số tạm cho đơn này, tài khoản không đổi. */
                      <p className="text-xs text-on-surface-variant">
                        {!profilePhone
                          ? t('guest.phoneWillSave')
                          : isTempPhoneTyped
                            ? t('guest.phoneTempNote')
                            : t('guest.phoneFromProfile')}
                      </p>
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
                {/*
                  Chính sách của chính khách sạn (giờ nhận/trả, huỷ, trẻ em, thú cưng, hút thuốc,
                  tuổi tối thiểu, số đêm tối đa, cọc, liên hệ) — khách đọc ngay ở bước điền thông
                  tin, trước cả khi chọn phương thức thanh toán. Component tự ẩn khi khách sạn
                  chưa nhập gì.
                */}
                {hotelDetail && <HotelPolicies hotel={hotelDetail} compact />}
                <Button
                  type="submit"
                  size="lg"
                  variant="cta"
                  className="min-h-12"
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

                {/*
                  Số dư ví — CỐ Ý mặc định KHÔNG tick. Ví khách chỉ có tiền khi họ từng huỷ một đơn
                  đã trả và chọn nhận về ví; đó là tiền họ có thể đang để dành, nên tiêu nó phải là
                  hành động chủ động chứ không phải mặc định âm thầm.
                */}
                {walletBalance > 0 && (
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-outline-variant/60 bg-surface-container-low p-4">
                    <Checkbox
                      checked={useWalletCredit}
                      onCheckedChange={v => setUseWalletCredit(v === true)}
                      className="mt-0.5"
                    />
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-on-surface">
                        <Wallet className="size-4 shrink-0 text-primary" aria-hidden="true" />
                        {t('payment.walletUse', {
                          balance: formatCurrency(wallet?.balanceAvailable),
                        })}
                      </span>
                      <span className="mt-0.5 block text-xs text-on-surface-variant">
                        {walletCoversAll
                          ? t('payment.walletCovers')
                          : t('payment.walletPartialHint')}
                      </span>
                    </span>
                  </label>
                )}

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
                    variant="cta"
                    className="min-h-12"
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
                    <dd className="font-medium text-on-surface">
                      {[
                        t('common:adultsCount', { count: adults }),
                        children > 0 ? t('common:childrenCount', { count: children }) : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </dd>
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
                {/*
                  Ước tính lệch số server chốt → dừng lại báo khách (tông cảnh báo, KHÔNG phải
                  lỗi). Bảng giá bên cạnh lúc này đã hiện số thật; bấm lần nữa là thanh toán.
                */}
                {priceChanged && actualTotals && (
                  <p className="rounded-xl bg-premium-gold/10 px-3 py-2 text-sm text-on-surface">
                    {t('confirm.priceUpdated', { total: format(actualTotals.totalAmount) })}
                  </p>
                )}

                {/* SS-402: đồng ý điều khoản (bắt buộc) + nhắc lại chính sách hủy */}
                <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low/40 p-4">
                  <label className="flex cursor-pointer items-start gap-3">
                    <Checkbox
                      checked={agreedTerms}
                      onCheckedChange={v => setAgreedTerms(v === true)}
                      aria-required="true"
                      className="mt-0.5"
                    />
                    <span className="text-sm text-on-surface">
                      {t('terms.agreePrefix')}
                      <button
                        type="button"
                        onClick={e => {
                          e.preventDefault();
                          setTermsOpen(true);
                        }}
                        className="font-semibold text-primary underline underline-offset-2 hover:text-primary/80"
                      >
                        {t('terms.termsLink')}
                      </button>
                    </span>
                  </label>
                  <p className="mt-2 flex items-start gap-1.5 pl-7 text-xs text-on-surface-variant">
                    <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
                    {hotel?.cancellationPolicy?.trim() || t('trust.cancellationFallback')}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" size="lg" onClick={() => setStep(1)}>
                    {t('common:back')}
                  </Button>
                  <Button
                    size="lg"
                    variant="cta"
                    disabled={
                      !agreedTerms ||
                      createBooking.isPending ||
                      createPayment.isPending ||
                      createSepay.isPending
                    }
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
                  Breakdown: tiền phòng (giá/đêm × số đêm) + thuế + phí = tổng.
                  Chưa tạo booking thì thuế/phí là ƯỚC TÍNH từ `hotel.policies`; tạo xong rồi
                  thì lấy số THẬT của BE. Mỗi dòng chỉ hiện khi > 0 nên khách sạn không thu
                  thuế/phí trông y hệt như trước.
                */}
                <PriceSummary
                  lines={[
                    {
                      label: t('summary.perNightLine', {
                        price: format(perNight),
                        count: nights,
                      }),
                      value: displaySubtotal,
                    },
                    ...(displayDiscount > 0
                      ? [{ label: t('summary.discount'), value: displayDiscount, negative: true }]
                      : []),
                    ...(displayTax > 0 ? [{ label: t('summary.tax'), value: displayTax }] : []),
                    ...(displayFee > 0 ? [{ label: t('summary.fee'), value: displayFee }] : []),
                  ]}
                  total={displayTotal}
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

      {/* SS-402: nội dung điều khoản + chính sách hủy */}
      <TermsModal
        open={termsOpen}
        onClose={() => setTermsOpen(false)}
        cancellationPolicy={hotel?.cancellationPolicy}
      />

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
