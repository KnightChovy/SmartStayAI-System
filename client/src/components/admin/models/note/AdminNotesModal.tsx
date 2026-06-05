import { useEffect } from 'react';
import { NotebookText, Pin, Plus, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatDate, formatTime } from '@/utils/formatDate';

interface AdminNotesModalProps {
  currentTime: Date;
  onClose: () => void;
}

const notes = [
  {
    title: 'VIP arrivals',
    body: 'Confirm welcome amenity and late checkout requests before 3 PM.',
    pinned: true,
  },
  {
    title: 'Marketing follow-up',
    body: 'Review generated winter campaign copy before scheduling.',
    pinned: false,
  },
  {
    title: 'Ops handoff',
    body: 'Share occupancy spike details with front desk supervisors.',
    pinned: false,
  },
];

export function AdminNotesModal({ currentTime, onClose }: AdminNotesModalProps) {
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
        aria-label="Close notes"
        className="absolute inset-0 h-full w-full"
        onClick={onClose}
        type="button"
      />

      <section className="relative z-10 w-full max-w-3xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-outline-variant/40 px-4 py-4 sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <NotebookText className="size-5 text-purple-600" />
              <h2 className="text-xl font-bold text-slate-950">Notes</h2>
            </div>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              Updated {formatDate(currentTime)} | {formatTime(currentTime)}
            </p>
          </div>
          <button
            aria-label="Close notes"
            className="inline-flex size-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[1fr_260px]">
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-10 rounded-full bg-slate-50 pl-9 text-xs"
                placeholder="Search notes..."
              />
            </div>

            <div className="mt-4 grid gap-3">
              {notes.map(note => (
                <article
                  className="rounded-[22px] border border-outline-variant/40 bg-slate-50 p-4"
                  key={note.title}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-bold text-slate-950">
                      {note.title}
                    </h3>
                    {note.pinned ? (
                      <Pin className="size-4 text-purple-600" />
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {note.body}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <aside className="rounded-[24px] bg-slate-950 p-4 text-white">
            <p className="text-xs font-bold uppercase tracking-wide text-white/60">
              Quick Note
            </p>
            <textarea
              className="mt-3 min-h-36 w-full resize-none rounded-2xl border border-white/10 bg-white/10 p-3 text-sm text-white outline-none placeholder:text-white/45"
              placeholder="Write an admin note..."
            />
            <button
              className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-white text-sm font-bold text-slate-950 hover:bg-white/90"
              type="button"
            >
              <Plus className="size-4" />
              Add Note
            </button>
          </aside>
        </div>
      </section>
    </div>
  );
}
