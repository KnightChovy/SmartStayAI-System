import { useEffect, useState } from 'react';
import type { Booking } from '@/types/bookings.type';

/**
 * Trạng thái "đơn đã tạo nhưng chưa trả tiền" của một booking — mirror `usePaymentHold`
 * bên client.
 *
 * BE giữ chỗ rất ngắn (VNPay 15 phút, SePay 30 phút) rồi cron `releaseExpiredHolds` huỷ
 * đơn — và hoàn lại phần đã trừ ví nếu có (trong cùng transaction huỷ đơn, không cần app
 * làm gì thêm). Mọi endpoint tạo thanh toán đều chặn cả hai điều kiện `status !== 'pending'`
 * và `holdExpiresAt < now` ⇒ gom vào một chỗ để nút thanh toán và banner cảnh báo không
 * bao giờ nói hai điều khác nhau.
 */
export interface PaymentHold {
  /** Đơn đang chờ tiền VÀ còn hạn giữ chỗ ⇒ được phép gọi endpoint thanh toán. */
  awaitingPayment: boolean;
  /**
   * Đơn vẫn `pending` nhưng hạn giữ chỗ ĐÃ trôi qua — cron chạy theo nhịp nên có một
   * khoảng đơn nằm ở trạng thái này trước khi bị huỷ hẳn.
   */
  expired: boolean;
  /** Mili-giây còn lại; `null` khi đơn không có hạn giữ chỗ (đơn tiền mặt confirm ngay). */
  msLeft: number | null;
  /** Đếm ngược dạng `m:ss`; `null` khi không có hạn. */
  countdown: string | null;
}

/**
 * Theo dõi hạn giữ chỗ theo thời gian thực (nhịp 1 giây) để UI tự ẩn nút / đếm ngược
 * đúng lúc đơn hết hạn, thay vì mời khách bấm vào một nút chắc chắn trả về lỗi.
 */
export function usePaymentHold(booking: Booking | null | undefined): PaymentHold {
  const parsed = booking?.holdExpiresAt ? new Date(booking.holdExpiresAt).getTime() : NaN;
  const deadline = Number.isNaN(parsed) ? null : parsed;
  const isPending = booking?.status === 'pending';

  // Nhịp đếm chỉ chạy khi thực sự có hạn để đếm — màn đơn đã hoàn tất không việc gì
  // phải re-render mỗi giây.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!isPending || deadline === null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isPending, deadline]);

  const msLeft = deadline === null ? null : deadline - now;
  // `msLeft === null` = đơn pending không có hạn (tiền mặt) ⇒ vẫn cho thanh toán, BE mới
  // là bên chốt. Chỉ chặn khi có hạn và hạn đã trôi qua.
  const awaitingPayment = !!isPending && (msLeft === null || msLeft > 0);

  return {
    awaitingPayment,
    expired: !!isPending && msLeft !== null && msLeft <= 0,
    msLeft,
    countdown: msLeft === null ? null : formatCountdown(msLeft),
  };
}

/** `m:ss`, kẹp ở 0 để không bao giờ hiện số âm trong khoảnh khắc trước lần tick kế tiếp. */
function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
