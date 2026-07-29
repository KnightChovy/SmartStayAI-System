import { useTranslation } from 'react-i18next';

interface ReviewScoreFilterProps {
  /** Điểm tối thiểu thang 10 (7|8|9); BE so trực tiếp `avgRating >= reviewScore`. undefined = bất kỳ. */
  value?: number;
  onChange: (value?: number) => void;
}

// avgRating đã ở thang 10 nên nhãn cũng thang 10 (≥9.0/8.0/7.0), khớp thẳng giá trị `score` gửi lên.
const OPTIONS = [
  { score: undefined, labelKey: 'reviewScore.any' as const },
  { score: 9, labelKey: 'reviewScore.score9' as const },
  { score: 8, labelKey: 'reviewScore.score8' as const },
  { score: 7, labelKey: 'reviewScore.score7' as const },
];

/** Lọc theo điểm đánh giá tối thiểu — radio (SS-101). */
export default function ReviewScoreFilter({ value, onChange }: ReviewScoreFilterProps) {
  const { t } = useTranslation('search');

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-on-surface-variant">{t('reviewScore.title')}</p>
      <ul className="space-y-1.5">
        {OPTIONS.map(opt => (
          <li key={opt.labelKey}>
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-on-surface">
              <input
                type="radio"
                name="reviewScore"
                checked={value === opt.score}
                onChange={() => onChange(opt.score)}
                className="size-4 accent-primary"
              />
              {t(opt.labelKey)}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
