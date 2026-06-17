import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StaffHotel } from '@/types/staff.types';

/**
 * Khách sạn nhân viên đang trực. Backend chưa có endpoint trả khách sạn được phân công
 * cho staff (chỉ kiểm quyền khi gọi `/hotels/:hotelId/...`), nên FE để staff tự chọn nơi
 * làm việc một lần rồi ghi nhớ (persist). Nếu chọn nhầm khách sạn không được phân công,
 * các API vận hành sẽ trả 403 và màn hình báo lỗi rõ ràng.
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
