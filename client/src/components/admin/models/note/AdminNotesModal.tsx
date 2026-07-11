import { useEffect, useState } from 'react';
import { NotebookText, Pin, Plus, Search, Trash2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAdminNotes } from '@/hooks/admin-tools';
import { formatDateLong, formatTime } from '@/utils/formatDate';

interface AdminNotesModalProps {
  currentTime: Date;
  onClose: () => void;
}

export function AdminNotesModal({ currentTime, onClose }: AdminNotesModalProps) {
  const { notes, addNote, togglePin, removeNote } = useAdminNotes();
  const [search, setSearch] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const filteredNotes = notes.filter(note =>
    `${note.title} ${note.body}`.toLowerCase().includes(search.trim().toLowerCase())
  );

  const handleAddNote = () => {
    if (!body.trim()) return;
    addNote(title, body);
    setTitle('');
    setBody('');
  };

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
              {notes.length} note{notes.length === 1 ? '' : 's'} · saved on this device
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
                onChange={event => setSearch(event.target.value)}
                placeholder="Search notes..."
                value={search}
              />
            </div>

            <div className="mt-4 grid max-h-100 gap-3 overflow-y-auto">
              {filteredNotes.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {notes.length === 0 ? 'No notes yet.' : 'No notes match your search.'}
                </p>
              )}
              {filteredNotes.map(note => (
                <article
                  className="rounded-[22px] border border-outline-variant/40 bg-slate-50 p-4"
                  key={note.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-bold text-slate-950">{note.title}</h3>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
                        className={`inline-flex size-7 items-center justify-center rounded-full hover:bg-white ${
                          note.pinned ? 'text-purple-600' : 'text-slate-400'
                        }`}
                        onClick={() => togglePin(note.id)}
                        type="button"
                      >
                        <Pin className="size-4" />
                      </button>
                      <button
                        aria-label="Delete note"
                        className="inline-flex size-7 items-center justify-center rounded-full text-slate-400 hover:bg-white hover:text-red-600"
                        onClick={() => removeNote(note.id)}
                        type="button"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                  {note.body && (
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                      {note.body}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </div>

          <aside className="rounded-[24px] bg-slate-950 p-4 text-white">
            <p className="text-xs font-bold uppercase tracking-wide text-white/60">
              Quick Note
            </p>
            <p className="mt-1 text-[11px] text-white/45">
              {formatDateLong(currentTime)} | {formatTime(currentTime)}
            </p>
            <Input
              className="mt-3 h-9 border-white/10 bg-white/10 text-sm text-white placeholder:text-white/45"
              onChange={event => setTitle(event.target.value)}
              placeholder="Title"
              value={title}
            />
            <textarea
              className="mt-2 min-h-32 w-full resize-none rounded-2xl border border-white/10 bg-white/10 p-3 text-sm text-white outline-none placeholder:text-white/45"
              onChange={event => setBody(event.target.value)}
              placeholder="Write an admin note..."
              value={body}
            />
            <button
              className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-white text-sm font-bold text-slate-950 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!body.trim()}
              onClick={handleAddNote}
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
