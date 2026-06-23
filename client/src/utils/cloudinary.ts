/**
 * Helpers cho file lưu trên Cloudinary.
 *
 * Bối cảnh: backend upload bằng `resource_type: 'auto'` nên file PDF được Cloudinary
 * xếp vào resource `image` và trả URL dạng `/image/upload/.../file.pdf`. Mặc định
 * Cloudinary CHẶN delivery file PDF/ZIP (trả 401 "restricted access") → bấm xem ra
 * trang lỗi, "link cloudinary không xem được".
 *
 * Cách xử lý phía FE: với URL PDF của Cloudinary, sinh ra URL ảnh JPG đã rasterize
 * (trang đầu) bằng transformation `pg_1,f_jpg` — ảnh derived KHÔNG bị chặn nên xem
 * được ngay trong app. Muốn xem/tải full file gốc nhiều trang thì cần bật
 * "Allow delivery of PDF and ZIP files" trong Cloudinary (Settings → Security).
 */

const CLOUDINARY_IMAGE_UPLOAD = /\/image\/upload\//i;

/** URL có phải file PDF không (theo đuôi, bỏ qua query string). */
export function isPdfUrl(url: string | null | undefined): boolean {
  return !!url && /\.pdf(\?.*)?$/i.test(url);
}

/** URL có thuộc Cloudinary không. */
export function isCloudinaryUrl(url: string | null | undefined): boolean {
  return !!url && /res\.cloudinary\.com/i.test(url);
}

/**
 * Trả URL ảnh xem được cho file PDF của Cloudinary (rasterize trang `page` → JPG).
 * Với mọi URL khác (ảnh thường, không phải Cloudinary) trả nguyên URL gốc.
 */
export function cloudinaryPdfPreview(url: string, page = 1): string {
  if (!isPdfUrl(url) || !CLOUDINARY_IMAGE_UPLOAD.test(url)) return url;
  return url
    .replace(CLOUDINARY_IMAGE_UPLOAD, `/image/upload/pg_${page},f_jpg,q_auto/`)
    .replace(/\.pdf(\?.*)?$/i, '.jpg$1');
}

/**
 * URL buộc tải xuống (đính kèm) cho file Cloudinary. Hữu ích khi không xem inline được.
 * Lưu ý: nếu account vẫn chặn delivery PDF gốc thì link này cũng bị chặn — khi đó dùng
 * bản preview JPG ở trên để xem.
 */
export function cloudinaryDownloadUrl(url: string): string {
  if (!isCloudinaryUrl(url)) return url;
  return url.replace(/\/(image|raw|video)\/upload\//i, '/$1/upload/fl_attachment/');
}
