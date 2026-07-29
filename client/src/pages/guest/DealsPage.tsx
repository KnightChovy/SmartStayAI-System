import { useTranslation } from 'react-i18next';
import { Tag } from 'lucide-react';
import { useDeals } from '@/hooks/deals';
import DealCard from '../../components/guest/DealCard';
import LoyaltyBanner from '../../components/home/LoyaltyBanner';
import EmptyState from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';

export default function DealsPage() {
  const { t } = useTranslation('pages');
  const { data: deals, isLoading, isError } = useDeals({ limit: 24 });

  return (
    <div className="py-12 flex flex-col items-center w-full">
      <div className="max-w-7xl mx-auto px-margin-mobile md:px-8 text-center mb-12">
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

      <section className="mx-auto mb-16 w-full max-w-7xl px-margin-mobile md:px-8">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-80 w-full rounded-3xl" />
            ))}
          </div>
        ) : isError || !deals || deals.length === 0 ? (
          <EmptyState
            icon={Tag}
            title={t('deals.emptyTitle')}
            description={t('deals.emptyDesc')}
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {deals.map(deal => (
              <DealCard key={deal.promotionId} deal={deal} />
            ))}
          </div>
        )}
      </section>

      <LoyaltyBanner />
    </div>
  );
}
