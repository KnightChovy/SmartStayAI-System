import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ChangeBadgeProps {
  /** % thay đổi so kỳ trước; null = không đủ dữ liệu kỳ trước. */
  value: number | null;
  className?: string;
  /** true → chỉ hiện mũi tên + số, không bọc nền (dùng trong ô bảng). */
  bare?: boolean;
}

/**
 * Chỉ báo % thay đổi (AC-3.7 / AC-4.2): dương = xanh mũi tên lên, âm = đỏ mũi tên xuống,
 * bằng 0 = xám dấu "–". Null (không có kỳ trước) hiển thị "—" trung tính.
 */
export function ChangeBadge({ value, className, bare }: ChangeBadgeProps) {
  if (value === null) {
    return <span className={cn('text-xs text-slate-400', className)}>—</span>;
  }

  const isZero = value === 0;
  const isUp = value > 0;
  const Icon = isZero ? Minus : isUp ? ArrowUpRight : ArrowDownRight;
  const tone = isZero
    ? 'text-slate-500'
    : isUp
      ? 'text-emerald-600'
      : 'text-red-500';
  const label = `${isUp ? '+' : ''}${value}%`;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-semibold',
        tone,
        !bare && 'rounded-full px-2 py-0.5',
        !bare && (isZero ? 'bg-slate-100' : isUp ? 'bg-emerald-50' : 'bg-red-50'),
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}
