export const bookingKeys = {
  all: ['bookings'] as const,
  mine: () => ['bookings', 'mine'] as const,
};
