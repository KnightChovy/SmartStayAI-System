import { Navigate, type RouteObject } from 'react-router';
import { HotelPartnerLayout } from '@/components/hotel-partner/HotelPartnerLayout';
import DashboardPage from '@/pages/hotel-partner/dashboard/DashboardPage';
import VerifyHotelPage from '@/pages/hotel-partner/hotel-verify/VerifyHotelPage';
import HotelsPage from '@/pages/hotel-partner/hotel-management/HotelsPage';
import HotelDetailPage from '@/pages/hotel-partner/hotel-management/HotelDetailPage';
import RoomInventoryPage from '@/pages/hotel-partner/room-inventory/RoomInventoryPage';
import StaffManagementPage from '@/pages/hotel-partner/staff/StaffManagementPage';
import BookingsPage from '@/pages/hotel-partner/bookings/BookingsPage';
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
          { path: 'staff', element: <StaffManagementPage /> },
          { path: 'bookings', element: <BookingsPage /> },
        ],
      },
    ],
  },
];
