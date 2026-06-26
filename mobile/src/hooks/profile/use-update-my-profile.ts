import { useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '@/services/profile.service';
import type { UpdateProfilePayload } from '@/types/auth.types';
import { profileKeys } from './keys';

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      profileService.updateMine(payload),
    onSuccess: user => queryClient.setQueryData(profileKeys.mine(), user),
  });
}
