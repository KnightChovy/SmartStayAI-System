import { useTranslation } from 'react-i18next';
import WeekendDeals from '../../components/home/WeekendDeals';
import LoyaltyBanner from '../../components/home/LoyaltyBanner';

export default function DealsPage() {
  const { t } = useTranslation('pages');

  return (
    <div className="py-12 flex flex-col items-center w-full">
      <div className="max-w-7xl mx-auto px-margin-mobile md:px-8 text-center mb-16">
        <span className="bg-ai-glow/20 text-on-surface text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
          {t('deals.eyebrow')}
        </span>
        <h1 className="font-be-vietnam text-display-lg md:text-5xl font-bold text-on-surface mt-6 mb-4">
          {t('deals.title')}
        </h1>
        <p className="font-be-vietnam text-base text-on-surface-variant max-w-xl mx-auto">
          {t('deals.subtitle')}
        </p>
      </div>

      <WeekendDeals />
      <LoyaltyBanner />
    </div>
  );
}
