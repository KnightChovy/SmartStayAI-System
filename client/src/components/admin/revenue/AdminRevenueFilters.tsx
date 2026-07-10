import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import type { AdminRevenueParams } from '@/types/admin.types';

interface AdminRevenueFiltersProps {
  from: string;
  to: string;
  groupBy: NonNullable<AdminRevenueParams['groupBy']>;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onGroupByChange: (value: NonNullable<AdminRevenueParams['groupBy']>) => void;
  onExport: () => void;
  isExporting?: boolean;
}

export function AdminRevenueFilters({
  from,
  to,
  groupBy,
  onFromChange,
  onToChange,
  onGroupByChange,
  onExport,
  isExporting,
}: AdminRevenueFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-2xl border bg-white p-4 sm:p-5">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-muted-foreground">From</span>
        <input
          className="h-9 rounded-lg border px-2 text-sm outline-none focus:border-black"
          max={to || undefined}
          onChange={e => onFromChange(e.target.value)}
          type="date"
          value={from}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-muted-foreground">To</span>
        <input
          className="h-9 rounded-lg border px-2 text-sm outline-none focus:border-black"
          min={from || undefined}
          onChange={e => onToChange(e.target.value)}
          type="date"
          value={to}
        />
      </label>

      <div className="flex items-center gap-1 rounded-full border p-1">
        {(['day', 'month'] as const).map(option => (
          <button
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
              groupBy === option
                ? 'bg-black text-white'
                : 'text-muted-foreground hover:bg-slate-100'
            )}
            key={option}
            onClick={() => onGroupByChange(option)}
            type="button"
          >
            {option === 'day' ? 'Daily' : 'Monthly'}
          </button>
        ))}
      </div>

      <Button
        className="ml-auto h-9 rounded-full bg-black px-5 text-white"
        disabled={isExporting}
        onClick={onExport}
        type="button"
      >
        {isExporting ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <Download className="mr-2 size-4" />
        )}
        Export CSV
      </Button>
    </div>
  );
}
