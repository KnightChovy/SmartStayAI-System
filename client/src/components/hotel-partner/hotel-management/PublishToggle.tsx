import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import { useSetHotelListing } from '@/hooks/hotels';
import { errorMessage } from '@/utils/errorMessage';
import type { PartnerHotel } from '@/types/hotel.types';

interface PublishToggleProps {
  hotel: PartnerHotel;
}

/**
 * Công tắc bật/tắt mở bán cho một khách sạn (`PATCH /hotels/:id/publish`).
 * Không cho bật khi KS chưa được duyệt (BE cũng chặn — nhắc trước cho rõ); tắt bán luôn được.
 */
export function PublishToggle({ hotel }: PublishToggleProps) {
  const { mutate, isPending } = useSetHotelListing();
  const next = !hotel.isListed;
  const cannotEnable = next && !hotel.isActive;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPending) return;
    if (cannotEnable) {
      toast.error('Khách sạn chưa được duyệt nên chưa thể mở bán.');
      return;
    }
    mutate(
      { hotelId: hotel.id, isListed: next },
      {
        onSuccess: () =>
          toast.success(next ? 'Đã mở bán khách sạn.' : 'Đã gỡ khách sạn khỏi sàn.'),
        onError: err =>
          toast.error(errorMessage(err, 'Không thể cập nhật trạng thái mở bán.')),
      }
    );
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={hotel.isListed}
        aria-label={hotel.isListed ? 'Gỡ khỏi sàn' : 'Mở bán'}
        disabled={isPending || cannotEnable}
        onClick={handleToggle}
        title={
          cannotEnable
            ? 'Cần được duyệt và có loại phòng đang bật mới mở bán được'
            : hotel.isListed
              ? 'Đang mở bán — bấm để gỡ'
              : 'Đang ẩn — bấm để mở bán'
        }
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
          hotel.isListed ? 'bg-emerald-500' : 'bg-slate-300',
          (isPending || cannotEnable) && 'opacity-60',
          isPending ? 'cursor-wait' : cannotEnable ? 'cursor-not-allowed' : 'cursor-pointer'
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
            hotel.isListed ? 'translate-x-4.5' : 'translate-x-0.5'
          )}
        />
      </button>
      <span
        className={cn(
          'inline-flex items-center gap-1 text-xs font-semibold',
          hotel.isListed ? 'text-emerald-600' : 'text-slate-500'
        )}
      >
        {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
        {hotel.isListed ? 'Listed' : 'Unlisted'}
      </span>
    </div>
  );
}
