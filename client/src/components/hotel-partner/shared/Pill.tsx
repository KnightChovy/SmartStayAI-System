import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type PillTone = 'emerald' | 'slate' | 'amber' | 'blue' | 'violet' | 'red';

const TONE_CLASS: Record<PillTone, string> = {
  emerald: 'bg-emerald-100 text-emerald-700',
  slate: 'bg-slate-100 text-slate-600',
  amber: 'bg-amber-100 text-amber-700',
  blue: 'bg-blue-100 text-blue-700',
  violet: 'bg-violet-100 text-violet-700',
  red: 'bg-red-100 text-red-700',
};

interface PillProps {
  children: ReactNode;
  /** Chọn nhanh bằng tone, hoặc truyền thẳng `className` cho màu tùy biến. */
  tone?: PillTone;
  className?: string;
}

/** Badge tròn nhỏ dùng cho status / scope trong bảng. */
export function Pill({ children, tone, className }: PillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
        tone && TONE_CLASS[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
