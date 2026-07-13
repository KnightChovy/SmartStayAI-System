import { useNavigate } from 'react-router';
import { useCityDestinations } from '@/hooks/home';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1200&auto=format&fit=crop';

export default function TrendingDestinations() {
  const navigate = useNavigate();
  const { destinations, isLoading } = useCityDestinations();

  // Top thành phố theo số lượng khách sạn thật đang mở bán.
  const top = destinations.slice(0, 3);

  // Đang tải hoặc chưa có dữ liệu thật → không render section (tránh khoảng trống lạ).
  if (!isLoading && top.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-margin-mobile md:px-8 mb-section-gap w-full">
      <h2 className="font-be-vietnam text-2xl font-bold text-on-surface mb-8">
        Trending Destinations
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-112.5 rounded-3xl bg-surface-container animate-pulse"
              />
            ))
          : top.map(dest => (
              <div
                key={dest.city}
                onClick={() =>
                  navigate(`/search?city=${encodeURIComponent(dest.city)}`)
                }
                className="relative h-112.5 rounded-3xl overflow-hidden group cursor-pointer shadow-xl"
              >
                <img
                  alt={dest.city}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                  src={dest.image ?? FALLBACK_IMAGE}
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-10 left-10 text-white">
                  <h3 className="text-3xl font-bold mb-1 font-be-vietnam">
                    {dest.city}
                  </h3>
                  <p className="text-xs font-bold opacity-80 uppercase tracking-widest font-be-vietnam">
                    {dest.count} {dest.count === 1 ? 'Property' : 'Properties'}
                  </p>
                </div>
              </div>
            ))}
      </div>
    </section>
  );
}
