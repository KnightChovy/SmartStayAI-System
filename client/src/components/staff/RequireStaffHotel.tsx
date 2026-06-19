import { Navigate, Outlet } from 'react-router';
import { useStaffHotelStore } from '@/stores/staffHotelStore';
import { ROUTES } from '@/constants/routes';

/**
 * Chặn các màn vận hành khi staff chưa chọn khách sạn đang trực. Vì backend không có
 * endpoint trả khách sạn được phân công cho staff, FE bắt buộc chọn một lần trước khi
 * gọi các API `/hotels/:hotelId/...`.
 */
export function RequireStaffHotel() {
  const hotel = useStaffHotelStore(state => state.hotel);
  if (!hotel) {
    return <Navigate to={ROUTES.staffSelectHotel} replace />;
  }
  return <Outlet />;
}
