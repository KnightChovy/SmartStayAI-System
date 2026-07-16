import type { RouteObject } from 'react-router';
import Layout from '@/components/layout/Layout';
import HomePage from '@/pages/guest/HomePage';
import DestinationsPage from '@/pages/guest/DestinationsPage';
import DealsPage from '@/pages/guest/DealsPage';
import PartnerLandingPage from '@/pages/guest/PartnerLandingPage';
import BookingInformationPage from '@/pages/guest/BookingInformationPage';
import SearchResultsPage from '@/pages/guest/SearchResultsPage';
import HotelDetailPage from '@/pages/guest/HotelDetailPage';
import BookingCheckoutPage from '@/pages/guest/BookingCheckoutPage';
import BookingSuccessPage from '@/pages/guest/BookingSuccessPage';
import PaymentResultPage from '@/pages/guest/PaymentResultPage';
import HelpCenterPage from '@/pages/guest/HelpCenterPage';
import SafetyInformationPage from '@/pages/guest/SafetyInformationPage';
import CancellationOptionsPage from '@/pages/guest/CancellationOptionsPage';
import ReportConcernPage from '@/pages/guest/ReportConcernPage';
import AboutUsPage from '@/pages/guest/AboutUsPage';
import CareersPage from '@/pages/guest/CareersPage';
import PressPage from '@/pages/guest/PressPage';
import BlogPage from '@/pages/guest/BlogPage';
import NotFoundPage from '@/pages/NotFoundPage';
import { accountRoute } from './accountRoutes';

/** Cổng Guest (`/`) — công khai cho khách đặt phòng. */
export const guestRoutes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'search', element: <SearchResultsPage /> },
      { path: 'hotels/:hotelId', element: <HotelDetailPage /> },
      { path: 'destinations', element: <DestinationsPage /> },
      { path: 'deals', element: <DealsPage /> },
      { path: 'list-your-property', element: <PartnerLandingPage /> },
      { path: 'booking-information', element: <BookingInformationPage /> },
      { path: 'booking', element: <BookingCheckoutPage /> },
      { path: 'booking/payment-result', element: <PaymentResultPage /> },
      { path: 'booking/:bookingId/success', element: <BookingSuccessPage /> },
      // Support
      { path: 'help-center', element: <HelpCenterPage /> },
      { path: 'safety', element: <SafetyInformationPage /> },
      { path: 'cancellation-options', element: <CancellationOptionsPage /> },
      { path: 'report-concern', element: <ReportConcernPage /> },
      // Company
      { path: 'about', element: <AboutUsPage /> },
      { path: 'careers', element: <CareersPage /> },
      { path: 'press', element: <PressPage /> },
      { path: 'blog', element: <BlogPage /> },
      // Khu tài khoản customer (được ProtectedRoute bọc bên trong)
      accountRoute,
      // 404 — bắt mọi đường dẫn không khớp (vẫn trong Layout có Navbar/Footer)
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
