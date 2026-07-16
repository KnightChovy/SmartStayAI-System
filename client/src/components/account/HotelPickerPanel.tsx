import { useEffect, useMemo, useState } from 'react';
import { Loader2, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';
import { useSearchHotels } from '@/hooks/hotels';
import { cn } from '@/lib/cn';
import { hotelInitials } from '@/utils/hotelInitials';

// Trần của BE cho `GET /hotels` (Joi `limit.max(100)`) — xin hơn là bị 400.
const HOTEL_FETCH_LIMIT = 100;

interface HotelPickerPanelProps {
  onSelect: (hotelId: string) => void;
  onClose: () => void;
}

/**
 * Chọn MỘT khách sạn bất kỳ trên sàn để bắt đầu nhắn với lễ tân của họ.
 *
 * Vì sao cần: `/account/messages` chỉ liệt kê các KS khách ĐÃ nhắn, nên nếu không có bộ chọn này
 * thì không có đường nào tạo cuộc trò chuyện MỚI — khung chat nổi giờ là trợ lý toàn sàn, không
 * còn gắn khách sạn nữa.
 */
export function HotelPickerPanel({ onSelect, onClose }: HotelPickerPanelProps) {
  const { t } = useTranslation('account');
  const [term, setTerm] = useState('');
  const { data, isLoading } = useSearchHotels({ limit: HOTEL_FETCH_LIMIT });

  const loaded = useMemo(() => data?.results ?? [], [data]);

  /**
   * Lọc phía CLIENT vì `GET /hotels` không có tham số tìm theo tên (Joi chỉ nhận `city`), nên chỉ
   * lọc được trong số đã tải. Trần của BE là 100/trang ⇒ sàn có hơn 100 KS thì phần dư không tìm
   * thấy ở đây. Không giấu: báo rõ số đang hiện bên dưới thay vì để khách tưởng KS không tồn tại.
   */
  const hotels = useMemo(() => {
    const needle = term.trim().toLowerCase();
    if (!needle) return loaded;
    return loaded.filter(
      hotel =>
        hotel.name.toLowerCase().includes(needle) ||
        hotel.city.toLowerCase().includes(needle)
    );
  }, [loaded, term]);

  const total = data?.totalResults ?? 0;
  const isTruncated = total > loaded.length;

  // Esc để đóng — panel phủ toàn màn hình nên phải thoát được bằng bàn phím.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={t('messages.close')}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/40 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('messages.pickHotel')}
        className="relative flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface shadow-2xl"
      >
        <div className="flex items-center justify-between gap-2 border-b border-outline-variant/40 px-4 py-3">
          <h2 className="text-sm font-semibold text-on-surface">
            {t('messages.pickHotel')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('messages.close')}
            className="rounded-full p-1 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="border-b border-outline-variant/40 p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" />
            <Input
              value={term}
              onChange={event => setTerm(event.target.value)}
              placeholder={t('messages.searchHotel')}
              aria-label={t('messages.searchHotel')}
              className="pl-8.5"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="size-5 animate-spin text-on-surface-variant" />
            </div>
          ) : hotels.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-on-surface-variant">
              {t('messages.noHotel')}
            </p>
          ) : (
            <ul>
              {hotels.map(hotel => {
                const imageUrl = hotel.images[0]?.url;
                return (
                  <li key={hotel.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(hotel.id)}
                      className={cn(
                        'flex w-full items-center gap-3 border-b border-outline-variant/30 px-4 py-3 text-left transition-colors',
                        'hover:bg-surface-container-low'
                      )}
                    >
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={hotel.name}
                          className="size-10 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {hotelInitials(hotel.name)}
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-on-surface">
                          {hotel.name}
                        </span>
                        <span className="block truncate text-xs text-on-surface-variant">
                          {hotel.city}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Không cắt danh sách trong im lặng: nói rõ đang hiện bao nhiêu trên tổng số. */}
        {isTruncated && (
          <p className="border-t border-outline-variant/40 px-4 py-2 text-center text-[11px] text-on-surface-variant">
            {t('messages.showingCount', { shown: loaded.length, total })}
          </p>
        )}
      </div>
    </div>
  );
}
