import { useTranslation } from 'react-i18next';
import { useMoney } from '@/hooks/currency';
import { Button } from '@/components/ui/button';

interface StickyBookingBarProps {
  /** Giá thấp nhất (VND, dạng string từ BE). Null → chưa có giá thì không hiện bar. */
  price: string | null;
  /**
   * Số đêm mà `price` bao trọn. Có giá trị ⇒ `price` là TỔNG kỳ ở đã áp pricing rule + thuế/phí
   * (đúng bằng số trên thẻ phòng bên dưới); null ⇒ chỉ là giá gốc mỗi đêm nên phải ghi rõ "/đêm".
   */
  nights?: number | null;
  /** Cuộn tới danh sách phòng. */
  onSelectRoom: () => void;
}

/**
 * Thanh giá + CTA cố định đáy màn hình — hiện ở MỌI kích thước (Fitts / vùng ngón
 * tay cái trên mobile, và giữ điểm neo giá khi cuộn dài trên desktop).
 */
export default function StickyBookingBar({
  price,
  nights,
  onSelectRoom,
}: StickyBookingBarProps) {
  const { t } = useTranslation('hotel');
  const { format } = useMoney();
  if (!price) return null;

  const hasStayQuote = nights != null && nights > 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant/40 bg-surface/95 p-3 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="min-w-0">
          {hasStayQuote ? (
            <>
              <p className="text-xs text-on-surface-variant">
                {t('room.nightsTotal', { count: nights })} ·{' '}
                {t('room.totalSuffix').charAt(0).toUpperCase() +
                  t('room.totalSuffix').slice(1)}
              </p>
              <p className="truncate font-be-vietnam text-lg font-bold text-on-surface">
                {format(price)}
              </p>
            </>
          ) : (
            <>
              <p className="text-xs text-on-surface-variant">
                {t('room.from')}
              </p>
              <p className="truncate font-be-vietnam text-lg font-bold text-on-surface">
                {format(price)}
                <span className="text-xs font-normal text-on-surface-variant">
                  {' '}
                  {t('room.perNight')}
                </span>
              </p>
            </>
          )}
        </div>
        <Button
          size="lg"
          variant="cta"
          className="min-h-12 shrink-0"
          onClick={onSelectRoom}
        >
          {t('room.bookNow')}
        </Button>
      </div>
    </div>
  );
}
