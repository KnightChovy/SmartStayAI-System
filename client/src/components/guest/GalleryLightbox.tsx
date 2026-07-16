import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface GalleryLightboxProps {
  open: boolean;
  onClose: () => void;
  images: string[];
  index: number;
  onIndexChange: (index: number) => void;
  hotelName: string;
}

/** Khoảng cách vuốt tối thiểu (px) để tính là chuyển ảnh. */
const SWIPE_THRESHOLD = 48;

/**
 * Trình xem ảnh toàn màn hình: vuốt trên mobile, phím ←/→/Esc trên desktop.
 * Ảnh chạy vòng (wrap-around) để không bao giờ vào ngõ cụt.
 */
export default function GalleryLightbox({
  open,
  onClose,
  images,
  index,
  onIndexChange,
  hotelName,
}: GalleryLightboxProps) {
  const { t } = useTranslation('hotel');
  const touchStartX = useRef<number | null>(null);

  const go = useCallback(
    (delta: number) => {
      if (images.length === 0) return;
      onIndexChange((index + delta + images.length) % images.length);
    },
    [index, images.length, onIndexChange]
  );

  // Điều hướng bàn phím + khoá cuộn nền khi mở.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose, go]);

  if (!open || images.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-60 flex flex-col bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label={t('galleryAlt', { name: hotelName, index: index + 1, total: images.length })}
      onTouchStart={e => (touchStartX.current = e.touches[0].clientX)}
      onTouchEnd={e => {
        if (touchStartX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(dx) > SWIPE_THRESHOLD) go(dx < 0 ? 1 : -1);
        touchStartX.current = null;
      }}
    >
      {/* Header: đếm ảnh + đóng */}
      <div className="flex shrink-0 items-center justify-between p-4 text-white">
        <span className="text-sm font-medium">
          {index + 1} / {images.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('gallery.close')}
          className="flex size-11 items-center justify-center rounded-full hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Ảnh + nút prev/next */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-2 pb-4">
        {images.length > 1 && (
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label={t('gallery.prev')}
            className="absolute left-2 flex size-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <ChevronLeft className="size-6" />
          </button>
        )}

        <img
          src={images[index]}
          alt={t('galleryAlt', { name: hotelName, index: index + 1, total: images.length })}
          className="max-h-full max-w-full object-contain"
        />

        {images.length > 1 && (
          <button
            type="button"
            onClick={() => go(1)}
            aria-label={t('gallery.next')}
            className="absolute right-2 flex size-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <ChevronRight className="size-6" />
          </button>
        )}
      </div>
    </div>
  );
}
