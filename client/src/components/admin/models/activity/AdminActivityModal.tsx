import { useEffect, useState } from 'react';
import { Bell, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAdminActivitySeen } from '@/hooks/admin-tools';
import { useAdminAuditLogs } from '@/hooks/admin';
import { errorMessage } from '@/utils/errorMessage';
import { formatDateLong, formatTime } from '@/utils/formatDate';

interface AdminActivityModalProps {
  currentTime: Date;
  onClose: () => void;
}

function formatAction(action: string): string {
  return action
    .split(/[._]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function AdminActivityModal({ currentTime, onClose }: AdminActivityModalProps) {
  const { data, isLoading, isError, error } = useAdminAuditLogs({ limit: 30 });
  const { markSeenNow } = useAdminActivitySeen();
  const [search, setSearch] = useState('');

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    markSeenNow();
    // Đánh dấu "đã xem" ngay khi mở modal — chỉ chạy 1 lần lúc mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logs = data?.results ?? [];
  const filteredLogs = logs.filter(log =>
    `${log.action} ${log.entityType} ${log.user?.fullName ?? ''} ${log.user?.email ?? ''}`
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
    >
      <button
        aria-label="Close recent activity"
        className="absolute inset-0 h-full w-full"
        onClick={onClose}
        type="button"
      />

      <section className="relative z-10 flex h-[min(82vh,640px)] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-outline-variant/40 px-4 py-4 sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <Bell className="size-5 text-blue-600" />
              <h2 className="text-xl font-bold text-slate-950">Recent Activity</h2>
            </div>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              Platform audit log · {formatDateLong(currentTime)} | {formatTime(currentTime)}
            </p>
          </div>
          <button
            aria-label="Close recent activity"
            className="inline-flex size-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="border-b border-outline-variant/40 px-4 py-3 sm:px-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-9 rounded-full bg-slate-50 pl-9 text-xs"
              onChange={event => setSearch(event.target.value)}
              placeholder="Search by action, entity, or admin..."
              value={search}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {isLoading && (
            <p className="text-sm text-muted-foreground">Loading activity...</p>
          )}
          {isError && (
            <p className="text-sm font-medium text-destructive">
              {errorMessage(error, 'Could not load recent activity.')}
            </p>
          )}
          {!isLoading && !isError && filteredLogs.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {logs.length === 0 ? 'No activity recorded yet.' : 'No activity matches your search.'}
            </p>
          )}

          <div className="space-y-2">
            {filteredLogs.map(log => (
              <div
                className="rounded-2xl border border-outline-variant/40 bg-slate-50 p-3"
                key={log.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">
                      {formatAction(log.action)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {log.entityType} · {log.user?.fullName ?? log.user?.email ?? 'System'}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">
                    {formatDateLong(new Date(log.createdAt))}
                    <br />
                    {formatTime(new Date(log.createdAt))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
