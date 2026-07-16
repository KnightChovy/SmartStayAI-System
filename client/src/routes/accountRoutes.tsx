import { Navigate, type RouteObject } from 'react-router';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import AccountLayout from '@/pages/account/AccountLayout';
import ProfilePage from '@/pages/account/ProfilePage';
import MyBookingsPage from '@/pages/account/MyBookingsPage';
import BookingDetailPage from '@/pages/account/BookingDetailPage';
import MessagesPage from '@/pages/account/MessagesPage';
import MyReviewsPage from '@/pages/account/MyReviewsPage';
import LoyaltyPage from '@/pages/account/LoyaltyPage';
import MyVouchersPage from '@/pages/account/MyVouchersPage';
import NotificationsPage from '@/pages/account/NotificationsPage';
import AccountSettingsPage from '@/pages/account/AccountSettingsPage';

/**
 * Khu tài khoản customer (`/account`). Chỉ cần đăng nhập (không giới hạn role),
 * lồng trong Layout guest qua guestRoutes.
 */
export const accountRoute: RouteObject = {
  element: <ProtectedRoute />,
  children: [
    {
      path: 'account',
      element: <AccountLayout />,
      children: [
        { index: true, element: <Navigate to="profile" replace /> },
        { path: 'profile', element: <ProfilePage /> },
        { path: 'bookings', element: <MyBookingsPage /> },
        { path: 'bookings/:bookingId', element: <BookingDetailPage /> },
        { path: 'messages', element: <MessagesPage /> },
        { path: 'reviews', element: <MyReviewsPage /> },
        { path: 'loyalty', element: <LoyaltyPage /> },
        { path: 'vouchers', element: <MyVouchersPage /> },
        { path: 'notifications', element: <NotificationsPage /> },
        { path: 'settings', element: <AccountSettingsPage /> },
      ],
    },
  ],
};
