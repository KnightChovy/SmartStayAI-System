/**
 * Query keys RIÊNG của dashboard.
 *
 * Chỉ còn `search` — các hook dashboard khác giờ đều gộp từ hook thật của domain khác
 * (`hooks/admin`, `hooks/platform-manager`, `hooks/analytics`, `hooks/manager`) và dùng
 * query key của chính domain đó. Nhờ vậy cache được CHIA SẺ: dashboard mở `/admin/revenue`
 * cho một range, trang Revenue mở đúng range đó thì ăn luôn cache, không gọi lại.
 */
export const dashboardKeys = {
  search: (q: string) => ['dashboard', 'search', q] as const,
};
