import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

const STEPS = ['Guest details', 'Payment', 'Confirm'];

/** Thanh tiến trình 3 bước của trang checkout. */
export default function CheckoutStepper({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-2">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const isLast = i === STEPS.length - 1;
        return (
          <li key={label} className={cn('flex items-center gap-2', !isLast && 'flex-1')}>
            <div
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors',
                done && 'bg-primary text-on-primary',
                active && 'bg-on-surface text-white',
                !done && !active && 'bg-surface-container-low text-on-surface-variant'
              )}
            >
              {done ? <Check className="size-4" /> : i + 1}
            </div>
            <span
              className={cn(
                'hidden text-sm font-semibold sm:block',
                active ? 'text-on-surface' : 'text-on-surface-variant'
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className="mx-1 h-px flex-1 bg-outline-variant/40" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
