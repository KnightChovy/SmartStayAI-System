import { useEffect } from 'react';
import { Edit3, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate, formatTime } from '@/utils/formatDate';

interface AdminTasksModalProps {
  currentTime: Date;
  onClose: () => void;
}

const tasks = [
  {
    assignee: 'Sarah H.',
    due: 'Now + 1',
    priority: 'High',
    status: 'In progress',
    task: 'Iterate Mobile Profile Screen',
  },
  {
    assignee: 'Alex M.',
    due: 'Oct 28',
    priority: 'Mid',
    status: 'Review',
    task: 'Finalize Color System Guide',
  },
  {
    assignee: 'Donovan',
    due: 'Oct 30',
    priority: 'Mid',
    status: 'Done',
    task: 'Animate Header Interaction',
  },
  {
    assignee: 'Donovan',
    due: 'Oct 31',
    priority: 'Low',
    status: 'Done',
    task: 'Design Story Profile Task',
  },
];

function getStatusClass(status: string) {
  if (status === 'In progress') {
    return 'bg-red-50 text-red-600';
  }

  if (status === 'Review') {
    return 'bg-amber-50 text-amber-600';
  }

  return 'bg-emerald-50 text-emerald-600';
}

function getPriorityClass(priority: string) {
  if (priority === 'High') {
    return 'bg-red-500 text-white';
  }

  if (priority === 'Mid') {
    return 'bg-amber-400 text-white';
  }

  return 'bg-blue-100 text-blue-700';
}

export function AdminTasksModal({ currentTime, onClose }: AdminTasksModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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
              <h2 className="text-lg font-bold text-slate-950">
                Design Tasks Overview
              </h2>
            </div>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              Mobile Project / Layout Design / Tasks - {formatDate(currentTime)} |{' '}
              {formatTime(currentTime)}
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

        <div className="overflow-x-auto">
          <table className="w-full min-w-170 text-left">
            <thead>
              <tr className="border-b border-outline-variant/40 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Task</th>
                <th className="px-4 py-3">Assigned</th>
                <th className="px-5 py-3">Due</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <tr
                  className="border-b border-outline-variant/30 last:border-b-0"
                  key={task.task}
                >
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase',
                        getStatusClass(task.status)
                      )}
                    >
                      {task.status}
                    </span>
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
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-950">
                        {task.task}
                      </span>
                      <Edit3 className="size-3.5 text-slate-500" />
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                        {task.assignee.charAt(0)}
                      </span>
                      <span className="text-xs font-semibold text-slate-700">
                        {task.assignee}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs font-semibold text-blue-600">
                    {task.due === 'Now + 1' ? formatTime(currentTime) : task.due}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
