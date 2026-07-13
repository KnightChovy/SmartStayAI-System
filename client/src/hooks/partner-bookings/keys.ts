import type { PartnerBookingsParams } from '@/types/partner-bookings.types';

/** Query keys cho màn "All bookings" của Hotel Partner. */
export const partnerBookingKeys = {
  mine: (params: PartnerBookingsParams) =>
    ['partner-bookings', 'mine', params] as const,
};
