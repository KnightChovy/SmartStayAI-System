import { useTranslation } from 'react-i18next';
import { useMoney } from '@/hooks/currency';
import { Button } from '@/components/ui/button';

interface StickyBookingBarProps {
  /** Giá thấp nhất (VND, dạng string từ BE). Null → chưa có giá thì không hiện bar. */
  minPrice: string | null;
  /** Cuộn tới danh sách phòng. */
  onSelectRoom: () => void;
}

/**
 * Thanh giá + CTA cố định đáy màn hình trên MOBILE (Fitts / vùng ngón tay cái).
 * Ẩn trên desktop (lg+) vì ở đó danh sách phòng đã nằm trong tầm nhìn.
 */
export default function StickyBookingBar({ minPrice, onSelectRoom }: StickyBookingBarProps) {
  const { t } = useTranslation('hotel');
  const { format } = useMoney();
  if (!minPrice) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant/40 bg-surface/95 p-3 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-on-surface-variant">{t('room.from')}</p>
          <p className="truncate font-be-vietnam text-lg font-bold text-on-surface">
            {format(minPrice)}
            <span className="text-xs font-normal text-on-surface-variant"> {t('room.perNight')}</span>
          </p>
        </div>
        <Button
          size="lg"
          className="min-h-12 shrink-0 bg-primary text-on-primary hover:bg-primary/90"
          onClick={onSelectRoom}
        >
          {t('room.bookNow')}
        </Button>
      </div>
    </div>
  );
}
