/**
 * Hằng số đường dẫn toàn ứng dụng. Dùng thay vì hardcode string ở mọi nơi
 * (Link, navigate, route config) để đổi path một chỗ là xong.
 */
export const ROUTES = {
  // Guest / public
  home: '/',
  search: '/search',
  hotelDetail: (hotelId: string = ':hotelId') => `/hotels/${hotelId}`,
  destinations: '/destinations',
  deals: '/deals',
  accommodationTypes: '/accommodation-types',
  blog: '/blog',
  blogDetail: (slug: string = ':slug') => `/blog/${slug}`,

  // Auth
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  verifyEmail: '/verify-email',
  verifyIdentity: '/verify-identity',

  // Booking flow
  booking: '/booking',
  bookingSuccess: (bookingId: string = ':bookingId') => `/booking/${bookingId}/success`,

  // Account (customer, cần đăng nhập)
  account: '/account',
  accountProfile: '/account/profile',
  accountBookings: '/account/bookings',
  accountBookingDetail: (bookingId: string = ':bookingId') => `/account/bookings/${bookingId}`,
  accountReviews: '/account/reviews',
  accountLoyalty: '/account/loyalty',
  accountVouchers: '/account/vouchers',
  accountNotifications: '/account/notifications',
  accountSettings: '/account/settings',
} as const;
