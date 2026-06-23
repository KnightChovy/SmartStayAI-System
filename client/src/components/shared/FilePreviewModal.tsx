import { useEffect, useState } from 'react';
import { X, ExternalLink, Download, FileText, FileWarning } from 'lucide-react';
import {
  isPdfUrl,
  cloudinaryPdfPreview,
  cloudinaryDownloadUrl,
} from '@/utils/cloudinary';

export interface PreviewFile {
  url: string;
  name?: string;
}

interface FilePreviewModalProps {
  /** File đang xem; `null` để đóng. */
  file: PreviewFile | null;
  onClose: () => void;
}

/**
 * Lightbox xem ảnh & file (PDF) ngay trong app thay vì mở tab tới URL gốc.
 * Với PDF của Cloudinary (bị chặn xem trực tiếp) sẽ hiển thị bản rasterize trang đầu;
 * luôn kèm nút "Open original" + "Download". Đóng bằng nút X, Esc, hoặc click nền.
 */
export function FilePreviewModal({ file, onClose }: FilePreviewModalProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [file?.url]);

  useEffect(() => {
    if (!file) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [file, onClose]);

  if (!file) return null;

  const pdf = isPdfUrl(file.url);
  const previewSrc = pdf ? cloudinaryPdfPreview(file.url) : file.url;
  const label = file.name ?? 'Preview';

  return (
    <div
      className="fixed inset-0 z-60 flex flex-col bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onMouseDown={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 shrink-0 opacity-70" />
          <span className="text-sm font-medium truncate">{label}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Open original
          </a>
          <a
            href={cloudinaryDownloadUrl(file.url)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Download
          </a>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div
        className="flex-1 min-h-0 flex items-center justify-center p-4"
        onMouseDown={e => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {failed ? (
          <div className="flex flex-col items-center gap-3 text-center text-white/80 max-w-sm">
            <FileWarning className="w-10 h-10 text-amber-300" />
            <p className="text-sm font-medium">Preview unavailable</p>
            <p className="text-xs text-white/60">
              This file could not be displayed inline. Use the buttons above to open
              or download the original file.
            </p>
          </div>
        ) : (
          <img
            src={previewSrc}
            alt={label}
            className="max-h-full max-w-full object-contain rounded-lg shadow-2xl bg-white"
            onError={() => setFailed(true)}
          />
        )}
      </div>

      {pdf && !failed && (
        <p className="text-center text-[11px] text-white/55 pb-3 px-4 shrink-0">
          Showing the first page of the PDF. Use “Open original” for the full document.
        </p>
      )}
    </div>
  );
}
