/**
 * Lấy message lỗi do BE trả về (nằm ở `response.data`) mà không dùng `any`.
 * Chỉ đọc payload từ server — KHÔNG dùng `error.message` của axios/JS (vd "Network Error",
 * "Request failed with status code 400") để tránh lộ thông báo kỹ thuật cho người dùng;
 * khi không có message từ BE thì dùng `fallback` thân thiện.
 */
export function errorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const data = (err as { response?: { data?: unknown } }).response?.data;
    return pickMessage(data) ?? fallback;
  }
  return fallback;
}

/** Rút `message` từ body lỗi của BE ở các hình dạng phổ biến (object, mảng, hoặc chuỗi JSON). */
function pickMessage(data: unknown): string | undefined {
  if (!data) {
    return undefined;
  }
  // BE có thể trả body lỗi dạng chuỗi JSON chưa parse → thử parse, không được thì coi như message thuần
  if (typeof data === 'string') {
    try {
      return pickMessage(JSON.parse(data));
    } catch {
      return data.trim() ? data : undefined;
    }
  }
  if (typeof data === 'object') {
    const obj = data as { message?: unknown; error?: unknown };
    if (typeof obj.message === 'string' && obj.message.trim()) {
      return obj.message;
    }
    // Một số API bọc message trong mảng (vd validation)
    if (Array.isArray(obj.message) && typeof obj.message[0] === 'string') {
      return obj.message[0];
    }
    if (typeof obj.error === 'string' && obj.error.trim()) {
      return obj.error;
    }
  }
  return undefined;
}
