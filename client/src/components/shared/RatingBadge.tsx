import { useTranslation } from 'react-i18next';
import { Star } from 'lucide-react';
import { usePlatformStats } from '@/hooks/platform';
import { cn } from '@/lib/cn';

interface RatingBadgeProps {
  className?: string;
}

export default function RatingBadge({ className }: RatingBadgeProps) {
  const { t } = useTranslation('home');
  const { data } = usePlatformStats();

  if (!data || data.avgRating == null) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full bg-premium-gold/15 px-4 py-1.5 text-sm font-semibold text-on-surface',
        className
      )}
    >
      <Star
        className="size-4 fill-premium-gold text-premium-gold"
        aria-hidden="true"
      />
      {t('ratingBadge', {
        score: data.avgRating.toFixed(1),
        count: data.totalReviews,
      })}
    </span>
  );
}
