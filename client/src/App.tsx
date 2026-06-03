import { Navigate, Route, Routes } from 'react-router';
import Layout from './components/layout/Layout';
import Home from './pages/Landing/Home';
import Destinations from './pages/Landing/Destinations';
import Deals from './pages/Landing/Deals';
import AccommodationTypesPage from './pages/Landing/AccommodationTypes';
import Register from './pages/Auth/Register';
import Login from './pages/Auth/Login';
import ForgotPassword from './pages/Auth/ForgotPassword';
import VerifyIdentity from './pages/Auth/VerifyIdentity';
import ResetPassword from './pages/Auth/ResetPassword';
import VerifyEmail from './pages/Auth/VerifyEmail';
import RoomDetail from './pages/Landing/RoomDetail';
import BookingInformation from './pages/Landing/BookingInformation';
import { AdminShellPage } from './pages/Admin/AdminShellPage';
import { AdminAiSettingsPage } from './pages/Admin/AdminAiSettingsPage';
import { AdminAnalyticsPage } from './pages/Admin/AdminAnalyticsPage';
import { AdminBookingsPage } from './pages/Admin/AdminBookingsPage';
import { AdminPropertiesPage } from './pages/Admin/AdminPropertiesPage';
import { AdminPaymentsPage } from './pages/Admin/AdminPaymentsPage';
import { AdminUsersPage } from './pages/Admin/AdminUsersPage';
import { AdminDashboardPage } from './pages/Admin/AdminDashboardPage';
import { AdminSettingsPage } from './pages/Admin/AdminSettingsPage';
import { AdminSystemPage } from './pages/Admin/AdminSystemPage';
import DashboardPage from './pages/hotel-partner/dashboard/DashboardPage';
import { HotelPartnerLayout } from './components/hotel-partner/HotelPartnerLayout';
import { TooltipProvider } from './components/ui/tooltip';
import VerifyHotelPage from './pages/hotel-partner/hotel-verify/VerifyHotelPage';

function App() {
  return (
    <TooltipProvider>
      <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="destinations" element={<Destinations />} />
        <Route path="deals" element={<Deals />} />
        <Route
          path="accommodation-types"
          element={<AccommodationTypesPage />}
        />
        <Route path="room/executive-penthouse" element={<RoomDetail />} />
        <Route path="booking-information" element={<BookingInformation />} />
      </Route>
      <Route path="register" element={<Register />} />
      <Route path="login" element={<Login />} />
      <Route path="forgot-password" element={<ForgotPassword />} />
      <Route path="verify-identity" element={<VerifyIdentity />} />
      <Route path="reset-password" element={<ResetPassword />} />
      <Route path="verify-email" element={<VerifyEmail />} />

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
