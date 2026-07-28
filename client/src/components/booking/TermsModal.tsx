import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

interface TermsModalProps {
  open: boolean;
  onClose: () => void;
  /** Chính sách hủy dạng văn bản của khách sạn (nếu có) — hiện kèm điều khoản chung. */
  cancellationPolicy?: string | null;
}

/**
 * Modal nội dung "Điều khoản & Chính sách hủy" (SS-402) mở từ checkbox đồng ý ở bước xác nhận.
 * Đóng bằng Esc / bấm nền / nút X.
 */
export default function TermsModal({ open, onClose, cancellationPolicy }: TermsModalProps) {
  const { t } = useTranslation('booking');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const clauses = t('terms.clauses', { returnObjects: true }) as string[];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('terms.modalTitle')}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-lg overflow-auto rounded-2xl bg-surface p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-be-vietnam text-lg font-bold text-on-surface">
            {t('terms.modalTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('terms.close')}
            className="rounded-full p-1 text-on-surface-variant hover:bg-surface-container"
          >
            <X className="size-5" />
          </button>
        </div>

        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-on-surface-variant">
          {clauses.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>

        <div className="mt-5 border-t border-outline-variant/30 pt-4">
          <h3 className="text-sm font-semibold text-on-surface">
            {t('terms.cancellationHeading')}
          </h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            {cancellationPolicy?.trim() || t('trust.cancellationFallback')}
          </p>
        </div>
      </div>
    </div>
  );
}
