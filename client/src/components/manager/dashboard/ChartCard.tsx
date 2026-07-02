import type { ReactNode } from 'react';
import { ChartCardSkeleton, SectionEmpty, SectionError } from './states';

interface ChartCardProps {
  title: string;
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  onRetry: () => void;
  height?: string;
  children: ReactNode;
}

/** Khung card cho chart: tiêu đề + tự xử lý loading/error/empty (AC-1/AC-4). */
export function ChartCard({
  title,
  isLoading,
  isError,
  isEmpty,
  onRetry,
  height = 'h-64',
  children,
}: ChartCardProps) {
  if (isLoading) return <ChartCardSkeleton height={height} />;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="font-semibold text-slate-900 mb-6">{title}</h2>
      {isError ? (
        <SectionError onRetry={onRetry} />
      ) : isEmpty ? (
        <SectionEmpty title="No data for the selected period" />
      ) : (
        children
      )}
    </div>
  );
}
