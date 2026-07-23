import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { SEGMENT_CLASS } from './segment-styles';

interface SegmentLabelProps {
  icon: LucideIcon;
  children: ReactNode;
}

/** Nhãn của một ô — viết hoa nhỏ, dùng chung cho cả 4 ô để cỡ chữ không lệch nhau. */
export function SegmentLabel({ icon: Icon, children }: SegmentLabelProps) {
  return (
    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      {children}
    </span>
  );
}

interface SearchSegmentProps {
  label: string;
  icon: LucideIcon;
  /** Id của control bên trong — để `<label>` liên kết đúng (a11y). */
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}

/** Ô chứa control tự do (vd ô nhập điểm đến). Ô mở popover dùng thẳng `SEGMENT_CLASS`. */
export function SearchSegment({
  label,
  icon,
  htmlFor,
  className,
  children,
}: SearchSegmentProps) {
  return (
    <div className={cn(SEGMENT_CLASS, className)}>
      <label htmlFor={htmlFor} className="cursor-pointer">
        <SegmentLabel icon={icon}>{label}</SegmentLabel>
      </label>
      {children}
    </div>
  );
}
