const allRoles = {
  guest: [],
  customer: [],
  staff: [],
  marketer: [],
  hotel_partner: [],
  platform_manager: ['getUsers', 'manageUsers'],
  admin: ['getUsers', 'manageUsers'],
};

export const roles = Object.keys(allRoles);
export const roleRights = new Map(Object.entries(allRoles));
