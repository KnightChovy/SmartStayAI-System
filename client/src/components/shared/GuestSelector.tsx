import { Minus, Plus, Users } from 'lucide-react';
import { cn } from '@/lib/cn';

interface GuestSelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

/** Bộ tăng/giảm số khách. */
export default function GuestSelector({
  value,
  onChange,
  min = 1,
  max = 20,
  className,
}: GuestSelectorProps) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <span className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant">
        <Users className="size-3.5" /> Guests
      </span>
      <div className="flex h-11 items-center justify-between rounded-xl border border-outline-variant/40 bg-surface px-2">
        <button
          type="button"
          onClick={dec}
          disabled={value <= min}
          className="flex size-7 items-center justify-center rounded-lg text-on-surface-variant hover:bg-primary/10 hover:text-primary disabled:opacity-30"
          aria-label="Decrease guests"
        >
          <Minus className="size-4" />
        </button>
        <span className="min-w-8 text-center text-sm font-semibold text-on-surface">{value}</span>
        <button
          type="button"
          onClick={inc}
          disabled={value >= max}
          className="flex size-7 items-center justify-center rounded-lg text-on-surface-variant hover:bg-primary/10 hover:text-primary disabled:opacity-30"
          aria-label="Increase guests"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}
