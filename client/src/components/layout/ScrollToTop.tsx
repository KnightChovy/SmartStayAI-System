import { useEffect } from 'react';
import { useLocation } from 'react-router';

/**
 * Đưa trang về đầu mỗi khi đổi route (react-router không tự reset scroll).
 * Đặt bên trong Layout để áp dụng cho mọi trang con.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}
