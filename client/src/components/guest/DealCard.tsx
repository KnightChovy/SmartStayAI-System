import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Clock, MapPin, Zap } from 'lucide-react';
import type { Deal } from '@/types/deal.types';
import { ROUTES } from '@/constants/routes';
import { useMoney } from '@/hooks/currency';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&auto=format&fit=crop';

/** Đếm ngược tới `expiresAt` (dạng HH:MM:SS / Nd HH:MM:SS). Trả null khi đã hết hạn. */
function useCountdown(expiresAt: string): string | null {
  const [remaining, setRemaining] = useState(() => new Date(expiresAt).getTime() - Date.now());
  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(new Date(expiresAt).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (remaining <= 0) return null;
  const totalSec = Math.floor(remaining / 1000);
  const days = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  const clock = `${pad(h)}:${pad(m)}:${pad(s)}`;
  return days > 0 ? `${days}d ${clock}` : clock;
}

interface DealCardProps {
  deal: Deal;
}

/** Thẻ deal (SS-501): giá gốc gạch ngang + giá giảm + badge %, countdown nếu flash sale. */
export default function DealCard({ deal }: DealCardProps) {
  const { t } = useTranslation('pages');
  const { format } = useMoney();
  const cover = deal.image ?? FALLBACK_IMAGE;
  const countdown = useCountdown(deal.expiresAt);
  const isFlash = deal.dealType === 'flash_sale';
  // `useCountdown` trả null ⟺ đã hết hạn (remaining ≤ 0) — không gọi Date.now() trong render.
  const expired = countdown === null;

  return (
    <Link
      to={ROUTES.hotelDetail(deal.hotelId)}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-outline-variant/20 bg-surface premium-shadow transition-transform duration-300 hover:-translate-y-0.5"
    >
      <div className="relative h-48 shrink-0 overflow-hidden">
        <img
          src={cover}
          alt={deal.hotelName}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Badge giảm giá */}
        <span className="absolute left-3 top-3 rounded-lg bg-error px-2.5 py-1 text-sm font-bold text-white shadow">
          {t('deals.save', { percent: deal.discountPercent })}
        </span>
        {isFlash && !expired && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-lg bg-premium-gold px-2.5 py-1 text-xs font-bold text-on-surface shadow">
            <Zap className="size-3.5 fill-current" aria-hidden="true" /> {t('deals.flashSale')}
          </span>
        )}
        {expired && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="rounded-full bg-white/90 px-4 py-1.5 text-sm font-bold text-on-surface">
              {t('deals.ended')}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-be-vietnam text-lg font-semibold text-on-surface group-hover:text-primary line-clamp-1">
          {deal.hotelName}
        </h3>
        <p className="mt-1 flex items-center gap-1 text-sm text-on-surface-variant">
          <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="line-clamp-1">{deal.city}</span>
        </p>

        {/* Countdown flash sale — "Kết thúc sau 1d 05:22:31" dài hơn bản EN, cắt đuôi
            thay vì để xuống dòng làm lệch chiều cao thẻ so với các thẻ cùng hàng. */}
        {isFlash && countdown && (
          <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-error">
            <Clock className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {t('deals.endsIn')} {countdown}
            </span>
          </p>
        )}

        {/* Giá và CTA xếp DỌC, không chia ngang: thẻ chỉ rộng ~246px ở grid 4 cột, mà
            "779.000 VNĐ / đêm" + "Xem khách sạn" cộng lại vượt quá — nhãn tiếng Việt dài
            hơn tiếng Anh nên phần tràn rơi đúng vào đơn vị "/ đêm". */}
        <div className="mt-auto pt-4">
          <p className="text-sm text-on-surface-variant line-through">
            {format(deal.originalPrice)}
          </p>
          <p className="font-be-vietnam text-xl font-bold text-on-surface">
            {/* Số tiền và đơn vị mỗi cái là một khối không-ngắt: nếu có xuống dòng thì
                ngắt giữa hai khối, tuyệt đối không cắt đôi "779.000" hay "/ đêm". */}
            <span className="whitespace-nowrap">{format(deal.discountedPrice)}</span>{' '}
            <span className="whitespace-nowrap text-sm font-normal text-on-surface-variant">
              {t('deals.perNight')}
            </span>
          </p>
          <span className="mt-3 flex min-h-11 w-full items-center justify-center rounded-full bg-premium-gold/20 px-4 text-center text-sm font-semibold text-on-surface transition-colors group-hover:bg-premium-gold">
            {t('deals.viewHotel')}
          </span>
        </div>
      </div>
    </Link>
  );
}
