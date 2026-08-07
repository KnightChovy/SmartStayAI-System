import { useState } from 'react';

export interface ClientPagination<T> {
  /** Trang đang xem (đã kẹp trong khoảng hợp lệ). */
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  /** Phần tử của riêng trang hiện tại. */
  pageItems: T[];
  /** Số thứ tự 1-based của phần tử đầu trang (0 khi rỗng) — để hiện "Showing 1–10 of 24". */
  from: number;
  /** Số thứ tự của phần tử cuối trang. */
  to: number;
  total: number;
}

/**
 * Phân trang phía CLIENT cho danh sách đã tải sẵn.
 *
 * Vì sao không phân trang server ở khu Hotel Partners: các chip lọc đếm số theo **toàn bộ**
 * danh sách (`all: 12 · approved: 9 · pending: 2 …`) và ô tìm kiếm cũng lọc trên toàn bộ —
 * chuyển sang `page`/`limit` của backend thì mọi con số đó tụt xuống chỉ còn đếm trang đang
 * mở, và gõ tìm kiếm chỉ tìm được trong 10 dòng trước mắt. Danh sách đã giới hạn ở 100 dòng
 * nên cắt trang tại chỗ là đủ và giữ nguyên ý nghĩa bộ lọc.
 *
 * Trang hiện tại được **kẹp trong lúc render**, không sửa bằng effect: lọc cho danh sách ngắn
 * lại khi đang đứng ở trang cuối thì tự lùi về trang hợp lệ thay vì hiện một trang trắng.
 */
export function useClientPagination<T>(
  items: T[],
  pageSize: number
): ClientPagination<T> {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  const start = (current - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  return {
    page: current,
    setPage,
    totalPages,
    pageItems,
    from: items.length === 0 ? 0 : start + 1,
    to: start + pageItems.length,
    total: items.length,
  };
}
