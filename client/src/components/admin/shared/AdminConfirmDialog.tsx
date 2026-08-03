import { useEffect } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';

interface AdminConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function AdminConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  loading = false,
  destructive = false,
  onConfirm,
  onClose,
}: AdminConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-70 flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
    >
      <button
        aria-label="Close dialog"
        className="absolute inset-0 h-full w-full"
        onClick={onClose}
        type="button"
      />

      <section className="relative z-10 w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-outline-variant/40 px-5 py-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-500" />
            <h2 className="text-lg font-bold text-slate-950">{title}</h2>
          </div>
          <button
            aria-label="Close dialog"
            className="inline-flex size-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="space-y-4 p-5">
          <p className="text-sm text-slate-600">{message}</p>

          <div className="flex justify-end gap-2">
            <button
              className="inline-flex h-9 items-center justify-center rounded-full border border-border px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading}
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${
                destructive
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-role-admin-primary hover:bg-role-admin-secondary'
              }`}
              disabled={loading}
              onClick={onConfirm}
              type="button"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              {confirmLabel}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
