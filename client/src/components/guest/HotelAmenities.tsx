import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Amenity } from '@/types/hotel.types';

/** Số tiện nghi hiện mặc định trước khi bấm "Show all" (progressive disclosure). */
const PREVIEW_COUNT = 8;

interface HotelAmenitiesProps {
  amenities: Amenity[];
}

/** Lưới tiện nghi cấp khách sạn — hiện 8 cái đầu, phần còn lại mở rộng khi bấm. */
export default function HotelAmenities({ amenities }: HotelAmenitiesProps) {
  const { t } = useTranslation('hotel');
  const [showAll, setShowAll] = useState(false);
  if (amenities.length === 0) return null;

  const visible = showAll ? amenities : amenities.slice(0, PREVIEW_COUNT);
  const hiddenCount = amenities.length - PREVIEW_COUNT;

  return (
    <section className="mt-10">
      <h2 className="font-be-vietnam text-2xl font-bold text-on-surface">
        {t('amenities.title')}
      </h2>
      <ul className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map(a => (
          <li key={a.id} className="flex items-center gap-2 text-sm text-on-surface-variant">
            <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />
            {a.name}
          </li>
        ))}
      </ul>
      {hiddenCount > 0 && (
        <Button
          variant="outline"
          className="mt-4 min-h-11"
          onClick={() => setShowAll(v => !v)}
        >
          {showAll
            ? t('amenities.showLess')
            : t('amenities.showAll', { count: amenities.length })}
        </Button>
      )}
    </section>
  );
}
