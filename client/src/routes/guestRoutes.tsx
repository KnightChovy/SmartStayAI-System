import type { RouteObject } from 'react-router';
import Layout from '@/components/layout/Layout';
import HomePage from '@/pages/guest/HomePage';
import DestinationsPage from '@/pages/guest/DestinationsPage';
import DealsPage from '@/pages/guest/DealsPage';
import AccommodationTypesPage from '@/pages/guest/AccommodationTypesPage';
import RoomDetailPage from '@/pages/guest/RoomDetailPage';
import BookingInformationPage from '@/pages/guest/BookingInformationPage';

/** Cổng Guest (`/`) — công khai cho khách đặt phòng. */
export const guestRoutes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'destinations', element: <DestinationsPage /> },
      { path: 'deals', element: <DealsPage /> },
      { path: 'accommodation-types', element: <AccommodationTypesPage /> },
      { path: 'room/executive-penthouse', element: <RoomDetailPage /> },
      { path: 'booking-information', element: <BookingInformationPage /> },
    ],
  },
];
