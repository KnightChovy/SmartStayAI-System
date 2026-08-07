/**
 * Hằng số đường dẫn toàn ứng dụng. Dùng thay vì hardcode string ở mọi nơi
 * (Link, navigate, route config) để đổi path một chỗ là xong.
 */
import { UserRole } from './roles';

export const ROUTES = {
  // Guest / public
  home: '/',
  search: '/search',
  hotelDetail: (hotelId: string = ':hotelId') => `/hotels/${hotelId}`,
  /** Chi tiết một loại phòng (`GET /hotels/:hotelId/room-types/:roomTypeId`). */
  roomTypeDetail: (hotelId: string = ':hotelId', roomTypeId: string = ':roomTypeId') =>
    `/hotels/${hotelId}/rooms/${roomTypeId}`,
  destinations: '/destinations',
  deals: '/deals',
  // Landing "List your property" — mời chủ khách sạn đăng ký làm Hotel Partner
  listYourProperty: '/list-your-property',
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
  // Đăng ký tài khoản Hotel Partner (khác với đăng ký user thường)
  partnerSignup: '/partner-signup',
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
  partnerRefunds: '/partner/refunds',
  partnerCommission: '/partner/commission',
  partnerWallet: '/partner/wallet',
  partnerProfile: '/partner/profile',

  // Cổng Platform Manager
  managerRefunds: '/manager/refunds',
  managerCommission: '/manager/commission',
  managerProfile: '/manager/profile',

  // Cổng nhân viên (staff — lễ tân / housekeeping)
  staffSelectHotel: '/staff/select-hotel',
  staffDashboard: '/staff/dashboard',
  staffFrontDesk: '/staff/front-desk',
  staffBookingDetail: (bookingId: string = ':bookingId') => `/staff/front-desk/${bookingId}`,
  staffChat: '/staff/chat',
  staffHousekeeping: '/staff/housekeeping',
  staffRooms: '/staff/rooms',
  /** Lịch tồn kho theo ngày — khác Room map (bảng vận hành của hôm nay). */
  staffInventory: '/staff/inventory',

  // Account (customer, cần đăng nhập)
  account: '/account',
  accountProfile: '/account/profile',
  accountBookings: '/account/bookings',
  accountBookingDetail: (bookingId: string = ':bookingId') => `/account/bookings/${bookingId}`,
  accountWallet: '/account/wallet',
  accountMessages: '/account/messages',
  accountReviews: '/account/reviews',
  accountNotifications: '/account/notifications',
  accountSettings: '/account/settings',
} as const;

/**
 * Đường dẫn trang Profile theo cổng của từng role (mỗi cổng render chung
 * `CommonProfilePage`). Role chưa có cổng riêng → về account profile.
 */
export function getProfilePathForRole(role?: string | null): string {
  switch (role) {
    case UserRole.HOTEL_PARTNER:
      return ROUTES.partnerProfile;
    case UserRole.PLATFORM_MANAGER:
      return ROUTES.managerProfile;
    default:
      return ROUTES.accountProfile;
  }
}
