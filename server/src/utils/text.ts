/**
 * Bỏ dấu tiếng Việt để so khớp không phân biệt dấu ("da nang" khớp "Đà Nẵng").
 * NFD tách dấu ra khỏi chữ rồi xoá; đ/Đ không tách được nên map tay.
 */
export const removeAccent = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();

/**
 * `needle` có nằm trong `haystack` không, khi bỏ qua CẢ dấu lẫn HOA/thường.
 *
 * Dùng thay cho `contains` + `mode: 'insensitive'` của Prisma ở những chỗ người dùng tự gõ tên
 * tiếng Việt (thành phố, tên khách sạn): `mode: 'insensitive'` chỉ bỏ qua HOA/thường, KHÔNG bỏ qua
 * dấu — nên "Đà Nẵng" không khớp dữ liệu lưu là "Da Nang" và tìm ra 0 kết quả.
 */
export const includesAccentInsensitive = (haystack: string, needle: string): boolean =>
  removeAccent(haystack).includes(removeAccent(needle));
