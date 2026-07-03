import { api } from '@/lib/api';
import type { Paginated } from '@/types/api.types';
import type {
  AdminAuditLogsParams,
  AdminAuditLogsResponse,
  AdminBooking,
  AdminCommission,
  AdminCommissionsParams,
  AdminCommissionsResponse,
  AdminCreateUserPayload,
  AdminHotelsParams,
  AdminHotelsResponse,
  AdminManagedHotel,
  AdminOverview,
  AdminPaymentsParams,
  AdminPaymentsResponse,
  AdminReviewVerificationPayload,
  AdminUpdateHotelFlagsPayload,
  AdminUpdateUserPayload,
  AdminUpdateUserRolePayload,
  AdminUpdateUserStatusPayload,
  AdminUser,
  AdminUsersParams,
  AdminUsersResponse,
  AdminVerificationRequestsParams,
  AdminVerificationRequestsResponse,
} from '@/types/admin.types';
import type { HotelSearchResult } from '@/types/hotel.types';
import type { HotelBookingsResponse } from '@/types/staff.types';

function cleanParams<T extends object>(params: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null && v !== ''
    )
  );
}

export const adminService = {
  // ----- Platform admin: /admin -----

  async getOverview(): Promise<AdminOverview> {
    const { data } = await api.get<AdminOverview>('/admin/overview');
    return data;
  },

  async listCommissions(
    params: AdminCommissionsParams = {}
  ): Promise<AdminCommissionsResponse> {
    const { data } = await api.get<AdminCommissionsResponse>(
      '/admin/commissions',
      {
        params: cleanParams(params),
      }
    );
    return data;
  },

  async settleCommission(commissionId: string): Promise<AdminCommission> {
    const { data } = await api.patch<AdminCommission>(
      `/admin/commissions/${commissionId}/settle`
    );
    return data;
  },

  async listHotels(params: AdminHotelsParams = {}): Promise<AdminHotelsResponse> {
    const { data } = await api.get<AdminHotelsResponse>('/admin/hotels', {
      params: cleanParams(params),
    });
    return data;
  },

  async updateHotelFlags(
    hotelId: string,
    payload: AdminUpdateHotelFlagsPayload
  ): Promise<AdminManagedHotel> {
    const { data } = await api.patch<AdminManagedHotel>(
      `/admin/hotels/${hotelId}`,
      payload
    );
    return data;
  },

  async listAuditLogs(
    params: AdminAuditLogsParams = {}
  ): Promise<AdminAuditLogsResponse> {
    const { data } = await api.get<AdminAuditLogsResponse>(
      '/admin/audit-logs',
      {
        params: cleanParams(params),
      }
    );
    return data;
  },

  async listPayments(
    params: AdminPaymentsParams = {}
  ): Promise<AdminPaymentsResponse> {
    const { data } = await api.get<AdminPaymentsResponse>('/admin/payments', {
      params: cleanParams(params),
    });
    return data;
  },

  // ----- Users: /users (getUsers/manageUsers) -----

  async listUsers(params: AdminUsersParams = {}): Promise<AdminUsersResponse> {
    const { data } = await api.get<AdminUsersResponse>('/users', {
      params: cleanParams(params),
    });
    return data;
  },

  async createUser(payload: AdminCreateUserPayload): Promise<AdminUser> {
    const { data } = await api.post<AdminUser>('/users', payload);
    return data;
  },

  async getUser(userId: string): Promise<AdminUser> {
    const { data } = await api.get<AdminUser>(`/users/${userId}`);
    return data;
  },

  async updateUser(
    userId: string,
    payload: AdminUpdateUserPayload
  ): Promise<AdminUser> {
    const { data } = await api.patch<AdminUser>(`/users/${userId}`, payload);
    return data;
  },

  async updateUserStatus(
    userId: string,
    payload: AdminUpdateUserStatusPayload
  ): Promise<AdminUser> {
    const { data } = await api.patch<AdminUser>(
      `/users/${userId}/status`,
      payload
    );
    return data;
  },

  async updateUserRole(
    userId: string,
    payload: AdminUpdateUserRolePayload
  ): Promise<AdminUser> {
    const { data } = await api.patch<AdminUser>(
      `/users/${userId}/role`,
      payload
    );
    return data;
  },

  async deleteUser(userId: string): Promise<void> {
    await api.delete(`/users/${userId}`);
  },

  // ----- Hotel verification queue: /hotel-partners/registrations -----

  async listVerificationRequests(
    params: AdminVerificationRequestsParams = {}
  ): Promise<AdminVerificationRequestsResponse> {
    const { data } = await api.get<AdminVerificationRequestsResponse>(
      '/hotel-partners/registrations',
      {
        params: cleanParams(params),
      }
    );
    return data;
  },

  async reviewVerificationRequest(
    requestId: string,
    payload: AdminReviewVerificationPayload
  ): Promise<unknown> {
    const { data } = await api.patch(
      `/hotel-partners/registrations/${requestId}/review`,
      payload
    );
    return data;
  },

  // ----- Platform booking overview -----
  // Backend has no global admin bookings endpoint. Admin/platform_manager can use manageBookings
  // on each hotel, so the client builds an overview from /hotels + /hotels/:hotelId/bookings.
  async listBookings(limitPerHotel = 20): Promise<AdminBooking[]> {
    const { data: hotelsPage } = await api.get<Paginated<HotelSearchResult>>(
      '/hotels',
      {
        params: { limit: 100 },
      }
    );

    const bookingPages = await Promise.allSettled(
      hotelsPage.results.map(async hotel => {
        const { data } = await api.get<HotelBookingsResponse>(
          `/hotels/${hotel.id}/bookings`,
          {
            params: { limit: limitPerHotel, sortBy: 'createdAt:desc' },
          }
        );
        return data.results.map(booking => ({
          ...booking,
          hotelName: hotel.name,
        }));
      })
    );

    return bookingPages
      .flatMap(result => (result.status === 'fulfilled' ? result.value : []))
      .sort((a, b) => {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
  },
};
