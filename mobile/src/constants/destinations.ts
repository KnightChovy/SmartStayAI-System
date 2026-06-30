/**
 * Điểm đến nổi bật hiển thị trên trang chủ (mobile).
 * `city` khớp với param `GET /hotels?city=` để bấm vào lọc đúng thành phố.
 */
export interface Destination {
  id: string;
  name: string;
  /** Giá trị gửi sang Search (`?city=`). */
  city: string;
  /** Mô tả phụ ngắn. */
  tagline: string;
  image: string;
}

export const DESTINATIONS: Destination[] = [
  {
    id: 'da-nang',
    name: 'Đà Nẵng',
    city: 'Đà Nẵng',
    tagline: 'Beaches & bridges',
    image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600&q=80',
  },
  {
    id: 'ha-long',
    name: 'Hạ Long',
    city: 'Hạ Long',
    tagline: 'Limestone bay',
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=600&q=80',
  },
  {
    id: 'hoi-an',
    name: 'Hội An',
    city: 'Hội An',
    tagline: 'Lantern old town',
    image: 'https://images.unsplash.com/photo-1535941339077-2dd1c7963098?w=600&q=80',
  },
  {
    id: 'hue',
    name: 'Huế',
    city: 'Huế',
    tagline: 'Imperial city',
    image: 'https://images.unsplash.com/photo-1602002418816-5c0aeef426aa?w=600&q=80',
  },
  {
    id: 'phu-quoc',
    name: 'Phú Quốc',
    city: 'Phú Quốc',
    tagline: 'Island paradise',
    image: 'https://images.unsplash.com/photo-1540202404-a2f29016b523?w=600&q=80',
  },
  {
    id: 'sa-pa',
    name: 'Sa Pa',
    city: 'Sa Pa',
    tagline: 'Mountain terraces',
    image: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=600&q=80',
  },
];
