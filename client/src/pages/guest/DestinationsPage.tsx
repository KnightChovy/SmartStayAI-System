import { useTranslation } from 'react-i18next';
import DiscoverVietnam from '../../components/home/DiscoverVietnam';
import TrendingDestinations from '../../components/home/TrendingDestinations';
import PopularVietnameseTourists from '../../components/home/PopularVietnameseTourists';

export default function DestinationsPage() {
  const { t } = useTranslation('pages');

  return (
    <div className="py-12 flex flex-col items-center w-full">
      <div className="max-w-7xl mx-auto px-margin-mobile md:px-8 text-center mb-16">
        <span className="bg-premium-gold/10 text-premium-gold text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
          {t('destinations.eyebrow')}
        </span>
        <h1 className="font-be-vietnam text-display-lg md:text-5xl font-bold text-on-surface mt-6 mb-4">
          {t('destinations.title')}
        </h1>
        <p className="font-be-vietnam text-base text-on-surface-variant max-w-xl mx-auto">
          {t('destinations.subtitle')}
        </p>
      </div>

      <DiscoverVietnam />
      <TrendingDestinations />
      <PopularVietnameseTourists />
    </div>
  );
}
