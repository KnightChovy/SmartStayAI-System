import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Sparkles, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { useHousekeepingTasks, useCompleteHousekeeping } from '@/hooks/staff';
import { useStaffHotelStore } from '@/stores/staffHotelStore';
import { TaskStatusBadge } from '@/components/staff/StatusBadge';
import type { HousekeepingTask, HousekeepingTaskStatus } from '@/types/staff.types';
import { formatDate } from '@/utils/formatDate';
import { errorMessage } from '@/utils/errorMessage';

type Filter = HousekeepingTaskStatus | 'all';
type SortKey = 'oldest' | 'room';

const FILTERS: { value: Filter; label: string; empty: string }[] = [
  { value: 'all', label: 'All', empty: 'No housekeeping tasks yet.' },
  {
    value: 'pending',
    label: 'To clean',
    empty: 'Nothing waiting to be cleaned — every room is done.',
  },
  { value: 'in_progress', label: 'Cleaning', empty: 'No room is being cleaned right now.' },
  { value: 'done', label: 'Cleaned', empty: 'No rooms have been cleaned yet.' },
];

const SORTS: { value: SortKey; label: string }[] = [
  { value: 'oldest', label: 'Oldest first' },
  { value: 'room', label: 'Room number' },
];

/** Natural order so Room 2 comes before Room 10 (plain string sort puts 10 first). */
const naturalCompare = (a: string, b: string) =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

export default function HousekeepingPage() {
  const hotel = useStaffHotelStore(state => state.hotel);
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<SortKey>('oldest');
  // Fetch every task and filter here, so each tab can show its own count.
  const { data, isLoading, isError, error } = useHousekeepingTasks(hotel?.id);
  const complete = useCompleteHousekeeping(hotel?.id);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);

  const allTasks = useMemo(() => data ?? [], [data]);

  const counts = useMemo(
    () => ({
      all: allTasks.length,
      pending: allTasks.filter(t => t.status === 'pending').length,
      in_progress: allTasks.filter(t => t.status === 'in_progress').length,
      done: allTasks.filter(t => t.status === 'done').length,
    }),
    [allTasks]
  );

  const tasks = useMemo(() => {
    const list = filter === 'all' ? allTasks : allTasks.filter(t => t.status === filter);
    return [...list].sort((a, b) =>
      sort === 'room'
        ? naturalCompare(a.room.roomNumber, b.room.roomNumber)
        : a.createdAt.localeCompare(b.createdAt)
    );
  }, [allTasks, filter, sort]);

  // Group by floor so a housekeeper can work one floor at a time.
  const byFloor = useMemo(() => {
    const groups = new Map<number | null, HousekeepingTask[]>();
    for (const task of tasks) {
      const list = groups.get(task.room.floor);
      if (list) list.push(task);
      else groups.set(task.room.floor, [task]);
    }
    return [...groups.entries()].sort(([a], [b]) => (a ?? 0) - (b ?? 0));
  }, [tasks]);

  const activeEmpty = FILTERS.find(f => f.value === filter)?.empty ?? 'No tasks.';

  const markComplete = async (task: HousekeepingTask) => {
    setBusyTaskId(task.id);
    try {
      await complete.mutateAsync({ taskId: task.id });
      toast.success(`Room ${task.room.roomNumber} marked clean and available.`);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not complete the task.'));
    } finally {
      setBusyTaskId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Housekeeping</h1>
        <p className="text-sm text-slate-500">
          Housekeeping tasks are created automatically when guests check out.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                filter === f.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
              )}
            >
              {f.label}
              <span
                className={cn(
                  'rounded-full px-1.5 text-[11px] font-semibold tabular-nums',
                  filter === f.value ? 'bg-white/20' : 'bg-slate-100 text-slate-500'
                )}
              >
                {counts[f.value]}
              </span>
            </button>
          ))}
        </div>

        <label className="flex items-center gap-1.5 text-xs text-slate-500">
          Sort
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortKey)}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:border-slate-400 focus:outline-none"
          >
            {SORTS.map(s => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isError && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">Could not load housekeeping tasks.</p>
            <p className="text-amber-700">{errorMessage(error, 'Server error.')}</p>
          </div>
        </div>
      )}

      {isLoading && <TasksSkeleton />}

      {!isLoading && !isError && tasks.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-12 text-center">
          <Sparkles className="mx-auto mb-2 size-6 text-slate-300" />
          <p className="text-sm text-slate-500">{activeEmpty}</p>
        </div>
      )}

      {!isLoading &&
        !isError &&
        byFloor.map(([floor, floorTasks]) => (
          <section key={floor ?? 'unknown'} className="space-y-2.5">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-700">
                {floor == null ? 'Floor not set' : `Floor ${floor}`}
              </h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                {floorTasks.length} room{floorTasks.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {floorTasks.map(task => (
                <div key={task.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                        <Sparkles className="size-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          Room {task.room.roomNumber}
                        </p>
                        <p className="text-xs text-slate-500">
                          {task.room.floor == null ? 'Floor —' : `Floor ${task.room.floor}`}
                        </p>
                      </div>
                    </div>
                    <TaskStatusBadge status={task.status} />
                  </div>
                  <p className="mb-3 text-xs text-slate-400">
                    Created: {formatDate(task.createdAt)}
                  </p>
                  {task.status !== 'done' ? (
                    <Button
                      size="sm"
                      className="w-full"
                      disabled={busyTaskId === task.id}
                      onClick={() => markComplete(task)}
                    >
                      {busyTaskId === task.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Check className="size-4" />
                      )}
                      Mark complete
                    </Button>
                  ) : (
                    <p className="text-center text-xs text-emerald-600">
                      Cleaned {formatDate(task.completedAt)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}

function TasksSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-36 animate-pulse rounded-xl border border-slate-200 bg-slate-100"
        />
      ))}
    </div>
  );
}
