import { useEffect, useState } from 'react';
import { AlertTriangle, CalendarClock, Trash2, Wrench, X } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAdminMaintenanceReminder } from '@/hooks/admin-tools';
import { formatDateLong, formatTime, toDateInputValue } from '@/utils/formatDate';

interface AdminMaintenanceModalProps {
  currentTime: Date;
  onClose: () => void;
}

export function AdminMaintenanceModal({ currentTime, onClose }: AdminMaintenanceModalProps) {
  const { reminder, saveReminder, clearReminder } = useAdminMaintenanceReminder();
  const [title, setTitle] = useState(reminder?.title ?? 'Admin portal patch window');
  const [date, setDate] = useState(reminder?.date ?? toDateInputValue(currentTime));
  const [time, setTime] = useState(reminder?.time ?? '09:00');
  const [notes, setNotes] = useState(reminder?.notes ?? '');

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSave = () => {
    saveReminder(title, date, time, notes);
    toast.success('Maintenance reminder saved on this device');
  };

  const handleClear = () => {
    clearReminder();
    toast.success('Maintenance reminder cleared');
  };

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
              <h2 className="text-xl font-bold text-slate-950">Schedule Maintenance</h2>
            </div>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              Current time {formatDateLong(currentTime)} | {formatTime(currentTime)}
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
            <div className="flex items-start gap-2 rounded-2xl bg-amber-50 p-3 text-xs text-amber-700">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              This is a personal reminder saved on this device only. It does not actually put the
              platform into maintenance mode for real users — there is no backend support for
              that yet.
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenance-title">Maintenance title</Label>
              <Input
                id="maintenance-title"
                onChange={event => setTitle(event.target.value)}
                value={title}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="maintenance-date">Date</Label>
                <Input
                  id="maintenance-date"
                  onChange={event => setDate(event.target.value)}
                  type="date"
                  value={date}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maintenance-time">Start time</Label>
                <Input
                  id="maintenance-time"
                  onChange={event => setTime(event.target.value)}
                  type="time"
                  value={time}
                />
              </div>
            </div>
            <textarea
              className="min-h-28 w-full resize-none rounded-[22px] border border-outline-variant/50 bg-white p-4 text-sm outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20"
              onChange={event => setNotes(event.target.value)}
              placeholder="Maintenance notes and affected services..."
              value={notes}
            />
            <div className="flex gap-2">
              <button
                className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!title.trim()}
                onClick={handleSave}
                type="button"
              >
                Save Reminder
              </button>
              {reminder && (
                <button
                  aria-label="Clear reminder"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-outline-variant/50 text-slate-500 hover:bg-slate-50 hover:text-red-600"
                  onClick={handleClear}
                  type="button"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          </div>

          <aside className="space-y-3">
            <div className="rounded-[22px] bg-slate-50 p-4">
              <CalendarClock className="size-5 text-slate-700" />
              <p className="mt-3 text-sm font-bold text-slate-950">
                {reminder ? 'Saved Reminder' : 'No Reminder Saved'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {reminder
                  ? `${reminder.title} — ${reminder.date} ${reminder.time}`
                  : 'Fill out the form and save to keep a reminder here.'}
              </p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
