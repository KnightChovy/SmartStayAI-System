import type {
  AdminAuditLogsParams,
  AdminCommissionsParams,
  AdminHotelsParams,
  AdminUsersParams,
  AdminVerificationRequestsParams,
} from '@/types/admin.types';

export const adminKeys = {
  overview: ['admin', 'overview'] as const,
  commissions: (params: AdminCommissionsParams) =>
    ['admin', 'commissions', params] as const,
  hotels: (params: AdminHotelsParams) => ['admin', 'hotels', params] as const,
  auditLogs: (params: AdminAuditLogsParams) =>
    ['admin', 'audit-logs', params] as const,
  users: (params: AdminUsersParams) => ['admin', 'users', params] as const,
  verificationRequests: (params: AdminVerificationRequestsParams) =>
    ['admin', 'verification-requests', params] as const,
  bookings: ['admin', 'bookings'] as const,
};
