import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { useDestinations } from '@/hooks/destinations';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1200&auto=format&fit=crop';

export default function DiscoverVietnam() {
  const navigate = useNavigate();
  const { t } = useTranslation('home');
  const { data, isLoading } = useDestinations();

  // Tối đa 4 thành phố nhiều khách sạn nhất (`GET /v1/destinations` — sàn chỉ có KS ở VN).
  const cities = (data ?? []).slice(0, 4);

  if (!isLoading && cities.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-margin-mobile md:px-8 mb-section-gap w-full">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h2 className="font-be-vietnam text-2xl font-bold text-on-surface">
            {t('discover.title')}
          </h2>
          <p className="text-on-surface-variant text-sm font-medium font-be-vietnam">
            {t('discover.subtitle')}
          </p>
        </div>
        <Button
          variant="link"
          onClick={() => navigate('/search')}
          className="text-sm font-semibold text-primary hover:underline flex items-center gap-2 cursor-pointer h-auto p-0"
        >
          {t('discover.viewAll')}
          <span className="material-symbols-outlined text-sm font-bold">
            arrow_forward
          </span>
        </Button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <div className="aspect-4/5 rounded-3xl bg-surface-container animate-pulse mb-4" />
                <div className="h-4 w-24 bg-surface-container animate-pulse rounded" />
              </div>
            ))
          : cities.map(dest => (
              <div
                key={dest.city}
                onClick={() =>
                  navigate(`/search?city=${encodeURIComponent(dest.city)}`)
                }
                className="group cursor-pointer"
              >
                <div className="relative aspect-4/5 rounded-3xl overflow-hidden mb-4 shadow-md">
                  <img
                    alt={dest.city}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    src={dest.image ?? FALLBACK_IMAGE}
                  />
                </div>
                <h4 className="font-bold text-on-surface text-lg font-be-vietnam">
                  {dest.city}
                </h4>
                <p className="text-on-surface-variant text-sm font-be-vietnam">
                  {t('discover.stays', { count: dest.hotelCount })}
                </p>
              </div>
            ))}
      </div>
    </section>
  );
}
