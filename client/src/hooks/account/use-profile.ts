import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/services/profile.service';
import { queryKeys } from '@/constants/queryKeys';
import type { UserProfile } from '@/types/account.types';

export function useProfile(seed: Partial<UserProfile>) {
  return useQuery({
    queryKey: queryKeys.profile.me,
    queryFn: () => profileService.get(seed),
  });
}
