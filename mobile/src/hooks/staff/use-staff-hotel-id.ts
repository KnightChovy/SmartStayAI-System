import { useStaffStore } from '@/stores/staffStore';

export function useStaffHotelId(): string | null {
  const stored = useStaffStore((s) => s.hotelId);
  return stored ?? null;
}
