/**
 * Helper lưu mock data vào localStorage để thao tác (thêm/sửa/đánh dấu)
 * có hiệu lực giữa các lần tải trang. Dùng cho các domain backend CHƯA có API
 * (loyalty, notifications, reviews, profile mở rộng, promotions).
 *
 * Khi backend có endpoint thật, chỉ cần thay thân hàm trong service tương ứng
 * — UI và hook không phải sửa.
 */
const PREFIX = 'smartstay-mock:';

export function readMock<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeMock<T>(key: string, value: T): T {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* bỏ qua lỗi quota */
  }
  return value;
}

/** Giả lập độ trễ mạng cho cảm giác thật. */
export function delay<T>(value: T, ms = 250): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(value), ms));
}
