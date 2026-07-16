import { useTranslation } from 'react-i18next';
import { MapPin } from 'lucide-react';
import type { HotelNearbyPlace } from '@/types/hotel-property.types';

interface HotelNearbyProps {
  places: HotelNearbyPlace[];
}

/** Địa điểm lân cận + khoảng cách — bối cảnh vị trí, hỗ trợ ra quyết định. */
export default function HotelNearby({ places }: HotelNearbyProps) {
  const { t } = useTranslation('hotel');
  if (places.length === 0) return null;

  return (
    <div className="mt-5">
      <h3 className="font-be-vietnam font-semibold text-on-surface">{t('nearby.title')}</h3>
      <ul className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {places.map(p => (
          <li
            key={p.id}
            className="flex items-center justify-between gap-3 border-b border-outline-variant/20 py-1.5 text-sm"
          >
            <span className="flex min-w-0 items-center gap-2 text-on-surface-variant">
              <MapPin className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
              <span className="truncate">{p.name}</span>
            </span>
            <span className="shrink-0 font-medium text-on-surface">
              {Number(p.distance)} {p.distanceUnit}
              {p.journeyMinutes
                ? ` · ${t('nearby.minutes', { count: p.journeyMinutes })}`
                : ''}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
