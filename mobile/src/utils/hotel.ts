/** Helper rút gọn dữ liệu khách sạn từ API về dạng dùng cho UI. */

interface ImageLike {
  url: string;
  isPrimary?: boolean | null;
}

interface LocationLike {
  district?: string | null;
  ward?: string | null;
  city: string;
}

/** Lấy URL ảnh primary (hoặc ảnh đầu tiên) trong danh sách ảnh; undefined nếu rỗng. */
export function getPrimaryImageUrl(images?: ImageLike[]): string | undefined {
  if (!images || images.length === 0) return undefined;
  return (images.find((i) => i.isPrimary) ?? images[0]).url;
}

/** Ghép địa chỉ ngắn gọn: "Quận/Phường, Thành phố". */
export function getHotelLocation(hotel: LocationLike): string {
  return [hotel.district ?? hotel.ward, hotel.city].filter(Boolean).join(', ');
}

/** Lấy 2 chữ cái viết tắt từ tên (cho avatar). */
export function getInitials(name?: string | null): string {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(-2)
    .join('')
    .toUpperCase();
}
