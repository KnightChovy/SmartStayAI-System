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

  // Support
  helpCenter: '/help-center',
  safety: '/safety',
  cancellationOptions: '/cancellation-options',
  reportConcern: '/report-concern',

  // Company
  about: '/about',
  careers: '/careers',
  press: '/press',

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
  // Trang VNPay redirect khách về sau thanh toán (status + bookingCode trên query)
  paymentResult: '/booking/payment-result',

  // Cổng Hotel Partner
  partnerStaff: '/partner/staff',
  partnerBookings: '/partner/bookings',
  partnerAmenities: '/partner/amenities',

  // Cổng nhân viên (staff — lễ tân / housekeeping)
  staffSelectHotel: '/staff/select-hotel',
  staffDashboard: '/staff/dashboard',
  staffFrontDesk: '/staff/front-desk',
  staffBookingDetail: (bookingId: string = ':bookingId') => `/staff/front-desk/${bookingId}`,
  staffHousekeeping: '/staff/housekeeping',
  staffRooms: '/staff/rooms',

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
