const allRoles = {
  guest: [],
  customer: [],
  staff: [],
  marketer: [],
  hotel_partner: [],
  platform_manager: ['getUsers', 'manageUsers', 'manageHotelVerifications', 'manageBookings', 'manageHotels'],
  admin: ['getUsers', 'manageUsers', 'manageHotelVerifications', 'manageBookings', 'manageHotels', 'manageAmenities'],
};

export const roles = Object.keys(allRoles);
export const roleRights = new Map(Object.entries(allRoles));
