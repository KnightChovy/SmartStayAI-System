const allRoles = {
  guest: [],
  customer: [],
  staff: [],
  // Partner (chủ khách sạn) tự tạo tiện nghi vào catalog dùng chung + gán cho KS/loại phòng của mình.
  hotel_partner: ['manageAmenities'],
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
