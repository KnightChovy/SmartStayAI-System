import { useTranslation } from 'react-i18next';
import type { HotelSortBy } from '@/types/hotel.types';

interface SortDropdownProps {
  value: HotelSortBy;
  onChange: (value: HotelSortBy) => void;
}

const OPTIONS = [
  { value: 'recommended', labelKey: 'sortRecommended' },
  { value: 'price:asc', labelKey: 'sortPriceAsc' },
  { value: 'price:desc', labelKey: 'sortPriceDesc' },
  { value: 'rating:desc', labelKey: 'sortRatingDesc' },
] as const satisfies readonly { value: HotelSortBy; labelKey: string }[];

/** Chọn cách sắp xếp — chỉ các giá trị BE whitelist (SS-103). */
export default function SortDropdown({ value, onChange }: SortDropdownProps) {
  const { t } = useTranslation('search');

  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-on-surface-variant">{t('sortBy')}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value as HotelSortBy)}
        className="h-11 rounded-xl border border-outline-variant/40 bg-surface px-3 text-sm text-on-surface outline-none focus:border-primary"
      >
        {OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>
            {t(opt.labelKey)}
          </option>
        ))}
      </select>
    </label>
  );
}
