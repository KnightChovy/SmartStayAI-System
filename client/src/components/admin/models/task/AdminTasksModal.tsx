import { useEffect, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAdminTasks } from '@/hooks/admin-tools';
import { cn } from '@/lib/cn';
import type { AdminTaskPriority } from '@/types/admin-tools.types';
import { formatDateLong, formatTime } from '@/utils/formatDate';

interface AdminTasksModalProps {
  currentTime: Date;
  onClose: () => void;
}

function getStatusClass(status: string) {
  if (status === 'In progress') return 'bg-red-50 text-red-600';
  if (status === 'To do') return 'bg-slate-100 text-slate-600';
  return 'bg-emerald-50 text-emerald-600';
}

function getPriorityClass(priority: string) {
  if (priority === 'High') return 'bg-red-500 text-white';
  if (priority === 'Mid') return 'bg-amber-400 text-white';
  return 'bg-blue-100 text-blue-700';
}

export function AdminTasksModal({
  currentTime,
  onClose,
}: AdminTasksModalProps) {
  const { tasks, openCount, addTask, cycleStatus, removeTask } =
    useAdminTasks();
  const [taskName, setTaskName] = useState('');
  const [priority, setPriority] = useState<AdminTaskPriority>('Mid');
  const [due, setDue] = useState('');

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleAdd = () => {
    if (!taskName.trim()) return;
    addTask(taskName, priority, due);
    setTaskName('');
    setDue('');
  };

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
    >
      <button
        aria-label="Close tasks"
        className="absolute inset-0 h-full w-full"
        onClick={onClose}
        type="button"
      />

      <section className="relative z-10 w-full max-w-3xl overflow-hidden rounded-[22px] bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-outline-variant/40 px-4 py-4 sm:px-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-red-500" />
              <h2 className="text-lg font-bold text-slate-950">Task Board</h2>
            </div>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              {openCount} open · {tasks.length} total —{' '}
              {formatDateLong(currentTime)} | {formatTime(currentTime)}
            </p>
          </div>
          <button
            aria-label="Close tasks"
            className="inline-flex size-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="flex flex-wrap items-end gap-2 border-b border-outline-variant/30 px-4 py-3 sm:px-5">
          <div className="min-w-40 flex-1 space-y-1">
            <label
              className="text-[11px] font-bold uppercase text-slate-500"
              htmlFor="task-name"
            >
              New task
            </label>
            <Input
              id="task-name"
              onChange={event => setTaskName(event.target.value)}
              placeholder="e.g. Review hotel verification queue"
              value={taskName}
            />
          </div>
          <div className="space-y-1">
            <label
              className="text-[11px] font-bold uppercase text-slate-500"
              htmlFor="task-priority"
            >
              Priority
            </label>
            <select
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
              id="task-priority"
              onChange={event =>
                setPriority(event.target.value as AdminTaskPriority)
              }
              value={priority}
            >
              <option value="High">High</option>
              <option value="Mid">Mid</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div className="space-y-1">
            <label
              className="text-[11px] font-bold uppercase text-slate-500"
              htmlFor="task-due"
            >
              Due
            </label>
            <Input
              id="task-due"
              onChange={event => setDue(event.target.value)}
              type="date"
              value={due}
            />
          </div>
          <button
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-slate-950 px-4 text-xs font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!taskName.trim()}
            onClick={handleAdd}
            type="button"
          >
            <Plus className="size-3.5" />
            Add
          </button>
        </div>

        <div className="m-4 overflow-hidden rounded-2xl border border-slate-200 sm:m-5">
          <div className="overflow-x-auto">
            {tasks.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No tasks yet — add one above.
              </p>
            ) : (
              <table className="w-full min-w-170 text-left">
                <thead className="bg-slate-50/90">
                  <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                    <th className="px-5 py-3">Status</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Task</th>
                    <th className="px-5 py-3">Due</th>
                    <th className="py-3 pr-5 text-right"> </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tasks.map(task => (
                    <tr
                      className="transition-colors duration-200 hover:bg-indigo-50/35"
                      key={task.id}
                    >
                      <td className="px-5 py-4">
                        <button
                          className={cn(
                            'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase',
                            getStatusClass(task.status)
                          )}
                          onClick={() => cycleStatus(task.id)}
                          type="button"
                        >
                          {task.status}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase',
                            getPriorityClass(task.priority)
                          )}
                        >
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-bold text-slate-950">
                          {task.task}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs font-semibold text-blue-600">
                        {task.due || '—'}
                      </td>
                      <td className="py-4 pr-5 text-right">
                        <button
                          aria-label={`Delete ${task.task}`}
                          className="inline-flex size-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-red-600"
                          onClick={() => removeTask(task.id)}
                          type="button"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
