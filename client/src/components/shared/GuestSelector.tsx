import { Minus, Plus, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';

interface GuestSelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  /** Nhãn phía trên. Mặc định "Số khách" — truyền vào khi tách Người lớn / Trẻ em. */
  label?: string;
  icon?: LucideIcon;
  className?: string;
}

/** Bộ tăng/giảm số khách. */
export default function GuestSelector({
  value,
  onChange,
  min = 1,
  max = 20,
  label,
  icon: Icon = Users,
  className,
}: GuestSelectorProps) {
  const { t } = useTranslation('common');
  const text = label ?? t('guests');
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <span className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant">
        <Icon className="size-3.5" /> {text}
      </span>
      <div className="flex h-11 items-center justify-between rounded-xl border border-outline-variant/40 bg-surface px-2">
        <button
          type="button"
          onClick={dec}
          disabled={value <= min}
          className="flex size-7 items-center justify-center rounded-lg text-on-surface-variant hover:bg-primary/10 hover:text-primary disabled:opacity-30"
          aria-label={`${text} -`}
        >
          <Minus className="size-4" />
        </button>
        <span className="min-w-8 text-center text-sm font-semibold text-on-surface">{value}</span>
        <button
          type="button"
          onClick={inc}
          disabled={value >= max}
          className="flex size-7 items-center justify-center rounded-lg text-on-surface-variant hover:bg-primary/10 hover:text-primary disabled:opacity-30"
          aria-label={`${text} +`}
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}
