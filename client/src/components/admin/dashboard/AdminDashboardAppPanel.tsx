import {
  CalendarDays,
  FileText,
  Headphones,
  ListChecks,
  MessageSquare,
  NotebookText,
  type LucideIcon,
} from 'lucide-react';
import { useAdminModal } from '@/components/admin/models/AdminModalContext';
import { cn } from '@/lib/cn';

interface AppItem {
  accent: string;
  icon: LucideIcon;
  label: string;
  status: string;
}

const items: AppItem[] = [
  {
    accent: 'bg-blue-50 text-blue-600',
    icon: CalendarDays,
    label: 'Calendar',
    status: 'Live schedule',
  },
  {
    accent: 'bg-emerald-50 text-emerald-600',
    icon: ListChecks,
    label: 'Tasks',
    status: '12 open',
  },
  {
    accent: 'bg-amber-50 text-amber-600',
    icon: MessageSquare,
    label: 'Messages',
    status: '4 unread',
  },
  {
    accent: 'bg-slate-100 text-slate-700',
    icon: FileText,
    label: 'File Manager',
    status: '32 files',
  },
  {
    accent: 'bg-purple-50 text-purple-600',
    icon: NotebookText,
    label: 'Notes',
    status: '8 drafts',
  },
  {
    accent: 'bg-rose-50 text-rose-600',
    icon: Headphones,
    label: 'Support',
    status: 'Online',
  },
];

export function AdminDashboardAppPanel() {
  const {
    openCalendar,
    openFileManager,
    openMessages,
    openNotes,
    openSupport,
    openTasks,
  } = useAdminModal();

  return (
    <section className="rounded-[24px] border border-outline-variant/40 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-950">Apps</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Admin shortcuts
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
          6 tools
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
        {items.map(item => {
          const Icon = item.icon;
          const isCalendar = item.label === 'Calendar';
          const isFileManager = item.label === 'File Manager';
          const isMessages = item.label === 'Messages';
          const isNotes = item.label === 'Notes';
          const isSupport = item.label === 'Support';
          const isTasks = item.label === 'Tasks';

          return (
            <button
              className="group flex w-full items-center gap-3 rounded-2xl border border-transparent bg-surface-container-low px-3 py-3 text-left transition-all hover:border-blue-100 hover:bg-blue-50/60 hover:shadow-sm"
              key={item.label}
              onClick={
                isCalendar
                  ? openCalendar
                  : isFileManager
                    ? openFileManager
                  : isMessages
                    ? openMessages
                    : isNotes
                      ? openNotes
                    : isSupport
                      ? openSupport
                    : isTasks
                      ? openTasks
                      : undefined
              }
              type="button"
            >
              <span
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-2xl',
                  item.accent
                )}
              >
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-slate-950">
                  {item.label}
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {item.status}
                </span>
              </span>
              <span className="text-sm font-bold text-slate-300 transition-colors group-hover:text-blue-600">
                →
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
