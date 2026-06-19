import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Building2, MapPin, Search, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useStaffHotels } from '@/hooks/staff';
import { useStaffHotelStore } from '@/stores/staffHotelStore';
import type { StaffHotel } from '@/types/staff.types';
import { ROUTES } from '@/constants/routes';

/**
 * Screen for selecting the hotel the staff member is working at. The list comes from
 * `GET /hotels` (public); actual permission is enforced by the backend when operational
 * APIs are called (picking the wrong one returns 403 on the next screen).
 */
export default function SelectHotelPage() {
  const navigate = useNavigate();
  const setHotel = useStaffHotelStore(state => state.setHotel);
  const { data: hotels, isLoading, isError } = useStaffHotels();
  const [query, setQuery] = useState('');

  const handlePick = (hotel: StaffHotel) => {
    setHotel(hotel);
    navigate(ROUTES.staffDashboard, { replace: true });
  };

  const filtered = (hotels ?? []).filter(h =>
    `${h.name} ${h.city}`.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Building2 className="size-6" />
        </div>
        <h1 className="text-xl font-semibold text-slate-900">Select the hotel you're working at</h1>
        <p className="mt-1 text-sm text-slate-500">
          All front desk / housekeeping actions will apply to this hotel.
        </p>
      </div>

      <div className="relative mb-4">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name or city…"
          className="pl-9"
        />
      </div>

      {isLoading && <p className="py-10 text-center text-sm text-slate-500">Loading hotels…</p>}
      {isError && (
        <p className="py-10 text-center text-sm text-rose-600">
          Could not load hotels. Please try again.
        </p>
      )}

      {!isLoading && !isError && (
        <div className="space-y-2">
          {filtered.length === 0 && (
            <p className="py-10 text-center text-sm text-slate-500">No hotels found.</p>
          )}
          {filtered.map(hotel => (
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
