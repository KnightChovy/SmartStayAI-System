/**
 * Tuỳ chọn "tự làm mới" cho các query của cổng nhân viên.
 *
 * VÌ SAO CẦN: dữ liệu vận hành đổi từ **bên ngoài trình duyệt của lễ tân** — khách đặt/huỷ phòng
 * trên web hoặc app, nhân viên khác chặn phòng ở máy khác. Những việc đó không chạy mutation nào ở
 * máy này nên **không có gì invalidate cache**, mà `main.tsx` lại tắt `refetchOnWindowFocus` cho
 * toàn app ⇒ quay lại tab cũng không tải lại. Không có mấy tuỳ chọn này thì lễ tân phải **F5 mới
 * biết có đơn mới**.
 */
export interface StaffLiveOptions {
  /** Nhịp tự tải lại (ms). `refetchIntervalInBackground` mặc định false nên tab ẩn thì KHÔNG chạy. */
  refetchInterval?: number;
  /** Ghi đè `refetchOnWindowFocus: false` của app cho riêng query này. */
  refetchOnWindowFocus?: boolean;
}

/**
 * Nhịp làm mới cho màn hình mở lâu. 60 giây: đủ nhanh để lễ tân thấy đơn mới trong lúc trực, đủ
 * chậm để không dội request (lịch tồn kho tải booking theo nhiều trang).
 */
export const STAFF_LIVE: StaffLiveOptions = {
  refetchInterval: 60_000,
  refetchOnWindowFocus: true,
};
