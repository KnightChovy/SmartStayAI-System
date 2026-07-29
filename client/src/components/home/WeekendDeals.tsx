import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import CardCarousel from '@/components/shared/CardCarousel';
import { useHotelsPricedToday } from '@/hooks/home';
import { ROUTES } from '@/constants/routes';
import { useMoney } from '@/hooks/currency';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&auto=format&fit=crop';

export default function WeekendDeals() {
  const navigate = useNavigate();
  const { t } = useTranslation('home');
  const { format } = useMoney();
  const [favorites, setFavorites] = useState<string[]>([]);

  const { results: hotels, isLoading } = useHotelsPricedToday({ limit: 8 });

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(fav => fav !== id) : [...prev, id]
    );
  };

  if (!isLoading && hotels.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-margin-mobile md:px-8 mb-section-gap w-full">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="font-be-vietnam text-2xl font-bold text-on-surface">
            {t('weekend.title')}
          </h2>
          <p className="text-on-surface-variant text-sm font-medium font-be-vietnam">
            {t('weekend.subtitle')}
          </p>
        </div>
        <Button
          variant="link"
          onClick={() => navigate('/search')}
          className="text-sm font-semibold text-primary hover:underline cursor-pointer h-auto p-0"
        >
          {t('weekend.viewAll')}
        </Button>
      </div>
      <CardCarousel count={isLoading ? 4 : hotels.length}>
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-surface-container-lowest rounded-3xl overflow-hidden"
              >
                <div className="h-48 bg-surface-container animate-pulse" />
                <div className="p-6 space-y-3">
                  <div className="h-3 w-20 bg-surface-container animate-pulse rounded" />
                  <div className="h-5 w-40 bg-surface-container animate-pulse rounded" />
                  <div className="h-5 w-28 bg-surface-container animate-pulse rounded" />
                </div>
              </div>
            ))
          : hotels.map(hotel => {
              const isFav = favorites.includes(hotel.id);
              const cover = hotel.images?.[0]?.url ?? FALLBACK_IMAGE;
              return (
                <div
                  key={hotel.id}
                  onClick={() => navigate(ROUTES.hotelDetail(hotel.id))}
                  className="flex h-full flex-col bg-surface-container-lowest rounded-3xl overflow-hidden premium-shadow group cursor-pointer border border-outline-variant/10 hover:scale-[1.01] transition-transform duration-300"
                >
                  <div className="relative h-48 overflow-hidden shrink-0">
                    <img
                      alt={hotel.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src={cover}
                    />
                    <Button
                      onClick={e => toggleFavorite(hotel.id, e)}
                      className={`absolute top-4 right-4 p-2 rounded-full backdrop-blur-md transition-all shadow-md cursor-pointer border-none h-auto min-w-0 ${isFav ? 'bg-red-500/80 hover:bg-red-500/90 text-white' : 'bg-white/20 text-white hover:bg-white/40'}`}
                    >
                      <span
                        className="material-symbols-outlined text-xl flex items-center justify-center"
                        style={{
                          fontVariationSettings: `'FILL' ${isFav ? 1 : 0}`,
                        }}
                      >
                        favorite
                      </span>
                    </Button>
                    {hotel.starRating ? (
                      <div className="absolute top-4 left-4 bg-surface/90 backdrop-blur-md text-[11px] font-bold px-2 py-1 rounded-md text-on-surface flex items-center gap-1">
                        <span
                          className="material-symbols-outlined text-xs text-premium-gold"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                        {t('weekend.star', { count: hotel.starRating })}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest font-be-vietnam line-clamp-1">
                        {[hotel.city, hotel.country].filter(Boolean).join(', ')}
                      </span>
                    </div>
                    <h4 className="font-be-vietnam font-semibold text-lg text-on-surface mb-4 line-clamp-1">
                      {hotel.name}
                    </h4>
                    <div className="mt-auto flex items-baseline gap-1">
                      <span className="text-sm text-on-surface-variant font-be-vietnam">
                        {t('weekend.from')}
                      </span>
                      <span className="font-be-vietnam font-bold text-lg text-on-surface">
                        {format(hotel.minPrice)}
                        <span className="text-sm font-normal text-on-surface-variant font-be-vietnam">
                          {' '}
                          {t('weekend.perNight')}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
      </CardCarousel>
    </section>
  );
}
