/**
 * Gam màu guest — port 1:1 từ `client/src/styles/index.css` (@theme) để app khách
 * và web khách trông như một sản phẩm. Thay hẳn theme navy/gold cũ.
 *
 * Chỉ dùng các hằng hex này cho những chỗ KHÔNG nhận `className` (prop `color` của
 * icon, `placeholderTextColor`, `barStyle`, gradient…). Còn lại luôn ưu tiên token
 * NativeWind trong `tailwind.config.js` (`bg-surface`, `text-on-surface`…).
 *
 * Staff portal có theme teal riêng (`constants/staffTheme.ts`) — không đụng tới.
 */
export const GUEST_COLORS = {
  /** Nền trang (client --background). */
  canvas: '#f5f2ee',
  /** Nền thẻ — sáng hơn canvas nên khối nổi lên mà không cần đổ bóng. */
  surface: '#fcf9f8',
  surfaceLow: '#f6f3f2',
  surfaceLowest: '#ffffff',
  /** Nền chìm cho trạng thái active (chip/tab đang chọn). */
  surfaceContainer: '#f0eded',
  /** Chữ chính. */
  onSurface: '#1c1b1b',
  /** Chữ phụ / icon thứ cấp. */
  onSurfaceVariant: '#474741',
  /** Xám ấm — màu thương hiệu (client --color-primary). */
  brand: '#5f5e5b',
  onBrand: '#ffffff',
  /** Đồng — nhấn phụ (client --color-secondary). */
  bronze: '#735a35',
  bronzeContainer: '#fddaac',
  /** Vàng cao cấp — huy hiệu/sao. */
  premiumGold: '#d4af37',
  olive: '#735c00',
  /** Viền tóc mặc định của client (dùng ở alpha ~30%). */
  hairline: '#c8c7bf',
  muted: '#777771',
  danger: '#ba1a1a',
  white: '#ffffff',
} as const;

/** Placeholder ô nhập — `muted` ở client. */
export const PLACEHOLDER = GUEST_COLORS.muted;

/**
 * Bóng "premium-shadow" của client: `0 4px 20px rgba(28,27,27,0.04)` — cực nhẹ.
 * Client dựng khối bằng viền tóc + tương phản nền, gần như không đổ bóng; giữ đúng
 * tinh thần đó thay vì bê `shadow-hard-*` (bóng đậm) của theme cũ.
 */
export const PREMIUM_SHADOW = {
  shadowColor: '#1c1b1b',
  shadowOpacity: 0.04,
  shadowRadius: 20,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
} as const;

/**
 * Ảnh khách sạn dùng cho các màn auth — lấy đúng ảnh client đang dùng ở
 * `pages/auth/*` để hai nền tảng kể cùng một câu chuyện hình ảnh.
 */
export const AUTH_IMAGES = {
  /** client LoginPage — phòng khách sạn. */
  login: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=1600&auto=format&fit=crop',
  /** client RegisterPage — hồ bơi/khách sạn. */
  register: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1600&auto=format&fit=crop',
  /** client ForgotPasswordPage — nội thất khách sạn. */
  forgotPassword: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1600&auto=format&fit=crop',
  /** Màn OTP + onboarding — dùng lại ảnh resort của client. */
  verifyOtp: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=1600&auto=format&fit=crop',
} as const;

/**
 * Ảnh hero trang chủ. Client dùng ảnh phong cảnh Việt Nam từ imagevietnam.vnanet.vn,
 * nhưng đó là link nóng tới CDN báo chí (không có tham số resize, không đảm bảo uptime)
 * — trên app sẽ tốn data và dễ vỡ. Dùng ảnh resort Unsplash cùng bộ với các màn auth,
 * có `w=` để tải bản vừa màn hình.
 */
export const HOME_HERO_IMAGE =
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=1600&auto=format&fit=crop';
