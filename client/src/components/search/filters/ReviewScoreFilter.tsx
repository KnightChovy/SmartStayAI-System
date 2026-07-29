import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';

interface ReviewScoreFilterProps {
  /** Điểm tối thiểu thang 10 (7|8|9); BE so trực tiếp `avgRating >= reviewScore`. undefined = bất kỳ. */
  value?: number;
  onChange: (value?: number) => void;
}

// avgRating đã ở thang 10 nên chip hiện ≥9.0/8.0/7.0, khớp thẳng giá trị gửi lên.
const SCORES = [9, 8, 7];

/** Lọc theo điểm đánh giá tối thiểu — chip ngang, single-select (SS-101). */
export default function ReviewScoreFilter({ value, onChange }: ReviewScoreFilterProps) {
  const { t } = useTranslation('search');

  const chip = (active: boolean) =>
    cn(
      'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
      active
        ? 'border-primary bg-primary/10 text-primary'
        : 'border-outline-variant/50 text-on-surface-variant hover:border-primary/60 hover:bg-primary/5'
    );

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-on-surface-variant">{t('reviewScore.title')}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => onChange(undefined)} aria-pressed={value == null} className={chip(value == null)}>
          {t('reviewScore.any')}
        </button>
        {SCORES.map(score => (
          <button
            key={score}
            type="button"
            onClick={() => onChange(score)}
            aria-pressed={value === score}
            className={chip(value === score)}
          >
            ≥ {score.toFixed(1)}
          </button>
        ))}
      </div>
    </div>
  );
}
