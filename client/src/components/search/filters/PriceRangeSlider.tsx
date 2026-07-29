import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Slider } from '@/components/ui/slider';
import { formatCompactVnd } from '@/utils/formatCurrency';

interface PriceRangeSliderProps {
  /** Dải giá tối đa của slider (mặc định cố định 0–100tr). */
  bounds: { min: number; max: number };
  /** Giá trị hiện tại [min, max]. */
  value: [number, number];
  /** Gọi khi thả tay (onValueCommit) — tránh spam request khi kéo. */
  onCommit: (value: [number, number]) => void;
}

const STEP = 100_000;

/** Slider 2 đầu chọn khoảng giá/đêm (SS-101). Commit khi thả tay; nhãn dạng compact. */
export default function PriceRangeSlider({ bounds, value, onCommit }: PriceRangeSliderProps) {
  const { t } = useTranslation('search');
  // State cục bộ để nhãn cập nhật realtime khi kéo; đồng bộ khi prop đổi từ ngoài — chỉnh
  // ngay trong render (không dùng effect) để tránh cascading render.
  const [local, setLocal] = useState<[number, number]>(value);
  const [synced, setSynced] = useState<[number, number]>(value);
  if (value[0] !== synced[0] || value[1] !== synced[1]) {
    setSynced(value);
    setLocal(value);
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-on-surface-variant">{t('price.title')}</p>
      <Slider
        min={bounds.min}
        max={bounds.max}
        step={STEP}
        value={local}
        onValueChange={v => setLocal([v[0], v[1]])}
        onValueCommit={v => onCommit([v[0], v[1]])}
      />
      <div className="flex items-center justify-between text-xs font-medium text-on-surface">
        <span>{formatCompactVnd(local[0])}</span>
        <span>{formatCompactVnd(local[1])}</span>
      </div>
    </div>
  );
}
