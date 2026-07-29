import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import type { Amenity } from '@/types/hotel.types';

interface AmenitiesFilterProps {
  /** Danh mục tiện nghi cấp khách sạn (`GET /amenities?category=hotel`). */
  amenities: Amenity[];
  /** amenityId đang chọn. */
  value: string[];
  onChange: (value: string[]) => void;
}

const COLLAPSED = 6;

/** Lọc theo tiện nghi — chip ngang, KS phải có ĐỦ tất cả (AND ở BE) (SS-101). */
export default function AmenitiesFilter({ amenities, value, onChange }: AmenitiesFilterProps) {
  const { t } = useTranslation('search');
  const [expanded, setExpanded] = useState(false);

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter(a => a !== id) : [...value, id]);
  };

  const shown = expanded ? amenities : amenities.slice(0, COLLAPSED);

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-on-surface-variant">{t('amenities.title')}</p>
      <div className="flex flex-wrap gap-2">
        {shown.map(a => {
          const active = value.includes(a.id);
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => toggle(a.id)}
              aria-pressed={active}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                active
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-outline-variant/50 text-on-surface-variant hover:border-primary/60 hover:bg-primary/5'
              )}
            >
              {a.name}
            </button>
          );
        })}
      </div>
      {amenities.length > COLLAPSED && (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="text-xs font-semibold text-primary hover:underline"
        >
          {expanded ? t('amenities.showLess') : t('amenities.showMore')}
        </button>
      )}
    </div>
  );
}
