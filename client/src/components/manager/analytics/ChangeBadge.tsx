import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Badge % thay đổi cho KPI cards (A1): xanh↑ / đỏ↓ / xám– theo dấu; null → "—"
 * (không đủ dữ liệu kỳ trước).
 */
export function ChangeBadge({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-xs text-slate-300">—</span>;
  }
  const isZero = value === 0;
  const isUp = value > 0;
  const Icon = isZero ? Minus : isUp ? ArrowUpRight : ArrowDownRight;
  const tone = isZero ? 'text-slate-500' : isUp ? 'text-emerald-600' : 'text-red-500';
  return (
    <span className={cn('flex items-center gap-0.5 text-xs font-semibold', tone)}>
      <Icon className="w-3 h-3" />
      {isUp ? '+' : ''}
      {value}%
    </span>
  );
}
