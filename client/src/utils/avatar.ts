/**
 * Avatar dạng chữ cái đầu, sinh tại chỗ dưới dạng data-URI SVG — không phụ thuộc ảnh
 * ngoài/BE (BE chưa lưu avatar cho review). Màu nền suy ra từ tên nên ổn định giữa các lần render.
 */
export function initialsAvatar(name: string): string {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .map(w => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?';

  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;

  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'>` +
    `<rect width='80' height='80' rx='40' fill='hsl(${hue} 60% 52%)'/>` +
    `<text x='50%' y='50%' dy='.35em' text-anchor='middle' ` +
    `font-family='system-ui, sans-serif' font-size='32' font-weight='600' fill='white'>${initials}</text>` +
    `</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
