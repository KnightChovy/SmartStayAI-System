import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/services/profile.service';
import { queryKeys } from '@/constants/queryKeys';

/** Hồ sơ của user đang đăng nhập (`GET /users/me`). */
export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile.me,
    queryFn: () => profileService.get(),
  });
}
