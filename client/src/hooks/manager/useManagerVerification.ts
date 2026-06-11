import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { managerVerificationService } from '@/services/manager-verification.service';
import type {
  ListVerificationParams,
  ReviewRegistrationDto,
  ReviewDocumentDto,
} from '@/types/manager.types';

const managerVerificationKeys = {
  all: ['manager-verification'] as const,
  registrations: (params?: ListVerificationParams) =>
    [...managerVerificationKeys.all, 'registrations', params] as const,
  registration: (id: string) =>
    [...managerVerificationKeys.all, 'registration', id] as const,
};

export function useListRegistrations(params?: ListVerificationParams) {
  return useQuery({
    queryKey: managerVerificationKeys.registrations(params),
    queryFn: () => managerVerificationService.listRegistrations(params),
  });
}

export function useReviewRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      requestId,
      dto,
    }: {
      requestId: string;
      dto: ReviewRegistrationDto;
    }) => managerVerificationService.reviewRegistration(requestId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: managerVerificationKeys.all,
      });
    },
  });
}

export function useReviewDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      documentId,
      dto,
    }: {
      documentId: string;
      dto: ReviewDocumentDto;
    }) => managerVerificationService.reviewDocument(documentId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: managerVerificationKeys.all,
      });
    },
  });
}
