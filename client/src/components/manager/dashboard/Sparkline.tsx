import { cn } from '@/lib/cn';

interface SparklineProps {
  data: number[];
  /** Xu hướng dương → xanh, âm → đỏ, phẳng → xám. */
  trend?: 'up' | 'down' | 'flat';
  className?: string;
}

/**
 * Mini sparkline SVG (AC-2) — không phụ thuộc recharts để nhẹ và không nhảy layout trong card.
 * Vẽ polyline chuẩn hoá theo min/max của chính chuỗi.
 */
export function Sparkline({ data, trend = 'up', className }: SparklineProps) {
  const w = 100;
  const h = 32;
  const stroke =
    trend === 'down' ? '#ef4444' : trend === 'flat' ? '#94a3b8' : '#10b981';

  if (data.length < 2) {
    return <div className={cn('h-8', className)} aria-hidden />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const stepX = w / (data.length - 1);
  const points = data
    .map((v, i) => {
      const x = i * stepX;
      const y = h - ((v - min) / span) * (h - 4) - 2; // padding 2px trên/dưới
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={cn('w-full h-8', className)}
      aria-hidden
    >
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
