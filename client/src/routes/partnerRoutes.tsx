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
import { CommonProfilePage } from '@/common/profile/CommonProfilePage';
import ComingSoonPage from '@/pages/ComingSoonPage';
import NotFoundPage from '@/pages/NotFoundPage';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { UserRole } from '@/constants/roles';

/** Cổng Hotel Partner (`/partner`) — chỉ role `hotel_partner`. */
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
          // Đã có trong sidebar nhưng chưa triển khai — tạm dùng "Coming soon" để tránh link chết.
          { path: 'revenue', element: <ComingSoonPage title="Revenue" /> },
          { path: 'analytics', element: <ComingSoonPage title="Analytics" /> },
          { path: 'reviews', element: <ComingSoonPage title="Reviews" /> },
          { path: 'settings', element: <ComingSoonPage title="Settings" /> },
          // Catch-all trong PartnerLayout: URL sai vẫn giữ sidebar thay vì rớt về layout guest.
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
];
