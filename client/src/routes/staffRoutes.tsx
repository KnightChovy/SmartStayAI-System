import { Navigate, type RouteObject } from 'react-router';
import { StaffLayout } from '@/components/staff/StaffLayout';
import { RequireStaffHotel } from '@/components/staff/RequireStaffHotel';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { UserRole } from '@/constants/roles';
import SelectHotelPage from '@/pages/staff/SelectHotelPage';
import StaffDashboardPage from '@/pages/staff/StaffDashboardPage';
import FrontDeskPage from '@/pages/staff/FrontDeskPage';
import BookingDetailPage from '@/pages/staff/BookingDetailPage';
import StaffChatPage from '@/pages/staff/StaffChatPage';
import HousekeepingPage from '@/pages/staff/HousekeepingPage';
import RoomsPage from '@/pages/staff/RoomsPage';
import InventoryCalendarPage from '@/pages/staff/InventoryCalendarPage';

/** Staff portal (`/staff`) — `staff` role only. */
export const staffRoutes: RouteObject[] = [
  {
    element: <ProtectedRoute allowedRoles={[UserRole.STAFF]} />,
    children: [
      {
        path: 'staff',
        element: <StaffLayout />,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          // Select the active hotel (no prior hotel selection required)
          { path: 'select-hotel', element: <SelectHotelPage /> },
          // Operational screens — require a hotel to be selected
          {
            element: <RequireStaffHotel />,
            children: [
              { path: 'dashboard', element: <StaffDashboardPage /> },
              { path: 'front-desk', element: <FrontDeskPage /> },
              { path: 'front-desk/:bookingId', element: <BookingDetailPage /> },
              { path: 'chat', element: <StaffChatPage /> },
              { path: 'housekeeping', element: <HousekeepingPage /> },
              { path: 'rooms', element: <RoomsPage /> },
              { path: 'inventory', element: <InventoryCalendarPage /> },
            ],
          },
        ],
      },
    ],
  },
];
