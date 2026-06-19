import { Navigate, Outlet } from 'react-router';
import { useStaffHotelStore } from '@/stores/staffHotelStore';
import { ROUTES } from '@/constants/routes';

/**
 * Blocks operational screens until the staff member has selected the hotel they're working
 * at. Since the backend has no endpoint returning the hotels assigned to a staff member, the
 * frontend requires a one-time selection before calling the `/hotels/:hotelId/...` APIs.
 */
export function RequireStaffHotel() {
  const hotel = useStaffHotelStore(state => state.hotel);
  if (!hotel) {
    return <Navigate to={ROUTES.staffSelectHotel} replace />;
  }
  return <Outlet />;
}
