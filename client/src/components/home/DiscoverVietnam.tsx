import { useNavigate } from 'react-router';
import { Button } from '../ui/button';
import { useCityDestinations } from '@/hooks/home';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1200&auto=format&fit=crop';

export default function DiscoverVietnam() {
  const navigate = useNavigate();
  const { destinations, isLoading } = useCityDestinations();

  // Điểm đến trong nước (Việt Nam) thật, tối đa 4 thành phố nhiều khách sạn nhất.
  const cities = destinations
    .filter(d => !d.country || d.country.toLowerCase().includes('viet'))
    .slice(0, 4);

  if (!isLoading && cities.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-margin-mobile md:px-8 mb-section-gap w-full">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h2 className="font-be-vietnam text-2xl font-bold text-on-surface">
            Discover Vietnam
          </h2>
          <p className="text-on-surface-variant text-sm font-medium font-be-vietnam">
            Curated "Quiet Luxury" escapes in the heart of the East.
          </p>
        </div>
        <Button
          variant="link"
          onClick={() => navigate('/search')}
          className="text-sm font-semibold text-primary hover:underline flex items-center gap-2 cursor-pointer h-auto p-0"
        >
          View all destinations
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
                  {dest.count} {dest.count === 1 ? 'stay' : 'stays'} available
                </p>
              </div>
            ))}
      </div>
    </section>
  );
}
