import { Star } from 'lucide-react';
import { cn } from '@/lib/cn';

interface StarRatingProps {
  /** Số sao hiện tại (0–5). */
  value?: number | null;
  /** Tổng số sao tối đa. */
  max?: number;
  size?: number;
  className?: string;
  /** Bật chế độ nhập (click chọn sao). */
  editable?: boolean;
  onChange?: (value: number) => void;
}

/** Hiển thị / nhập số sao. Mặc định chỉ đọc. */
export default function StarRating({
  value = 0,
  max = 5,
  size = 16,
  className,
  editable = false,
  onChange,
}: StarRatingProps) {
  const rating = value ?? 0;

  return (
    <div className={cn('inline-flex items-center gap-0.5', className)}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < Math.round(rating);
        const Wrapper = editable ? 'button' : 'span';
        return (
          <Wrapper
            key={i}
            type={editable ? 'button' : undefined}
            onClick={editable ? () => onChange?.(i + 1) : undefined}
            className={cn(editable && 'cursor-pointer transition-transform hover:scale-110')}
            aria-label={editable ? `${i + 1} stars` : undefined}
          >
            <Star
              style={{ width: size, height: size }}
              className={cn(
                filled ? 'fill-premium-gold text-premium-gold' : 'fill-transparent text-outline-variant'
              )}
            />
          </Wrapper>
        );
      })}
    </div>
  );
}
