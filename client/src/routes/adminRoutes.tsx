import { Navigate, type RouteObject } from 'react-router';
import { AdminShellPage } from '@/pages/admin/AdminShellPage';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminPropertiesPage } from '@/pages/admin/AdminPropertiesPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { AdminPaymentsPage } from '@/pages/admin/AdminPaymentsPage';
import { AdminBookingsPage } from '@/pages/admin/AdminBookingsPage';
import { AdminAnalyticsPage } from '@/pages/admin/AdminAnalyticsPage';
import { AdminRevenuePage } from '@/pages/admin/AdminRevenuePage';
import { AdminAiSettingsPage } from '@/pages/admin/AdminAiSettingsPage';
import { AdminSystemPage } from '@/pages/admin/AdminSystemPage';
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { UserRole } from '@/constants/roles';

/** Cổng Admin (`/admin`) — role `admin` và `platform_manager`. */
export const adminRoutes: RouteObject[] = [
  {
    element: (
      <ProtectedRoute
        allowedRoles={[UserRole.ADMIN, UserRole.PLATFORM_MANAGER]}
      />
    ),
    children: [
      {
        path: 'admin',
        element: <AdminShellPage />,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: 'dashboard', element: <AdminDashboardPage /> },
          { path: 'properties', element: <AdminPropertiesPage /> },
          { path: 'users', element: <AdminUsersPage /> },
          { path: 'payments', element: <AdminPaymentsPage /> },
          { path: 'revenue', element: <AdminRevenuePage /> },
          { path: 'bookings', element: <AdminBookingsPage /> },
          { path: 'analytics', element: <AdminAnalyticsPage /> },
          { path: 'ai-settings', element: <AdminAiSettingsPage /> },
          { path: 'system', element: <AdminSystemPage /> },
          { path: 'settings', element: <AdminSettingsPage /> },
        ],
      },
    ],
  },
];
