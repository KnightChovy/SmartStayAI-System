import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface StaffStore {
  hotelId: string | null;
  setHotelId: (hotelId: string | null) => void;
}

export const useStaffStore = create<StaffStore>()(
  persist(
    (set) => ({
      hotelId: null,
      setHotelId: (hotelId) => set({ hotelId }),
    }),
    {
      name: 'smartstay-staff',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
