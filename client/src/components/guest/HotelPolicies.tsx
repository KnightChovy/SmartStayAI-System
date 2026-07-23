import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  Baby,
  Cigarette,
  CalendarRange,
  Clock,
  Dog,
  Info,
  Languages,
  Mail,
  Phone,
  ShieldCheck,
  UserCheck,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/utils/formatCurrency';
import type { HotelDetail, PetsPolicy } from '@/types/hotel.types';

/** Map enum thú cưng của BE sang key i18n (literal để `t()` type-safe). */
const PETS_KEY = {
  not_allowed: 'policies.petsNotAllowed',
  allowed: 'policies.petsAllowed',
  on_request: 'policies.petsOnRequest',
} as const satisfies Record<PetsPolicy, string>;

/** Chuẩn hoá để so trùng nội dung giữa cột scalar và bảng `hotel_policies`. */
const norm = (v: string) => v.trim().toLowerCase();

interface HotelPoliciesProps {
  hotel: HotelDetail;
  /** Bản gọn cho trang đặt phòng: tiêu đề nhỏ, không có margin của section trang chi tiết. */
  compact?: boolean;
}

/** Chính sách khách sạn — giờ nhận/trả, hủy, trẻ em, thú cưng + chính sách chi tiết từ DB. */
export default function HotelPolicies({ hotel, compact = false }: HotelPoliciesProps) {
  const { t } = useTranslation('hotel');
  const rows: { icon: typeof Clock; label: string; value: string }[] = [];

  // Cùng một nội dung có thể tồn tại ở CẢ cột scalar của Hotel lẫn bảng `hotel_policies`
  // (vd chính sách huỷ). Từ migration `split_policy_and_charge`, bảng chỉ còn văn bản nên
  // không còn `policyType` để đối chiếu — chỉ có thể khử trùng bằng chính nội dung.
  const extra = hotel.policies ?? [];
  const detailedTexts = new Set(
    extra.flatMap(p => [norm(p.title), p.description ? norm(p.description) : ''])
  );

  if (hotel.checkInTime || hotel.checkOutTime) {
    rows.push({
      icon: Clock,
      label: t('policies.checkInOut'),
      value: [
        hotel.checkInTime ? t('policies.from', { time: hotel.checkInTime }) : null,
        hotel.checkOutTime ? t('policies.until', { time: hotel.checkOutTime }) : null,
      ]
        .filter(Boolean)
        .join(' · '),
    });
  }
  if (hotel.cancellationPolicy && !detailedTexts.has(norm(hotel.cancellationPolicy))) {
    rows.push({
      icon: ShieldCheck,
      label: t('policies.cancellation'),
      value: hotel.cancellationPolicy,
    });
  }
  if (hotel.childrenPolicy) {
    rows.push({ icon: Baby, label: t('policies.children'), value: hotel.childrenPolicy });
  }
  if (hotel.petsPolicy) {
    rows.push({ icon: Dog, label: t('policies.pets'), value: t(PETS_KEY[hotel.petsPolicy]) });
  }
  // `isSmokingAllowed` là boolean nên phải so với null — `false` (cấm hút thuốc) vẫn phải hiện.
  if (hotel.isSmokingAllowed != null) {
    rows.push({
      icon: Cigarette,
      label: t('policies.smoking'),
      value: hotel.isSmokingAllowed ? t('policies.smokingAllowed') : t('policies.smokingNotAllowed'),
    });
  }
  if (hotel.minGuestAge != null && hotel.minGuestAge > 0) {
    rows.push({
      icon: UserCheck,
      label: t('policies.minGuestAge'),
      value: t('policies.minGuestAgeValue', { age: hotel.minGuestAge }),
    });
  }
  if (hotel.maxLengthOfStay != null) {
    rows.push({
      icon: CalendarRange,
      label: t('policies.maxStay'),
      value: t('policies.maxStayValue', { count: hotel.maxLengthOfStay }),
    });
  }
  if (hotel.securityDepositAmount != null && Number(hotel.securityDepositAmount) > 0) {
    rows.push({
      icon: Wallet,
      label: t('policies.deposit'),
      // Tiền cọc là số tiền thật khách trả tại quầy ⇒ giữ VND, không quy đổi.
      value: t('policies.depositValue', { amount: formatCurrency(hotel.securityDepositAmount) }),
    });
  }
  if (hotel.languagesSpoken && hotel.languagesSpoken.length > 0) {
    rows.push({
      icon: Languages,
      label: t('policies.languages'),
      value: hotel.languagesSpoken.join(', ').toUpperCase(),
    });
  }

  // Liên hệ khách sạn (BE trả `contacts` + scalar phone/email) — gộp vào cùng bảng.
  const phones = [
    hotel.phone,
    ...(hotel.contacts ?? []).map(c => c.phone).filter(Boolean),
  ].filter((v, i, arr): v is string => !!v && arr.indexOf(v) === i);
  const emails = [
    hotel.email,
    ...(hotel.contacts ?? []).map(c => c.email).filter(Boolean),
  ].filter((v, i, arr): v is string => !!v && arr.indexOf(v) === i);

  if (phones.length > 0) {
    rows.push({ icon: Phone, label: t('contacts.phone'), value: phones.join(' · ') });
  }
  if (emails.length > 0) {
    rows.push({ icon: Mail, label: t('contacts.email'), value: emails.join(' · ') });
  }

  if (rows.length === 0 && extra.length === 0) return null;

  return (
    <section className={compact ? '' : 'mt-10'}>
      <h2
        className={cn(
          'font-be-vietnam font-bold text-on-surface',
          compact ? 'text-lg font-semibold' : 'text-2xl'
        )}
      >
        {t('policies.title')}
      </h2>
      <dl
        className={cn(
          'mt-4 divide-y divide-outline-variant/30 rounded-2xl border border-outline-variant/30 bg-surface',
          compact && 'mt-3'
        )}
      >
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex gap-3 p-4 sm:gap-4">
            <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <div className="min-w-0">
              <dt className="text-sm font-semibold text-on-surface">{label}</dt>
              <dd className="mt-0.5 text-sm text-on-surface-variant">{value}</dd>
            </div>
          </div>
        ))}
        {/* Điều khoản văn bản từ bảng `hotel_policies` — BE đã sort `important` lên đầu. */}
        {extra.map(p => (
          <div key={p.id} className="flex gap-3 p-4 sm:gap-4">
            {p.important ? (
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0 text-tertiary"
                aria-hidden="true"
              />
            ) : (
              <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            )}
            <div className="min-w-0">
              <dt className="flex flex-wrap items-center gap-2 text-sm font-semibold text-on-surface">
                {p.title}
                {p.important && (
                  <span className="rounded-full bg-tertiary-container px-2 py-0.5 text-[11px] font-semibold text-on-tertiary-container">
                    {t('policies.important')}
                  </span>
                )}
              </dt>
              {p.description && (
                <dd className="mt-0.5 text-sm text-on-surface-variant">{p.description}</dd>
              )}
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}
