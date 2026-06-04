const allRoles = {
  guest: [],
  customer: [],
  staff: [],
  marketer: [],
  hotel_partner: [],
  platform_manager: ['getUsers', 'manageUsers', 'manageHotelVerifications'],
  admin: ['getUsers', 'manageUsers', 'manageHotelVerifications'],
};

export const roles = Object.keys(allRoles);
export const roleRights = new Map(Object.entries(allRoles));
