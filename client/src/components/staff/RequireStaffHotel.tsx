import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router';
import { useStaffHotelStore } from '@/stores/staffHotelStore';
import { useStaffHotels } from '@/hooks/staff';
import { ROUTES } from '@/constants/routes';

/**
 * Guards the operational screens. A staff member may only operate a hotel they're assigned to,
 * so this:
 *   - resolves the hotels the staff member can actually operate (`useStaffHotels`),
 *   - auto-selects the only one when there's a single assignment,
 *   - drops a stale/persisted selection that isn't (or is no longer) assigned, and
 *   - sends the user to the picker when there's a choice to make.
 *
 * It deliberately does NOT render the children until a VALID hotel is in the store, so the
 * operational pages never fire a request against a hotel that would 403.
 */
export function RequireStaffHotel() {
  const hotel = useStaffHotelStore(state => state.hotel);
  const setHotel = useStaffHotelStore(state => state.setHotel);
  const clearHotel = useStaffHotelStore(state => state.clearHotel);
  const { data: assigned, isLoading, isError } = useStaffHotels();

  const valid = !!hotel && !!assigned?.some(h => h.id === hotel.id);

  useEffect(() => {
    if (isLoading || isError || valid) return;
    if (assigned && assigned.length === 1) {
      setHotel(assigned[0]); // single assignment → pick it (covers stale or empty selection)
    } else if (hotel) {
      clearHotel(); // stale selection with 0 or multiple options → force a fresh pick
    }
  }, [isLoading, isError, valid, assigned, hotel, setHotel, clearHotel]);

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading…</p>;
  }

  // Transient probe failure: trust a stored hotel rather than locking the user out.
  if (isError) {
    return hotel ? <Outlet /> : <Navigate to={ROUTES.staffSelectHotel} replace />;
  }

  if (valid) return <Outlet />;

  // Single assignment: the effect above is about to set it — hold the render for one tick.
  if (assigned && assigned.length === 1) {
    return <p className="text-sm text-slate-500">Loading…</p>;
  }

  return <Navigate to={ROUTES.staffSelectHotel} replace />;
}
