import type { RouteObject } from 'react-router';
import Layout from '@/components/layout/Layout';
import HomePage from '@/pages/guest/HomePage';
import DestinationsPage from '@/pages/guest/DestinationsPage';
import DealsPage from '@/pages/guest/DealsPage';
import AccommodationTypesPage from '@/pages/guest/AccommodationTypesPage';
import RoomDetailPage from '@/pages/guest/RoomDetailPage';
import BookingInformationPage from '@/pages/guest/BookingInformationPage';
import SearchResultsPage from '@/pages/guest/SearchResultsPage';
import HotelDetailPage from '@/pages/guest/HotelDetailPage';
import BookingCheckoutPage from '@/pages/guest/BookingCheckoutPage';
import BookingSuccessPage from '@/pages/guest/BookingSuccessPage';
import PaymentResultPage from '@/pages/guest/PaymentResultPage';
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
      { path: 'accommodation-types', element: <AccommodationTypesPage /> },
      { path: 'room/executive-penthouse', element: <RoomDetailPage /> },
      { path: 'booking-information', element: <BookingInformationPage /> },
      { path: 'booking', element: <BookingCheckoutPage /> },
      { path: 'booking/payment-result', element: <PaymentResultPage /> },
      { path: 'booking/:bookingId/success', element: <BookingSuccessPage /> },
      // Khu tài khoản customer (được ProtectedRoute bọc bên trong)
      accountRoute,
      // 404 — bắt mọi đường dẫn không khớp (vẫn trong Layout có Navbar/Footer)
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
