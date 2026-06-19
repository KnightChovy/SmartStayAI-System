import { Navigate, type RouteObject } from 'react-router';
import { StaffLayout } from '@/components/staff/StaffLayout';
import { RequireStaffHotel } from '@/components/staff/RequireStaffHotel';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { UserRole } from '@/constants/roles';
import SelectHotelPage from '@/pages/staff/SelectHotelPage';
import StaffDashboardPage from '@/pages/staff/StaffDashboardPage';
import FrontDeskPage from '@/pages/staff/FrontDeskPage';
import BookingDetailPage from '@/pages/staff/BookingDetailPage';
import HousekeepingPage from '@/pages/staff/HousekeepingPage';
import RoomsPage from '@/pages/staff/RoomsPage';

/** Cổng nhân viên (`/staff`) — chỉ role `staff`. */
export const staffRoutes: RouteObject[] = [
  {
    element: <ProtectedRoute allowedRoles={[UserRole.STAFF]} />,
    children: [
      {
        path: 'staff',
        element: <StaffLayout />,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          // Chọn khách sạn đang trực (không cần đã chọn hotel)
          { path: 'select-hotel', element: <SelectHotelPage /> },
          // Các màn vận hành — bắt buộc đã chọn khách sạn
          {
            element: <RequireStaffHotel />,
            children: [
              { path: 'dashboard', element: <StaffDashboardPage /> },
              { path: 'front-desk', element: <FrontDeskPage /> },
              { path: 'front-desk/:bookingId', element: <BookingDetailPage /> },
              { path: 'housekeeping', element: <HousekeepingPage /> },
              { path: 'rooms', element: <RoomsPage /> },
            ],
          },
        ],
      },
    ],
  },
];
