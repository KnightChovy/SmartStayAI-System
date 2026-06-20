import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Building2, MapPin, ArrowRight, AlertTriangle } from 'lucide-react';
import { useStaffHotels } from '@/hooks/staff';
import { useStaffHotelStore } from '@/stores/staffHotelStore';
import type { StaffHotel } from '@/types/staff.types';
import { ROUTES } from '@/constants/routes';

/**
 * Workplace picker for staff. Only lists hotels the staff member is actually assigned to
 * (`GET /hotels/staff/my-hotels`), so they can no longer pick a hotel that would 403.
 * With a single assignment the choice is made automatically.
 */
export default function SelectHotelPage() {
  const navigate = useNavigate();
  const setHotel = useStaffHotelStore(state => state.setHotel);
  const { data: hotels, isLoading, isError } = useStaffHotels();

  // One assignment → no need to ask, pick it and go straight to the dashboard.
  useEffect(() => {
    if (hotels && hotels.length === 1) {
      setHotel(hotels[0]);
      navigate(ROUTES.staffDashboard, { replace: true });
    }
  }, [hotels, setHotel, navigate]);

  const handlePick = (hotel: StaffHotel) => {
    setHotel(hotel);
    navigate(ROUTES.staffDashboard, { replace: true });
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Building2 className="size-6" />
        </div>
        <h1 className="text-xl font-semibold text-slate-900">Select your hotel</h1>
        <p className="mt-1 text-sm text-slate-500">
          All front desk / housekeeping actions will apply to the hotel you choose.
        </p>
      </div>

      {isLoading && <p className="py-10 text-center text-sm text-slate-500">Loading your hotels…</p>}
      {isError && (
        <p className="py-10 text-center text-sm text-rose-600">
          Could not load your hotels. Please try again.
        </p>
      )}

      {!isLoading && !isError && (
        <div className="space-y-2">
          {(hotels?.length ?? 0) === 0 && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-medium">You aren't assigned to any hotel yet.</p>
                <p className="text-amber-700">
                  Please ask your hotel manager to add you to a hotel, then sign in again.
                </p>
              </div>
            </div>
          )}
          {hotels?.map(hotel => (
            <button
              key={hotel.id}
              onClick={() => handlePick(hotel)}
              className="group flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition-colors hover:border-primary hover:bg-primary/5"
            >
              <div>
                <p className="font-medium text-slate-900">{hotel.name}</p>
                <p className="flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="size-3" />
                  {hotel.city}
                </p>
              </div>
              <ArrowRight className="size-4 text-slate-300 transition-colors group-hover:text-primary" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
