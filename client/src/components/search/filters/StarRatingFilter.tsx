import { useTranslation } from 'react-i18next';
import { Star } from 'lucide-react';
import { cn } from '@/lib/cn';

interface StarRatingFilterProps {
  /** Các hạng sao đang chọn (1–5). */
  value: number[];
  onChange: (value: number[]) => void;
}

const STARS = [5, 4, 3, 2, 1];

/** Lọc theo hạng sao khách sạn — chip ngang, multi-select (SS-101). */
export default function StarRatingFilter({ value, onChange }: StarRatingFilterProps) {
  const { t } = useTranslation('search');

  const toggle = (star: number) => {
    onChange(value.includes(star) ? value.filter(s => s !== star) : [...value, star]);
  };

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-on-surface-variant">{t('stars.title')}</p>
      <div className="flex flex-wrap gap-2">
        {STARS.map(star => {
          const active = value.includes(star);
          return (
            <button
              key={star}
              type="button"
              onClick={() => toggle(star)}
              aria-pressed={active}
              aria-label={t('stars.label', { count: star })}
              className={cn(
                'flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                active
                  ? 'border-premium-gold bg-premium-gold/15 text-on-surface'
                  : 'border-outline-variant/50 text-on-surface-variant hover:border-premium-gold/60 hover:bg-premium-gold/5'
              )}
            >
              {star}
              <Star className="size-3 fill-premium-gold text-premium-gold" aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
