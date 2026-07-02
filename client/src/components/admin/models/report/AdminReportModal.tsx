import { useEffect } from 'react';
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Database,
  FileText,
  HeartPulse,
  Monitor,
  Pencil,
  Table,
  Users,
  X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';
import { formatDateLong, formatTime } from '@/utils/formatDate';

interface AdminReportModalProps {
  currentTime: Date;
  onClose: () => void;
}

const reportTypes = [
  { icon: Users, label: 'User Growth', selected: true },
  { icon: CreditCard, label: 'Financial', selected: false },
  { icon: HeartPulse, label: 'Health', selected: false },
  { icon: Monitor, label: 'Devices', selected: false },
];

const formats = [
  { icon: FileText, label: 'PDF', selected: true },
  { icon: Database, label: 'CSV', selected: false },
  { icon: Table, label: 'Excel', selected: false },
];

const dateCells = [
  { day: 'Su', value: '30', muted: true },
  { day: 'Mo', value: '31', muted: true },
  { day: 'Tu', value: '1', active: true },
  { day: 'We', value: '2' },
  { day: 'Th', value: '3' },
  { day: 'Fr', value: '4' },
  { day: 'Sa', value: '5' },
];

export function AdminReportModal({
  currentTime,
  onClose,
}: AdminReportModalProps) {
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
        aria-label="Close report modal"
        className="absolute inset-0 h-full w-full"
        onClick={onClose}
        type="button"
      />

      <section className="relative z-10 w-full max-w-4xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <header className="flex items-center justify-between gap-4 border-b border-outline-variant/40 px-4 py-4 sm:px-6">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              Generate Report
            </h2>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              Realtime {formatDateLong(currentTime)} | {formatTime(currentTime)}
            </p>
          </div>
          <button
            aria-label="Close report modal"
            className="inline-flex size-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-2">
          <div className="space-y-5">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Step 1: Report Parameters
            </p>

            <div className="space-y-2">
              <label
                className="text-xs font-bold uppercase tracking-wide text-slate-500"
                htmlFor="report-name"
              >
                Report Name
              </label>
              <div className="relative">
                <Input
                  className="h-10 rounded-full pr-10 text-sm"
                  defaultValue={`${new Intl.DateTimeFormat('en-US', {
                    month: 'long',
                  }).format(currentTime)} Performance Overview`}
                  id="report-name"
                />
                <Pencil className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div className="space-y-2">
              <label
                className="text-xs font-bold uppercase tracking-wide text-slate-500"
                htmlFor="report-type"
              >
                Report Type
              </label>
              <select
                className="h-10 w-full rounded-full border border-outline-variant/50 bg-white px-4 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20"
                defaultValue="User Activity"
                id="report-type"
              >
                <option>User Activity</option>
                <option>Revenue Summary</option>
                <option>System Health</option>
                <option>Device Analytics</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {reportTypes.map(type => {
                const Icon = type.icon;

                return (
                  <button
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-[22px] border px-3 py-4 text-xs font-bold transition-colors',
                      type.selected
                        ? 'border-slate-950 bg-white text-slate-950 shadow-sm'
                        : 'border-outline-variant/40 bg-slate-50 text-slate-500 hover:bg-white'
                    )}
                    key={type.label}
                    type="button"
                  >
                    <Icon className="size-5" />
                    {type.label}
                  </button>
                );
              })}
            </div>

            <div className="rounded-[24px] bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Date Range
                </p>
                <div className="flex items-center gap-3 text-xs font-bold text-slate-950">
                  <ChevronLeft className="size-4" />
                  {new Intl.DateTimeFormat('en-US', {
                    month: 'long',
                    year: 'numeric',
                  }).format(currentTime)}
                  <ChevronRight className="size-4" />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-7 gap-2 text-center">
                {dateCells.map(cell => (
                  <div key={`${cell.day}-${cell.value}`}>
                    <p className="text-[10px] font-bold text-slate-400">
                      {cell.day}
                    </p>
                    <button
                      className={cn(
                        'mt-2 inline-flex size-7 items-center justify-center rounded-full text-xs font-bold',
                        cell.active
                          ? 'bg-slate-950 text-white'
                          : cell.muted
                            ? 'text-slate-300'
                            : 'text-slate-700 hover:bg-white'
                      )}
                      type="button"
                    >
                      {cell.value}
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  className="rounded-full bg-slate-200 px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-300"
                  type="button"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Step 2: Output Options
            </p>

            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Data Sources
              </p>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <input
                  className="size-4 accent-blue-600"
                  defaultChecked
                  type="checkbox"
                />
                Include Detailed User List
              </label>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                File Format
              </p>
              <div className="grid grid-cols-3 gap-3">
                {formats.map(format => {
                  const Icon = format.icon;

                  return (
                    <button
                      className={cn(
                        'flex flex-col items-center gap-2 rounded-[22px] border px-3 py-4 text-xs font-bold transition-colors',
                        format.selected
                          ? 'border-blue-600 bg-blue-50 text-blue-600'
                          : 'border-outline-variant/40 bg-slate-50 text-slate-500 hover:bg-white'
                      )}
                      key={format.label}
                      type="button"
                    >
                      <Icon className="size-5" />
                      {format.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Delivery
              </p>
              <div className="space-y-2">
                <label
                  className="text-xs font-bold uppercase tracking-wide text-slate-500"
                  htmlFor="report-email"
                >
                  Email Recipient
                </label>
                <Input
                  className="h-10 rounded-full text-sm"
                  defaultValue="info@devoryn.com"
                  id="report-email"
                  type="email"
                />
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <input className="size-4 accent-blue-600" type="checkbox" />
                Save a copy to my File Manager
              </label>
            </div>

            <button
              className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700"
              type="button"
            >
              <CheckCircle className="size-4" />
              Generate &amp; Send Report
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
