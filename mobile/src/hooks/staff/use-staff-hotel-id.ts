import { useStaffStore } from '@/stores/staffStore';

export function useStaffHotelId(): string | null {
  const stored = useStaffStore((s) => s.hotelId);
  return stored ?? process.env.EXPO_PUBLIC_STAFF_HOTEL_ID ?? null;
}
