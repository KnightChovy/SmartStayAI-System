import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/services/profile.service';
import { queryKeys } from '@/constants/queryKeys';

/**
 * Hồ sơ của user đang đăng nhập (`GET /users/me`).
 *
 * `enabled`: endpoint này bắt buộc đăng nhập, nên nơi nào có thể render cho khách vãng lai
 * (vd trang đặt phòng — route công khai) phải tắt query; nếu không, 401 sẽ kích hoạt
 * interceptor refresh-token trong `lib/api.ts` một cách vô ích.
 */
export function useProfile({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.profile.me,
    queryFn: () => profileService.get(),
    enabled,
  });
}
