import { api } from '@/lib/api';
import type {
  PaginatedVerificationRequests,
  VerificationRequestDetail,
  ReviewRegistrationDto,
  ReviewDocumentDto,
  ListVerificationParams,
} from '@/types/manager.types';
import type { VerificationDocument } from '@/types/hotel-verify.types';

export const managerVerificationService = {
  async listRegistrations(
    params?: ListVerificationParams
  ): Promise<PaginatedVerificationRequests> {
    const { data } = await api.get('/hotel-partners/registrations', { params });
    return data;
  },

  async getRegistrationDetail(
    requestId: string
  ): Promise<VerificationRequestDetail> {
    const { data } = await api.get(
      `/hotel-partners/registrations/${requestId}`
    );
    return data;
  },

  async reviewRegistration(
    requestId: string,
    dto: ReviewRegistrationDto
  ): Promise<VerificationRequestDetail> {
    const { data } = await api.patch(
      `/hotel-partners/registrations/${requestId}/review`,
      dto
    );
    return data;
  },

  async reviewDocument(
    documentId: string,
    dto: ReviewDocumentDto
  ): Promise<VerificationDocument> {
    const { data } = await api.patch(
      `/hotel-partners/documents/${documentId}/review`,
      dto
    );
    return data;
  },
};
