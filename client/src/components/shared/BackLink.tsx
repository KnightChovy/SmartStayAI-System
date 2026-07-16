import { useNavigate, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/cn';

interface BackLinkProps {
  /**
   * Đích dự phòng khi không lùi được trong history (mở link trực tiếp / dán URL / tab mới).
   * Bỏ trống thì nút chỉ `navigate(-1)`.
   */
  fallbackTo?: string;
  /** Nhãn tuỳ biến; mặc định là "Back" / "Quay lại". */
  label?: string;
  className?: string;
}

/**
 * Nút quay lại dùng chung cho toàn bộ trang guest/account.
 *
 * Trước đây mỗi trang tự dựng một nút: chữ khác nhau ("Back" / "Back to results" /
 * "My bookings"), cơ chế khác nhau (`navigate(-1)` vs `<Link>` cứng), và bản ở account
 * còn rơi mất focus ring lẫn vùng chạm 44px. Gom về một chỗ để cả 3 khớp nhau.
 *
 * Cơ chế: ưu tiên lùi history (giữ đúng ngữ cảnh khách vừa xem — vd trang search kèm bộ lọc);
 * nếu vào thẳng bằng URL thì history không có gì để lùi nên rơi về `fallbackTo`, tránh việc
 * `navigate(-1)` đẩy khách ra khỏi app.
 */
export default function BackLink({ fallbackTo, label, className }: BackLinkProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('common');

  const handleBack = () => {
    // `idx` do react-router gắn vào history state: 0 = entry đầu tiên của phiên ⇒ không có gì để lùi.
    const idx = (location.state as { idx?: number } | null)?.idx;
    const canGoBack = typeof idx === 'number' ? idx > 0 : window.history.length > 1;
    if (canGoBack) navigate(-1);
    else navigate(fallbackTo ?? '/');
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={cn(
        'mb-4 -ml-2 flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        className
      )}
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      {label ?? t('back')}
    </button>
  );
}
