import { useEffect } from 'react';
import { Headphones, MessageCircle, Phone, ShieldCheck, X } from 'lucide-react';
import { formatDate, formatTime } from '@/utils/formatDate';

interface AdminSupportModalProps {
  currentTime: Date;
  onClose: () => void;
}

const channels = [
  {
    icon: MessageCircle,
    label: 'Live Chat',
    response: '< 2 min',
    status: 'Online',
  },
  {
    icon: Phone,
    label: 'Incident Hotline',
    response: '24/7',
    status: 'Available',
  },
  {
    icon: ShieldCheck,
    label: 'Security Desk',
    response: '< 10 min',
    status: 'Monitoring',
  },
];

export function AdminSupportModal({
  currentTime,
  onClose,
}: AdminSupportModalProps) {
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
        aria-label="Close support"
        className="absolute inset-0 h-full w-full"
        onClick={onClose}
        type="button"
      />

      <section className="relative z-10 w-full max-w-3xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-outline-variant/40 px-4 py-4 sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <Headphones className="size-5 text-rose-600" />
              <h2 className="text-xl font-bold text-slate-950">
                Support Center
              </h2>
            </div>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              Live status {formatDate(currentTime)} | {formatTime(currentTime)}
            </p>
          </div>
          <button
            aria-label="Close support"
            className="inline-flex size-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="grid gap-4 p-4 sm:p-6 sm:grid-cols-3">
          {channels.map(channel => {
            const Icon = channel.icon;

            return (
              <article
                className="rounded-[24px] border border-outline-variant/40 bg-slate-50 p-4"
                key={channel.label}
              >
                <div className="flex size-11 items-center justify-center rounded-2xl bg-white text-rose-600 shadow-sm">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-4 text-sm font-bold text-slate-950">
                  {channel.label}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Response {channel.response}
                </p>
                <span className="mt-4 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">
                  {channel.status}
                </span>
              </article>
            );
          })}
        </div>

        <div className="border-t border-outline-variant/40 p-4 sm:p-6">
          <textarea
            className="min-h-28 w-full resize-none rounded-[22px] border border-outline-variant/50 bg-white p-4 text-sm outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20"
            placeholder="Describe the support request..."
          />
          <button
            className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white hover:bg-slate-800"
            type="button"
          >
            Open Support Ticket
          </button>
        </div>
      </section>
    </div>
  );
}
