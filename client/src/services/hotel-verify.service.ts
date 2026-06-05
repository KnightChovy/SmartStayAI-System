import { api } from '@/lib/api';
import type { VerificationApplication, HotelRegistrationRequest } from '@/types/hotel-verify.types';

export const hotelVerifyService = {
  async getApplications(): Promise<VerificationApplication[]> {
    const { data } = await api.get('/hotel-partners/registrations/me');
    return data;
  },

  async getApplicationById(id: string): Promise<VerificationApplication> {
    const { data } = await api.get(`/hotel-partners/registrations/${id}`);
    return data;
  },

  async submitRegistration(payload: HotelRegistrationRequest): Promise<VerificationApplication> {
    const { data } = await api.post('/hotel-partners/registrations', payload);
    return data;
  },

  async uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post<{ url: string }>('/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.url;
  },
};
