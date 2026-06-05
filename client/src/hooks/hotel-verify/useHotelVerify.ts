import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelVerifyService } from '@/services/hotel-verify.service';
import type { HotelRegistrationRequest } from '@/types/hotel-verify.types';

export const hotelVerifyKeys = {
  all: ['hotel-verify'] as const,
  applications: () => [...hotelVerifyKeys.all, 'applications'] as const,
  application: (id: string) => [...hotelVerifyKeys.all, 'application', id] as const,
};

export function useGetApplications() {
  return useQuery({
    queryKey: hotelVerifyKeys.applications(),
    queryFn: hotelVerifyService.getApplications,
  });
}

export function useGetApplicationById(id: string | null) {
  return useQuery({
    queryKey: hotelVerifyKeys.application(id!),
    queryFn: () => hotelVerifyService.getApplicationById(id!),
    enabled: !!id,
  });
}

export function useSubmitRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: HotelRegistrationRequest) => hotelVerifyService.submitRegistration(data),
    onSuccess: (data) => {
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: hotelVerifyKeys.application(data.id) });
      }
      queryClient.invalidateQueries({ queryKey: hotelVerifyKeys.applications() });
    },
  });
}

export function useUploadFile() {
  return useMutation({
    mutationFn: (file: File) => hotelVerifyService.uploadFile(file),
  });
}
