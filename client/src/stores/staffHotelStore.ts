import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StaffHotel } from '@/types/staff.types';

/**
 * The hotel the staff member is working at. The backend has no endpoint returning the hotels
 * assigned to a staff member (it only checks permission when `/hotels/:hotelId/...` is called),
 * so the FE lets staff pick their workplace once and remembers it (persist). If they pick a
 * hotel they aren't assigned to, the operational APIs return 403 and the screen shows a clear error.
 */
interface StaffHotelState {
  hotel: StaffHotel | null;
  setHotel: (hotel: StaffHotel) => void;
  clearHotel: () => void;
}

export const useStaffHotelStore = create<StaffHotelState>()(
  persist(
    set => ({
      hotel: null,
      setHotel: hotel => set({ hotel }),
      clearHotel: () => set({ hotel: null }),
    }),
    { name: 'smartstay-staff-hotel' }
  )
);
