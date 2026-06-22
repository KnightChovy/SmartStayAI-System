import { useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '@/services/profile.service';
import { queryKeys } from '@/constants/queryKeys';
import type { UserProfile } from '@/types/account.types';

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<UserProfile>) => profileService.update(patch),
    onSuccess: data => qc.setQueryData(queryKeys.profile.me, data),
  });
}
