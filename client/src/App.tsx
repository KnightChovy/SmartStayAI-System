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
import RoomDetail from './pages/Landing/RoomDetail';
import BookingInformation from './pages/Landing/BookingInformation';
import { AdminShellPage } from './pages/Admin/AdminShellPage';
import { AdminAnalyticsPage } from './pages/Admin/AdminAnalyticsPage';
import { AdminBookingsPage } from './pages/Admin/AdminBookingsPage';
import { AdminPropertiesPage } from './pages/Admin/AdminPropertiesPage';
import { AdminUsersPage } from './pages/Admin/AdminUsersPage';
import { AdminDashboardPage } from './pages/Admin/AdminDashboardPage';

function App() {
  return (
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
      <Route path="admin" element={<AdminShellPage />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="properties" element={<AdminPropertiesPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="bookings" element={<AdminBookingsPage />} />
        <Route path="analytics" element={<AdminAnalyticsPage />} />
        <Route path="settings" element={<AdminAnalyticsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
