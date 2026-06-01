import DiscoverVietnam from '../../components/home/DiscoverVietnam';
import TrendingDestinations from '../../components/home/TrendingDestinations';
import PopularVietnameseTourists from '../../components/home/PopularVietnameseTourists';

export default function Destinations() {
  return (
    <div className="py-12 flex flex-col items-center w-full">
      <div className="max-w-7xl mx-auto px-margin-mobile md:px-8 text-center mb-16">
        <span className="bg-premium-gold/10 text-premium-gold text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
          Curated Sanctuary Collections
        </span>
        <h1 className="font-be-vietnam text-display-lg md:text-5xl font-bold text-on-surface mt-6 mb-4">
          Sanctuaries Around the Globe
        </h1>
        <p className="font-be-vietnam text-base text-on-surface-variant max-w-xl mx-auto">
          Intelligent discovery matches you with destinations that resonate with
          your inner state of calm.
        </p>
      </div>

      <DiscoverVietnam />
      <TrendingDestinations />
      <PopularVietnameseTourists />
    </div>
  );
}
