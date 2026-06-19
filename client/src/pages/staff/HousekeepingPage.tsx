import { useState } from 'react';
import { Sparkles, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { useHousekeepingTasks, useCompleteHousekeeping } from '@/hooks/staff';
import { useStaffHotelStore } from '@/stores/staffHotelStore';
import { TaskStatusBadge } from '@/components/staff/StatusBadge';
import type { HousekeepingTaskStatus } from '@/types/staff.types';
import { formatDateShort } from '@/utils/formatDate';
import { errorMessage } from '@/utils/errorMessage';

const FILTERS: { value: HousekeepingTaskStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'To clean' },
  { value: 'in_progress', label: 'Cleaning' },
  { value: 'done', label: 'Cleaned' },
];

export default function HousekeepingPage() {
  const hotel = useStaffHotelStore(state => state.hotel);
  const [filter, setFilter] = useState<HousekeepingTaskStatus | 'all'>('all');
  const { data, isLoading, isError, error } = useHousekeepingTasks(
    hotel?.id,
    filter === 'all' ? undefined : filter
  );
  const complete = useCompleteHousekeeping(hotel?.id);
  const [actionError, setActionError] = useState<string | null>(null);

  const tasks = data ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Housekeeping</h1>
        <p className="text-sm text-slate-500">Housekeeping tasks are created automatically when guests check out.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              filter === f.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {actionError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {actionError}
        </div>
      )}

      {isError && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">Could not load housekeeping tasks.</p>
            <p className="text-amber-700">{errorMessage(error, 'Server error.')}</p>
          </div>
        </div>
      )}

      {isLoading && <p className="text-sm text-slate-500">Loading…</p>}

      {!isLoading && !isError && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tasks.length === 0 && (
            <p className="col-span-full py-10 text-center text-sm text-slate-400">
              No housekeeping tasks.
            </p>
          )}
          {tasks.map(task => (
            <div key={task.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                    <Sparkles className="size-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Room {task.room.roomNumber}</p>
                    <p className="text-xs text-slate-500">Floor {task.room.floor}</p>
                  </div>
                </div>
                <TaskStatusBadge status={task.status} />
              </div>
              <p className="mb-3 text-xs text-slate-400">Created: {formatDateShort(task.createdAt)}</p>
              {task.status !== 'done' ? (
                <Button
                  size="sm"
                  className="w-full"
                  disabled={complete.isPending}
                  onClick={async () => {
                    setActionError(null);
                    try {
                      await complete.mutateAsync({ taskId: task.id });
                    } catch (err) {
                      setActionError(errorMessage(err, 'Could not complete the task.'));
                    }
                  }}
                >
                  <Check className="size-4" /> Mark complete
                </Button>
              ) : (
                <p className="text-center text-xs text-emerald-600">
                  Cleaned {formatDateShort(task.completedAt)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
