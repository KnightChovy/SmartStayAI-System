import { Navigate, Route, Routes } from 'react-router';
import Layout from './components/layout/Layout';
import HomePage from './pages/guest/HomePage';
import DestinationsPage from './pages/guest/DestinationsPage';
import DealsPage from './pages/guest/DealsPage';
import AccommodationTypesPage from './pages/guest/AccommodationTypesPage';
import RegisterPage from './pages/auth/RegisterPage';
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import VerifyIdentityPage from './pages/auth/VerifyIdentityPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import RoomDetailPage from './pages/guest/RoomDetailPage';
import BookingInformationPage from './pages/guest/BookingInformationPage';
import { AdminShellPage } from './pages/admin/AdminShellPage';
import { AdminAiSettingsPage } from './pages/admin/AdminAiSettingsPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { AdminBookingsPage } from './pages/admin/AdminBookingsPage';
import { AdminPropertiesPage } from './pages/admin/AdminPropertiesPage';
import { AdminPaymentsPage } from './pages/admin/AdminPaymentsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminSystemPage } from './pages/admin/AdminSystemPage';
import DashboardPage from './pages/hotel-partner/dashboard/DashboardPage';
import { HotelPartnerLayout } from './components/hotel-partner/HotelPartnerLayout';
import { TooltipProvider } from './components/ui/tooltip';
import VerifyHotelPage from './pages/hotel-partner/hotel-verify/VerifyHotelPage';

function App() {
  return (
    <TooltipProvider>
      <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="destinations" element={<DestinationsPage />} />
        <Route path="deals" element={<DealsPage />} />
        <Route
          path="accommodation-types"
          element={<AccommodationTypesPage />}
        />
        <Route path="room/executive-penthouse" element={<RoomDetailPage />} />
        <Route path="booking-information" element={<BookingInformationPage />} />
      </Route>
      <Route path="register" element={<RegisterPage />} />
      <Route path="login" element={<LoginPage />} />
      <Route path="forgot-password" element={<ForgotPasswordPage />} />
      <Route path="verify-identity" element={<VerifyIdentityPage />} />
      <Route path="reset-password" element={<ResetPasswordPage />} />
      <Route path="verify-email" element={<VerifyEmailPage />} />

      <Route path="partner" element={<HotelPartnerLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="verify" element={<VerifyHotelPage />} />
      </Route>

      <Route path="admin" element={<AdminShellPage />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="properties" element={<AdminPropertiesPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="payments" element={<AdminPaymentsPage />} />
        <Route path="bookings" element={<AdminBookingsPage />} />
        <Route path="analytics" element={<AdminAnalyticsPage />} />
        <Route path="ai-settings" element={<AdminAiSettingsPage />} />
        <Route path="system" element={<AdminSystemPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>
    </Routes>
    </TooltipProvider>
  );
}

export default App;
