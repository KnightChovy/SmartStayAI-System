import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ChangeBadgeProps {
  /** % change vs previous period; null = not enough data. */
  value: number | null;
  className?: string;
}

export function ChangeBadge({ value, className }: ChangeBadgeProps) {
  if (value === null) {
    return <span className={cn('text-xs text-muted-foreground', className)}>—</span>;
  }

  const isZero = value === 0;
  const isUp = value > 0;
  const Icon = isZero ? Minus : isUp ? ArrowUpRight : ArrowDownRight;
  const tone = isZero
    ? 'text-slate-500 bg-slate-100'
    : isUp
      ? 'text-emerald-600 bg-emerald-50'
      : 'text-red-500 bg-red-50';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold',
        tone,
        className
      )}
    >
      <Icon className="size-3" />
      {isUp ? '+' : ''}
      {value}%
    </span>
  );
}
