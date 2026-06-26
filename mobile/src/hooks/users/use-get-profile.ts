import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { usersService } from '@/services/users.service';
import { useAuthStore } from '@/stores/authStore';

/**
 * `GET /users/:userId` — hồ sơ của chính mình.
 * Lấy `userId` từ authStore (self-access); tự tắt khi chưa đăng nhập.
 */
export function useGetProfile() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: queryKeys.users.profile(userId ?? ''),
    queryFn: () => usersService.getProfile(userId as string),
    enabled: Boolean(userId),
  });
}
