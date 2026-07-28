import { useTranslation } from 'react-i18next';
import {
  Landmark,
  Plane,
  Ticket,
  TrainFront,
  Trees,
  UtensilsCrossed,
  Waves,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { HotelNearbyPlace, NearbyCategory } from '@/types/hotel-property.types';

/**
 * Thứ tự nhóm hiển thị — theo mức khách quan tâm khi chọn khách sạn (điểm tham quan trước,
 * sân bay sau cùng), KHÔNG theo bảng chữ cái. BE trả `nearbyPlaces` không sắp xếp gì
 * (`orderBy: { createdAt: 'asc' }`) nên thứ tự nhóm do FE quyết định.
 */
const CATEGORY_ORDER = [
  'attraction',
  'landmark',
  'beach',
  'nature',
  'restaurant',
  'public_transport',
  'airport',
] as const satisfies readonly NearbyCategory[];

const CATEGORY_ICON = {
  attraction: Ticket,
  landmark: Landmark,
  beach: Waves,
  nature: Trees,
  restaurant: UtensilsCrossed,
  public_transport: TrainFront,
  airport: Plane,
} as const satisfies Record<NearbyCategory, LucideIcon>;

/** Key i18n của từng nhóm (literal để `t()` type-safe). */
const CATEGORY_KEY = {
  attraction: 'nearby.categories.attraction',
  landmark: 'nearby.categories.landmark',
  beach: 'nearby.categories.beach',
  nature: 'nearby.categories.nature',
  restaurant: 'nearby.categories.restaurant',
  public_transport: 'nearby.categories.publicTransport',
  airport: 'nearby.categories.airport',
} as const satisfies Record<NearbyCategory, string>;

const MILES_TO_KM = 1.60934;

/** Quy về km để so sánh — cùng một danh sách có thể lẫn `km` và `miles`. */
function distanceInKm(place: HotelNearbyPlace): number {
  const value = Number(place.distance);
  if (!Number.isFinite(value)) return Number.POSITIVE_INFINITY;
  return place.distanceUnit === 'miles' ? value * MILES_TO_KM : value;
}

interface HotelNearbyProps {
  places: HotelNearbyPlace[];
}

/** Địa điểm lân cận + khoảng cách, chia theo nhóm — bối cảnh vị trí, hỗ trợ ra quyết định. */
export default function HotelNearby({ places }: HotelNearbyProps) {
  const { t } = useTranslation('hotel');
  if (places.length === 0) return null;

  const groups = CATEGORY_ORDER.map(category => ({
    category,
    items: places
      .filter(p => p.category === category)
      .sort((a, b) => distanceInKm(a) - distanceInKm(b)),
  })).filter(group => group.items.length > 0);

  return (
    <div className="mt-5">
      <h3 className="font-be-vietnam font-semibold text-on-surface">{t('nearby.title')}</h3>
      <div className="mt-3 grid gap-x-8 gap-y-5 sm:grid-cols-2">
        {groups.map(({ category, items }) => {
          const Icon = CATEGORY_ICON[category];
          return (
            <section key={category}>
              <h4 className="flex items-center gap-2 text-sm font-semibold text-on-surface">
                <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
                {t(CATEGORY_KEY[category])}
              </h4>
              <ul className="mt-1.5">
                {items.map(p => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 border-b border-outline-variant/20 py-1.5 text-sm"
                  >
                    <span className="min-w-0 truncate text-on-surface-variant">{p.name}</span>
                    <span className="shrink-0 font-medium text-on-surface">
                      {Number(p.distance)} {p.distanceUnit}
                      {p.journeyMinutes
                        ? ` · ${t('nearby.minutes', { count: p.journeyMinutes })}`
                        : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
