/** Query keys cho các bộ thông tin replace-all của khách sạn. */
export const hotelPropertyKeys = {
  contacts: (hotelId: string) => ['hotel-property', 'contacts', hotelId] as const,
  policies: (hotelId: string) => ['hotel-property', 'policies', hotelId] as const,
  charges: (hotelId: string) => ['hotel-property', 'charges', hotelId] as const,
  nearbyPlaces: (hotelId: string) => ['hotel-property', 'nearby-places', hotelId] as const,
  beds: (hotelId: string, roomTypeId: string) =>
    ['hotel-property', 'beds', hotelId, roomTypeId] as const,
};
