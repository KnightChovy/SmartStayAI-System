import { Bell, HelpCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { AdminNavbarProps } from '@/types/admin.types';

export function AdminNavbar({ searchPlaceholder }: AdminNavbarProps) {
  return (
    <header className="border-b border-outline-variant/40 bg-surface px-5 py-2.5 lg:px-6 lg:py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="hidden text-xs font-medium text-slate-700 xl:block">
          October 26, 2024 | 10:30 AM
        </p>

        <div className="relative w-full max-w-[500px]">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-8 rounded-sm bg-surface-container-low pl-8 text-xs"
            placeholder={searchPlaceholder}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            className="inline-flex size-8 items-center justify-center rounded-full border border-outline-variant/40"
            type="button"
          >
            <Bell className="size-3.5" />
          </button>
          <button
            className="inline-flex size-8 items-center justify-center rounded-full border border-outline-variant/40"
            type="button"
          >
            <HelpCircle className="size-3.5" />
          </button>
          <div className="h-6 w-px bg-outline-variant/40" />
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-surface-container" />
            <p className="text-sm font-semibold">Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}
