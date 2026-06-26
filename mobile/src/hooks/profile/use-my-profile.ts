import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/services/profile.service';
import { profileKeys } from './keys';

export function useMyProfile() {
  return useQuery({
    queryKey: profileKeys.mine(),
    queryFn: profileService.getMine,
  });
}
