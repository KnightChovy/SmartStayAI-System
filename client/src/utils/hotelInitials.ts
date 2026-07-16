/**
 * Chữ cái đầu tên khách sạn cho avatar khi KS chưa có ảnh (tối đa 2 ký tự).
 * Dùng chung cho thanh bên `/account/messages` và bộ chọn khách sạn.
 */
export const hotelInitials = (name: string): string => {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};
