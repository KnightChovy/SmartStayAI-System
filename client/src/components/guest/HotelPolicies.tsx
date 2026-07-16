import { useTranslation } from 'react-i18next';
import { Baby, Clock, Dog, Info, ShieldCheck } from 'lucide-react';
import type { HotelDetail, PetsPolicy } from '@/types/hotel.types';

/** Map enum thú cưng của BE sang key i18n (literal để `t()` type-safe). */
const PETS_KEY = {
  not_allowed: 'policies.petsNotAllowed',
  allowed: 'policies.petsAllowed',
  on_request: 'policies.petsOnRequest',
} as const satisfies Record<PetsPolicy, string>;

interface HotelPoliciesProps {
  hotel: HotelDetail;
}

/** Chính sách khách sạn — giờ nhận/trả, hủy, trẻ em, thú cưng + chính sách chi tiết từ DB. */
export default function HotelPolicies({ hotel }: HotelPoliciesProps) {
  const { t } = useTranslation('hotel');
  const rows: { icon: typeof Clock; label: string; value: string }[] = [];

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
  if (hotel.cancellationPolicy) {
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

  const extra = hotel.policies ?? [];
  if (rows.length === 0 && extra.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="font-be-vietnam text-2xl font-bold text-on-surface">
        {t('policies.title')}
      </h2>
      <dl className="mt-4 divide-y divide-outline-variant/30 rounded-2xl border border-outline-variant/30 bg-surface">
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex gap-3 p-4 sm:gap-4">
            <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <div className="min-w-0">
              <dt className="text-sm font-semibold text-on-surface">{label}</dt>
              <dd className="mt-0.5 text-sm text-on-surface-variant">{value}</dd>
            </div>
          </div>
        ))}
        {extra.map(p => (
          <div key={p.id} className="flex gap-3 p-4 sm:gap-4">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <div className="min-w-0">
              <dt className="text-sm font-semibold capitalize text-on-surface">
                {p.policyType.replace(/_/g, ' ')}
              </dt>
              <dd className="mt-0.5 text-sm text-on-surface-variant">
                {p.description ?? '—'}
              </dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}
