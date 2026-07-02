import { useEffect } from 'react';
import { CalendarClock, Server, ShieldAlert, Wrench, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDateLong, formatTime } from '@/utils/formatDate';

interface AdminMaintenanceModalProps {
  currentTime: Date;
  onClose: () => void;
}

export function AdminMaintenanceModal({
  currentTime,
  onClose,
}: AdminMaintenanceModalProps) {
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
        aria-label="Close maintenance"
        className="absolute inset-0 h-full w-full"
        onClick={onClose}
        type="button"
      />

      <section className="relative z-10 w-full max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-outline-variant/40 px-4 py-4 sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <Wrench className="size-5 text-amber-600" />
              <h2 className="text-xl font-bold text-slate-950">
                Schedule Maintenance
              </h2>
            </div>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              Current time {formatDateLong(currentTime)} |{' '}
              {formatTime(currentTime)}
            </p>
          </div>
          <button
            aria-label="Close maintenance"
            className="inline-flex size-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[1fr_220px]">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="maintenance-title">Maintenance title</Label>
              <Input
                id="maintenance-title"
                defaultValue="Admin portal patch window"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="maintenance-date">Date</Label>
                <Input
                  id="maintenance-date"
                  defaultValue={formatDateLong(currentTime)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maintenance-time">Start time</Label>
                <Input
                  id="maintenance-time"
                  defaultValue={formatTime(currentTime)}
                />
              </div>
            </div>
            <textarea
              className="min-h-28 w-full resize-none rounded-[22px] border border-outline-variant/50 bg-white p-4 text-sm outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20"
              placeholder="Maintenance notes and affected services..."
            />
            <button
              className="inline-flex h-11 w-full items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-white hover:bg-amber-600"
              type="button"
            >
              Schedule Window
            </button>
          </div>

          <aside className="space-y-3">
            <div className="rounded-[22px] bg-slate-50 p-4">
              <Server className="size-5 text-slate-700" />
              <p className="mt-3 text-sm font-bold text-slate-950">Services</p>
              <p className="mt-1 text-xs text-muted-foreground">
                API, admin dashboard, notification jobs
              </p>
            </div>
            <div className="rounded-[22px] bg-amber-50 p-4">
              <CalendarClock className="size-5 text-amber-600" />
              <p className="mt-3 text-sm font-bold text-slate-950">
                Realtime Window
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Starts from current dashboard time.
              </p>
            </div>
            <div className="rounded-[22px] bg-red-50 p-4">
              <ShieldAlert className="size-5 text-red-600" />
              <p className="mt-3 text-sm font-bold text-slate-950">
                Notify Admins
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Send alerts before and after maintenance.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
