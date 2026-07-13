import { Navigate, type RouteObject } from 'react-router';
import { HotelPartnerLayout } from '@/components/hotel-partner/HotelPartnerLayout';
import DashboardPage from '@/pages/hotel-partner/dashboard/DashboardPage';
import VerifyHotelPage from '@/pages/hotel-partner/hotel-verify/VerifyHotelPage';
import HotelsPage from '@/pages/hotel-partner/hotel-management/HotelsPage';
import HotelDetailPage from '@/pages/hotel-partner/hotel-management/HotelDetailPage';
import RoomInventoryPage from '@/pages/hotel-partner/room-inventory/RoomInventoryPage';
import AmenitiesPage from '@/pages/hotel-partner/amenities/AmenitiesPage';
import StaffManagementPage from '@/pages/hotel-partner/staff/StaffManagementPage';
import BookingsPage from '@/pages/hotel-partner/bookings/BookingsPage';
import RevenuePage from '@/pages/hotel-partner/revenue/RevenuePage';
import AnalyticsPage from '@/pages/hotel-partner/analytics/AnalyticsPage';
import ReviewsPage from '@/pages/hotel-partner/reviews/ReviewsPage';
import { CommonProfilePage } from '@/common/profile/CommonProfilePage';
import ComingSoonPage from '@/pages/ComingSoonPage';
import NotFoundPage from '@/pages/NotFoundPage';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { UserRole } from '@/constants/roles';

export const partnerRoutes: RouteObject[] = [
  {
    element: <ProtectedRoute allowedRoles={[UserRole.HOTEL_PARTNER]} />,
    children: [
      {
        path: 'partner',
        element: <HotelPartnerLayout />,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'verify', element: <VerifyHotelPage /> },
          { path: 'hotel-management', element: <HotelsPage /> },
          { path: 'hotel-management/:hotelId', element: <HotelDetailPage /> },
          { path: 'room-inventory', element: <RoomInventoryPage /> },
          { path: 'amenities', element: <AmenitiesPage /> },
          { path: 'staff', element: <StaffManagementPage /> },
          { path: 'bookings', element: <BookingsPage /> },
          { path: 'profile', element: <CommonProfilePage /> },
          { path: 'revenue', element: <RevenuePage /> },
          { path: 'analytics', element: <AnalyticsPage /> },
          { path: 'reviews', element: <ReviewsPage /> },
          // Đã có trong sidebar nhưng chưa triển khai — tạm dùng "Coming soon" để tránh link chết.
          { path: 'settings', element: <ComingSoonPage title="Settings" /> },

          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
];
