import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAdminCalendarEvents } from '@/hooks/admin-tools';
import { cn } from '@/lib/cn';
import { formatDateLong, formatTime, toDateInputValue } from '@/utils/formatDate';

interface AdminCalendarModalProps {
  currentTime: Date;
  onClose: () => void;
}

interface CalendarCell {
  date: Date;
  isCurrentMonth: boolean;
}

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function createCalendarCells(monthDate: Date): CalendarCell[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(firstDay);

  startDate.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);

    return {
      date,
      isCurrentMonth: date.getMonth() === month,
    };
  });
}

function isSameDate(firstDate: Date, secondDate: Date): boolean {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

export function AdminCalendarModal({ currentTime, onClose }: AdminCalendarModalProps) {
  const { events, addEvent, removeEvent, eventsOn } = useAdminCalendarEvents();
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(currentTime.getFullYear(), currentTime.getMonth(), 1)
  );
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({
    title: '',
    date: toDateInputValue(currentTime),
    time: '09:00',
    label: 'Event',
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const calendarCells = useMemo(() => createCalendarCells(visibleMonth), [visibleMonth]);
  const monthLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(visibleMonth);

  const handlePreviousMonth = () => {
    setVisibleMonth(month => new Date(month.getFullYear(), month.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setVisibleMonth(month => new Date(month.getFullYear(), month.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setVisibleMonth(new Date(currentTime.getFullYear(), currentTime.getMonth(), 1));
  };

  const handleAddEvent = () => {
    if (!form.title.trim()) return;
    addEvent(form.title, form.date, form.time, form.label);
    setForm(current => ({ ...current, title: '' }));
    setIsAdding(false);
  };

  const todayKey = toDateInputValue(currentTime);
  const todaysEvents = eventsOn(todayKey);
  const filteredEvents = events.filter(event =>
    `${event.title} ${event.label}`.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
    >
      <button
        aria-label="Close calendar"
        className="absolute inset-0 h-full w-full"
        onClick={onClose}
        type="button"
      />

      <section className="relative z-10 grid max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-2xl lg:grid-cols-[1fr_310px]">
        <div className="min-w-0 overflow-y-auto p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CalendarDays className="size-5 text-blue-600" />
                <h2 className="text-xl font-bold text-slate-950">{monthLabel}</h2>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Clock className="size-3.5" />
                {formatDateLong(currentTime)} | {formatTime(currentTime)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="rounded-full border border-outline-variant/50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                onClick={handleToday}
                type="button"
              >
                Today
              </button>
              <button
                aria-label="Previous month"
                className="inline-flex size-8 items-center justify-center rounded-full border border-outline-variant/50 text-slate-700 hover:bg-slate-50"
                onClick={handlePreviousMonth}
                type="button"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                aria-label="Next month"
                className="inline-flex size-8 items-center justify-center rounded-full border border-outline-variant/50 text-slate-700 hover:bg-slate-50"
                onClick={handleNextMonth}
                type="button"
              >
                <ChevronRight className="size-4" />
              </button>
              <button
                aria-label="Close calendar"
                className="inline-flex size-8 items-center justify-center rounded-full border border-outline-variant/50 text-slate-700 hover:bg-slate-50"
                onClick={onClose}
                type="button"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-7 border-t border-l border-outline-variant/40 text-center">
            {weekDays.map(day => (
              <div
                className="border-r border-b border-outline-variant/40 bg-slate-50 py-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground"
                key={day}
              >
                {day}
              </div>
            ))}
            {calendarCells.map(({ date, isCurrentMonth }) => {
              const isToday = isSameDate(date, currentTime);
              const dayEvents = eventsOn(toDateInputValue(date));

              return (
                <div
                  className={cn(
                    'min-h-16 border-r border-b border-outline-variant/40 p-1.5 text-left sm:min-h-20',
                    !isCurrentMonth && 'bg-slate-50/70 text-slate-300',
                    isToday && 'bg-blue-50'
                  )}
                  key={date.toISOString()}
                >
                  <span
                    className={cn(
                      'inline-flex size-7 items-center justify-center rounded-full text-xs font-bold',
                      isCurrentMonth ? 'text-slate-900' : 'text-slate-300',
                      isToday && 'bg-blue-600 text-white'
                    )}
                  >
                    {date.getDate()}
                  </span>
                  {isToday ? (
                    <div className="mt-2 rounded-full bg-blue-600 px-2 py-1 text-[10px] font-bold text-white">
                      Today
                    </div>
                  ) : dayEvents.length > 0 ? (
                    <div className="mt-2 flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-blue-500" />
                      <span className="text-[10px] font-semibold text-blue-600">
                        {dayEvents.length}
                      </span>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <aside className="overflow-y-auto border-t border-outline-variant/40 bg-slate-50 p-4 sm:p-6 lg:border-t-0 lg:border-l">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-9 rounded-full bg-white pl-9 text-xs"
              onChange={event => setSearch(event.target.value)}
              placeholder="Search for events"
              value={search}
            />
          </div>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {search ? 'Matching Events' : "Today's Schedule"}
            </p>
            {!search && (
              <h3 className="mt-1 text-2xl font-bold text-slate-950">
                {formatTime(currentTime)}
              </h3>
            )}
          </div>

          <div className="mt-5 space-y-3">
            {(search ? filteredEvents : todaysEvents).length === 0 && (
              <p className="text-xs text-muted-foreground">No events.</p>
            )}
            {(search ? filteredEvents : todaysEvents).map(event => (
              <div
                className="rounded-2xl border border-outline-variant/40 bg-white p-3"
                key={event.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <span className="mt-1 size-2 rounded-full bg-blue-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-950">{event.title}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {search ? `${event.date} · ` : ''}
                        {event.time}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-600">
                      {event.label}
                    </span>
                    <button
                      aria-label={`Delete ${event.title}`}
                      className="inline-flex size-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-red-600"
                      onClick={() => removeEvent(event.id)}
                      type="button"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {isAdding ? (
            <div className="mt-4 space-y-3 rounded-2xl border border-outline-variant/40 bg-white p-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-slate-500" htmlFor="event-title">
                  Title
                </label>
                <Input
                  id="event-title"
                  onChange={event => setForm(current => ({ ...current, title: event.target.value }))}
                  placeholder="Event title"
                  value={form.title}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-slate-500" htmlFor="event-date">
                  Date
                </label>
                <Input
                  className="w-full"
                  id="event-date"
                  onChange={event => setForm(current => ({ ...current, date: event.target.value }))}
                  type="date"
                  value={form.date}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-slate-500" htmlFor="event-time">
                  Time
                </label>
                <Input
                  className="w-full"
                  id="event-time"
                  onChange={event => setForm(current => ({ ...current, time: event.target.value }))}
                  type="time"
                  value={form.time}
                />
              </div>
              <Input
                aria-label="Event label"
                onChange={event => setForm(current => ({ ...current, label: event.target.value }))}
                placeholder="Label (e.g. Priority)"
                value={form.label}
              />
              <div className="flex gap-2">
                <button
                  className="h-9 flex-1 rounded-full bg-slate-950 text-xs font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!form.title.trim()}
                  onClick={handleAddEvent}
                  type="button"
                >
                  Save
                </button>
                <button
                  className="h-9 flex-1 rounded-full border border-outline-variant/50 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  onClick={() => setIsAdding(false)}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              className="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-slate-950 text-sm font-bold text-white hover:bg-slate-800"
              onClick={() => setIsAdding(true)}
              type="button"
            >
              <Plus className="size-4" />
              Add Event
            </button>
          )}
        </aside>
      </section>
    </div>
  );
}
