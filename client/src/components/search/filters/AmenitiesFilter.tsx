import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/checkbox';
import type { Amenity } from '@/types/hotel.types';

interface AmenitiesFilterProps {
  /** Danh mục tiện nghi cấp khách sạn (`GET /amenities?category=hotel`). */
  amenities: Amenity[];
  /** amenityId đang chọn. */
  value: string[];
  onChange: (value: string[]) => void;
}

const COLLAPSED = 6;

/** Lọc theo tiện nghi — KS phải có ĐỦ tất cả (AND ở BE) (SS-101). */
export default function AmenitiesFilter({ amenities, value, onChange }: AmenitiesFilterProps) {
  const { t } = useTranslation('search');
  const [expanded, setExpanded] = useState(false);

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter(a => a !== id) : [...value, id]);
  };

  const shown = expanded ? amenities : amenities.slice(0, COLLAPSED);

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-on-surface-variant">{t('amenities.title')}</p>
      <ul className="space-y-1.5">
        {shown.map(a => (
          <li key={a.id}>
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-on-surface">
              <Checkbox checked={value.includes(a.id)} onCheckedChange={() => toggle(a.id)} />
              <span className="line-clamp-1">{a.name}</span>
            </label>
          </li>
        ))}
      </ul>
      {amenities.length > COLLAPSED && (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="text-sm font-semibold text-primary hover:underline"
        >
          {expanded ? t('amenities.showLess') : t('amenities.showMore')}
        </button>
      )}
    </div>
  );
}
