import {
  Bell,
  CalendarDays,
  FileText,
  Headphones,
  ListChecks,
  NotebookText,
} from 'lucide-react';
import { useAdminModal } from '@/components/admin/models/AdminModalContext';
import { useAdminAuditLogs } from '@/hooks/admin';
import {
  useAdminActivitySeen,
  useAdminCalendarEvents,
  useAdminFiles,
  useAdminNotes,
  useAdminTasks,
} from '@/hooks/admin-tools';
import { cn } from '@/lib/cn';
import { toDateInputValue } from '@/utils/formatDate';

export function AdminDashboardAppPanel() {
  const {
    openCalendar,
    openFileManager,
    openMessages,
    openNotes,
    openSupport,
    openTasks,
  } = useAdminModal();

  const { events } = useAdminCalendarEvents();
  const { openCount: openTaskCount, tasks } = useAdminTasks();
  const { notes } = useAdminNotes();
  const { files } = useAdminFiles();
  const { lastSeenAt } = useAdminActivitySeen();
  const { data: activityData } = useAdminAuditLogs({ limit: 30 });

  const todayKey = toDateInputValue(new Date());
  const upcomingEvents = events.filter(event => event.date >= todayKey).length;
  const unreadActivity = (activityData?.results ?? []).filter(
    log => !lastSeenAt || log.createdAt > lastSeenAt
  ).length;

  const items = [
    {
      accent: 'bg-blue-50 text-blue-600',
      icon: CalendarDays,
      label: 'Calendar',
      status: upcomingEvents > 0 ? `${upcomingEvents} upcoming` : 'No events',
      onClick: openCalendar,
    },
    {
      accent: 'bg-emerald-50 text-emerald-600',
      icon: ListChecks,
      label: 'Tasks',
      status:
        tasks.length === 0
          ? 'No tasks'
          : openTaskCount > 0
            ? `${openTaskCount} open`
            : 'All done',
      onClick: openTasks,
    },
    {
      accent: 'bg-amber-50 text-amber-600',
      icon: Bell,
      label: 'Activity',
      status: unreadActivity > 0 ? `${unreadActivity} new` : 'Up to date',
      onClick: openMessages,
    },
    {
      accent: 'bg-slate-100 text-slate-700',
      icon: FileText,
      label: 'File Manager',
      status: files.length > 0 ? `${files.length} file${files.length === 1 ? '' : 's'}` : 'No files',
      onClick: openFileManager,
    },
    {
      accent: 'bg-purple-50 text-purple-600',
      icon: NotebookText,
      label: 'Notes',
      status: notes.length > 0 ? `${notes.length} note${notes.length === 1 ? '' : 's'}` : 'No notes',
      onClick: openNotes,
    },
    {
      accent: 'bg-rose-50 text-rose-600',
      icon: Headphones,
      label: 'Support',
      status: 'Contact',
      onClick: openSupport,
    },
  ];

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
          {items.length} tools
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
        {items.map(item => {
          const Icon = item.icon;

          return (
            <button
              className="group flex w-full items-center gap-3 rounded-2xl border border-transparent bg-surface-container-low px-3 py-3 text-left transition-all hover:border-blue-100 hover:bg-blue-50/60 hover:shadow-sm"
              key={item.label}
              onClick={item.onClick}
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
