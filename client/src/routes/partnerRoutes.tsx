import { Navigate, type RouteObject } from 'react-router';
import { HotelPartnerLayout } from '@/components/hotel-partner/HotelPartnerLayout';
import DashboardPage from '@/pages/hotel-partner/dashboard/DashboardPage';
import VerifyHotelPage from '@/pages/hotel-partner/hotel-verify/VerifyHotelPage';
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
        ],
      },
    ],
  },
];
