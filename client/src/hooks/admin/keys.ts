import type {
  AdminUsersParams,
  AdminVerificationRequestsParams,
} from '@/types/admin.types';

export const adminKeys = {
  users: (params: AdminUsersParams) => ['admin', 'users', params] as const,
  verificationRequests: (params: AdminVerificationRequestsParams) =>
    ['admin', 'verification-requests', params] as const,
  bookings: ['admin', 'bookings'] as const,
};
