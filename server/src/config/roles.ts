const allRoles = {
  guest: [],
  customer: [],
  staff: [],
  marketer: [],
  hotel_partner: [],
  platform_manager: [
    'getUsers',
    'manageUsers',
    'manageHotelVerifications',
    'manageBookings',
    'manageHotels',
    'viewPlatformStats',
    'manageCommissions',
  ],
  admin: [
    'getUsers',
    'manageUsers',
    'manageRoles',
    'manageHotelVerifications',
    'manageBookings',
    'manageHotels',
    'manageAmenities',
    'viewPlatformStats',
    'manageCommissions',
  ],
};

export const roles = Object.keys(allRoles);
export const roleRights = new Map(Object.entries(allRoles));
