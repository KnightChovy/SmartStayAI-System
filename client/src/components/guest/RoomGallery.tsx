import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image as ImageIcon } from 'lucide-react';
import GalleryLightbox from './GalleryLightbox';
import { cn } from '@/lib/cn';

interface RoomGalleryProps {
  images: string[];
  /** Tên dùng cho alt ảnh (vd tên phòng / khách sạn). */
  altBase: string;
  className?: string;
}

/**
 * Gallery ảnh phòng thích ứng theo SỐ LƯỢNG ảnh (SS-301) — không để khoảng trắng thừa khi ít ảnh:
 * 1 ảnh → full width · 2 ảnh → chia đôi · 3 ảnh → 1 lớn + 2 nhỏ · ≥4 → grid + nút "Xem tất cả".
 * Ratio 16:10, object-cover. Mobile luôn hiện 1 ảnh lớn + nút mở lightbox (tránh thumbnail vụn).
 * Tự quản lý lightbox (mở/điều hướng) nên nơi dùng chỉ cần truyền mảng ảnh.
 */
export default function RoomGallery({ images, altBase, className }: RoomGalleryProps) {
  const { t } = useTranslation('hotel');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  if (images.length === 0) return null;

  const openAt = (index: number) => {
    setActive(index);
    setOpen(true);
  };

  const alt = (i: number) => `${altBase} — ${i + 1}/${images.length}`;
  const count = images.length;

  const tile = (index: number, extraClass?: string) => (
    <button
      key={images[index] + index}
      type="button"
      onClick={() => openAt(index)}
      className={cn(
        'group relative overflow-hidden rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        extraClass
      )}
    >
      <img
        src={images[index]}
        alt={alt(index)}
        loading={index === 0 ? 'eager' : 'lazy'}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
    </button>
  );

  return (
    <div className={className}>
      {/* Mobile: 1 ảnh lớn + nút xem tất cả */}
      <div className="relative md:hidden">
        {tile(0, 'aspect-[16/10] w-full')}
        {count > 1 && (
          <button
            type="button"
            onClick={() => openAt(0)}
            className="absolute bottom-3 right-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-surface/90 px-4 text-sm font-semibold text-on-surface backdrop-blur"
          >
            <ImageIcon className="size-4" /> {t('gallery.viewAll', { count })}
          </button>
        )}
      </div>

      {/* Desktop: bố cục thích ứng theo số ảnh */}
      <div className="relative hidden md:block">
        {count === 1 && tile(0, 'aspect-[16/10] w-full')}

        {count === 2 && (
          <div className="grid aspect-[16/9] grid-cols-2 gap-2">
            {tile(0)}
            {tile(1)}
          </div>
        )}

        {count === 3 && (
          <div className="grid aspect-[16/9] grid-cols-3 grid-rows-2 gap-2">
            {tile(0, 'col-span-2 row-span-2')}
            {tile(1)}
            {tile(2)}
          </div>
        )}

        {count >= 4 && (
          <div className="grid aspect-[16/8] grid-cols-4 grid-rows-2 gap-2">
            {tile(0, 'col-span-2 row-span-2')}
            {images.slice(1, 5).map((_, i) => tile(i + 1))}
            {count > 5 && (
              <button
                type="button"
                onClick={() => openAt(0)}
                className="absolute bottom-3 right-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-surface/90 px-4 text-sm font-semibold text-on-surface backdrop-blur"
              >
                <ImageIcon className="size-4" /> {t('gallery.viewAll', { count })}
              </button>
            )}
          </div>
        )}
      </div>

      <GalleryLightbox
        open={open}
        images={images}
        index={active}
        onIndexChange={setActive}
        hotelName={altBase}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
