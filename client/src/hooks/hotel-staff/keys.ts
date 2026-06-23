/** Factory key TanStack Query cho domain Quản lý nhân viên khách sạn. */
export const hotelStaffKeys = {
  all: ['hotel-staff'] as const,
  list: (hotelId: string) => [...hotelStaffKeys.all, 'list', hotelId] as const,
};
