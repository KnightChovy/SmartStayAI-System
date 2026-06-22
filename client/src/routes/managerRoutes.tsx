import { Navigate, type RouteObject } from 'react-router';
import { ManagerLayout } from '@/components/manager/ManagerLayout';
import ManagerDashboardPage from '@/pages/manager/dashboard/DashboardPage';
import VerificationRequestsPage from '@/pages/manager/verification/VerificationRequestsPage';
import HotelPartnersPage from '@/pages/manager/hotel-partners/HotelPartnersPage';
import RevenuePage from '@/pages/manager/revenue/RevenuePage';
import AnalyticsPage from '@/pages/manager/analytics/AnalyticsPage';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { UserRole } from '@/constants/roles';

/** Cổng Platform Manager (`/manager`) — chỉ role `platform_manager`. */
export const managerRoutes: RouteObject[] = [
  {
    element: <ProtectedRoute allowedRoles={[UserRole.PLATFORM_MANAGER]} />,
    children: [
      {
        path: 'manager',
        element: <ManagerLayout />,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: 'dashboard', element: <ManagerDashboardPage /> },
          { path: 'verification', element: <VerificationRequestsPage /> },
          { path: 'hotel-partners', element: <HotelPartnersPage /> },
          { path: 'revenue', element: <RevenuePage /> },
          { path: 'analytics', element: <AnalyticsPage /> },
        ],
      },
    ],
  },
];
