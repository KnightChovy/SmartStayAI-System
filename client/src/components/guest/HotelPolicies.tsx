import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  Baby,
  Cigarette,
  CalendarRange,
  ChevronDown,
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
import type { LucideIcon } from 'lucide-react';
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

interface PolicyItem {
  key: string;
  icon: LucideIcon;
  label: string;
  value?: string | null;
  /** Khách sạn tự đánh dấu ở bảng `hotel_policies`; các dòng suy từ cột scalar luôn là false. */
  important: boolean;
}

interface HotelPoliciesProps {
  hotel: HotelDetail;
  /** Bản gọn cho trang đặt phòng: tiêu đề nhỏ, không có margin của section trang chi tiết. */
  compact?: boolean;
}

/** Một dòng chính sách. */
function PolicyRow({ item }: { item: PolicyItem }) {
  const { t } = useTranslation('hotel');
  const Icon = item.icon;
  return (
    <div className="flex gap-3 p-4 sm:gap-4">
      <Icon
        className={cn('mt-0.5 size-4 shrink-0', item.important ? 'text-tertiary' : 'text-primary')}
        aria-hidden="true"
      />
      <div className="min-w-0">
        <dt className="flex flex-wrap items-center gap-2 text-sm font-semibold text-on-surface">
          {item.label}
          {item.important && (
            <span className="rounded-full bg-tertiary-container px-2 py-0.5 text-[11px] font-semibold text-on-tertiary-container">
              {t('policies.important')}
            </span>
          )}
        </dt>
        {item.value && (
          <dd className="mt-0.5 text-sm text-on-surface-variant">{item.value}</dd>
        )}
      </div>
    </div>
  );
}

/**
 * Chính sách khách sạn — giờ nhận/trả, hủy, trẻ em, thú cưng + điều khoản chi tiết từ DB.
 *
 * Mặc định CHỈ hiện điều khoản khách sạn tự đánh dấu `important`; phần còn lại nằm sau nút
 * mở rộng. Khách sạn có tới cả chục dòng chính sách, đổ hết ra thì thứ thật sự phải đọc
 * (vd chính sách huỷ) chìm nghỉm giữa các dòng phụ như ngôn ngữ phục vụ hay email liên hệ.
 */
export default function HotelPolicies({ hotel, compact = false }: HotelPoliciesProps) {
  const { t } = useTranslation('hotel');
  const [expanded, setExpanded] = useState(false);
  const rows: PolicyItem[] = [];

  // Cùng một nội dung có thể tồn tại ở CẢ cột scalar của Hotel lẫn bảng `hotel_policies`
  // (vd chính sách huỷ). Từ migration `split_policy_and_charge`, bảng chỉ còn văn bản nên
  // không còn `policyType` để đối chiếu — chỉ có thể khử trùng bằng chính nội dung.
  const extra = hotel.policies ?? [];
  const detailedTexts = new Set(
    extra.flatMap(p => [norm(p.title), p.description ? norm(p.description) : ''])
  );

  if (hotel.checkInTime || hotel.checkOutTime) {
    rows.push({
      key: 'checkInOut',
      icon: Clock,
      important: false,
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
      key: 'cancellation',
      icon: ShieldCheck,
      important: false,
      label: t('policies.cancellation'),
      value: hotel.cancellationPolicy,
    });
  }
  if (hotel.childrenPolicy) {
    rows.push({
      key: 'children',
      icon: Baby,
      important: false,
      label: t('policies.children'),
      value: hotel.childrenPolicy,
    });
  }
  if (hotel.petsPolicy) {
    rows.push({
      key: 'pets',
      icon: Dog,
      important: false,
      label: t('policies.pets'),
      value: t(PETS_KEY[hotel.petsPolicy]),
    });
  }
  // `isSmokingAllowed` là boolean nên phải so với null — `false` (cấm hút thuốc) vẫn phải hiện.
  if (hotel.isSmokingAllowed != null) {
    rows.push({
      key: 'smoking',
      icon: Cigarette,
      important: false,
      label: t('policies.smoking'),
      value: hotel.isSmokingAllowed ? t('policies.smokingAllowed') : t('policies.smokingNotAllowed'),
    });
  }
  if (hotel.minGuestAge != null && hotel.minGuestAge > 0) {
    rows.push({
      key: 'minGuestAge',
      icon: UserCheck,
      important: false,
      label: t('policies.minGuestAge'),
      value: t('policies.minGuestAgeValue', { age: hotel.minGuestAge }),
    });
  }
  if (hotel.maxLengthOfStay != null) {
    rows.push({
      key: 'maxStay',
      icon: CalendarRange,
      important: false,
      label: t('policies.maxStay'),
      value: t('policies.maxStayValue', { count: hotel.maxLengthOfStay }),
    });
  }
  if (hotel.securityDepositAmount != null && Number(hotel.securityDepositAmount) > 0) {
    rows.push({
      key: 'deposit',
      icon: Wallet,
      important: false,
      label: t('policies.deposit'),
      // Tiền cọc là số tiền thật khách trả tại quầy ⇒ giữ VND, không quy đổi.
      value: t('policies.depositValue', { amount: formatCurrency(hotel.securityDepositAmount) }),
    });
  }
  if (hotel.languagesSpoken && hotel.languagesSpoken.length > 0) {
    rows.push({
      key: 'languages',
      icon: Languages,
      important: false,
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
    rows.push({
      key: 'phone',
      icon: Phone,
      important: false,
      label: t('contacts.phone'),
      value: phones.join(' · '),
    });
  }
  if (emails.length > 0) {
    rows.push({
      key: 'email',
      icon: Mail,
      important: false,
      label: t('contacts.email'),
      value: emails.join(' · '),
    });
  }

  // Điều khoản văn bản từ bảng `hotel_policies`.
  const detailed: PolicyItem[] = extra.map(p => ({
    key: p.id,
    icon: p.important ? AlertTriangle : Info,
    label: p.title,
    value: p.description,
    important: p.important,
  }));

  // Khách sạn tự nhập một điều khoản TRÙNG TÊN với ô có cấu trúc (vd "Thú cưng") thì chỉ giữ
  // bản của họ: đúng chữ họ viết, và họ mới là bên đánh dấu `important`. Chỉ khớp CHÍNH XÁC
  // sau chuẩn hoá — đoán mò kiểu "gần giống" sẽ nuốt mất điều khoản thật sự khác.
  const all = [...detailed, ...rows.filter(r => !detailedTexts.has(norm(r.label)))];
  const important = all.filter(i => i.important);
  const others = all.filter(i => !i.important);

  if (all.length === 0) return null;

  const listId = compact ? 'hotel-policies-more-compact' : 'hotel-policies-more';

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
        {important.map(item => (
          <PolicyRow key={item.key} item={item} />
        ))}

        {/* Không có dòng nào được đánh dấu quan trọng → mở sẵn 1 dòng đầu để khối không trống trơn. */}
        {important.length === 0 && others.length > 0 && <PolicyRow item={others[0]} />}

        {others.length > (important.length === 0 ? 1 : 0) && (
          <>
            {expanded && (
              <div id={listId} className="divide-y divide-outline-variant/30">
                {others.slice(important.length === 0 ? 1 : 0).map(item => (
                  <PolicyRow key={item.key} item={item} />
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => setExpanded(v => !v)}
              aria-expanded={expanded}
              aria-controls={listId}
              className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-b-2xl px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-surface-container/60"
            >
              {expanded
                ? t('policies.showLess')
                : t('policies.showMore', {
                    count: others.length - (important.length === 0 ? 1 : 0),
                  })}
              <ChevronDown
                className={cn('size-4 transition-transform', expanded && 'rotate-180')}
                aria-hidden="true"
              />
            </button>
          </>
        )}
      </dl>
    </section>
  );
}
