import { useTranslation } from 'react-i18next';
import { Star } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface StarRatingFilterProps {
  /** Các hạng sao đang chọn (1–5). */
  value: number[];
  onChange: (value: number[]) => void;
}

const STARS = [5, 4, 3, 2, 1];

/** Lọc theo hạng sao khách sạn — multi-select (SS-101). */
export default function StarRatingFilter({ value, onChange }: StarRatingFilterProps) {
  const { t } = useTranslation('search');

  const toggle = (star: number) => {
    onChange(value.includes(star) ? value.filter(s => s !== star) : [...value, star]);
  };

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-on-surface-variant">{t('stars.title')}</p>
      <ul className="space-y-1">
        {STARS.map(star => (
          <li key={star}>
            <label className="flex cursor-pointer items-center gap-2.5 py-0.5 text-sm text-on-surface">
              <Checkbox checked={value.includes(star)} onCheckedChange={() => toggle(star)} />
              <span className="flex items-center gap-0.5">
                {Array.from({ length: star }).map((_, i) => (
                  <Star key={i} className="size-3 fill-premium-gold text-premium-gold" aria-hidden="true" />
                ))}
                <span className="sr-only">{t('stars.label', { count: star })}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
