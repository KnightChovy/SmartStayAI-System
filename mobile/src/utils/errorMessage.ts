/**
 * Lấy message lỗi backend trả về mà không dùng `any` (AGENTS §5.1).
 * Backend gửi `{ message }` trong body lỗi; không có thì dùng `fallback`.
 */
export function errorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const resp = (err as { response?: { data?: { message?: string } } }).response;
    return resp?.data?.message ?? fallback;
  }
  return fallback;
}
