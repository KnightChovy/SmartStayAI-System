/**
 * Ghép các phần địa chỉ thành một chuỗi, khử rỗng và khử trùng lặp.
 *
 * Bối cảnh: trường `address` từ DB thường đã chứa sẵn cả ward/city/province, nhưng UI lại
 * join thêm các field rời (district, city, country) phía sau → địa chỉ bị lặp
 * (vd "…, Phường 10, …, Tỉnh Lâm Đồng, Phường 10, Tỉnh Lâm Đồng, Vietnam").
 *
 * Hàm này bỏ qua một segment nếu nó đã nằm trong (hoặc trùng) một segment đã thêm trước đó,
 * so sánh không phân biệt hoa/thường và bỏ khoảng trắng thừa.
 */
export function formatAddress(
  ...parts: Array<string | null | undefined>
): string {
  const segments: string[] = [];

  for (const raw of parts) {
    const part = raw?.trim().replace(/\s+/g, ' ');
    if (!part) continue;

    const lower = part.toLowerCase();
    const isDuplicate = segments.some(s => {
      const existing = s.toLowerCase();
      return existing === lower || existing.includes(lower);
    });
    if (isDuplicate) continue;

    segments.push(part);
  }

  return segments.join(', ');
}
