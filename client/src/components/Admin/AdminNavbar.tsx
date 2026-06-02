import { Bell, CalendarDays, HelpCircle, Menu, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatDate, formatTime } from '@/utils/formatDate';

interface AdminNavbarProps {
  currentTime: Date;
  onMenuClick?: () => void;
  onOpenCalendar: () => void;
  onOpenMessages: () => void;
  onOpenSupport: () => void;
  searchPlaceholder: string;
}

export function AdminNavbar({
  currentTime,
  onMenuClick,
  onOpenCalendar,
  onOpenMessages,
  onOpenSupport,
  searchPlaceholder,
}: AdminNavbarProps) {
  const formattedDate = formatDate(currentTime);
  const formattedTime = formatTime(currentTime);

  return (
    <header className="border-b border-outline-variant/40 bg-surface px-3 py-2.5 sm:px-5 lg:px-6 lg:py-3">
      <div className="flex items-center justify-between gap-3">
        <button
          aria-label="Open admin sidebar"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-outline-variant/40 text-slate-700 lg:hidden"
          onClick={onMenuClick}
          type="button"
        >
          <Menu className="size-4" />
        </button>

        <button
          className="hidden rounded-full px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-surface-container-low xl:block"
          onClick={onOpenCalendar}
          type="button"
        >
          {formattedDate} | {formattedTime}
        </button>

        <div className="relative min-w-0 flex-1 lg:max-w-125">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-8 rounded-sm bg-surface-container-low pl-8 text-xs"
            placeholder={searchPlaceholder}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            aria-label="Open calendar"
            className="inline-flex size-8 items-center justify-center rounded-full border border-outline-variant/40"
            onClick={onOpenCalendar}
            type="button"
          >
            <CalendarDays className="size-3.5" />
          </button>
          <button
            aria-label="Open messages"
            className="inline-flex size-8 items-center justify-center rounded-full border border-outline-variant/40"
            onClick={onOpenMessages}
            type="button"
          >
            <Bell className="size-3.5" />
          </button>
          <button
            aria-label="Open support"
            className="inline-flex size-8 items-center justify-center rounded-full border border-outline-variant/40"
            onClick={onOpenSupport}
            type="button"
          >
            <HelpCircle className="size-3.5" />
          </button>
          <div className="hidden h-6 w-px bg-outline-variant/40 sm:block" />
          <div className="hidden items-center gap-2 sm:flex">
            <div className="size-8 rounded-full bg-surface-container" />
            <p className="text-sm font-semibold">Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}
