import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { usersService } from '@/services/users.service';
import { useAuthStore } from '@/stores/authStore';

/**
 * `GET /users/me` — hồ sơ self-service của chính mình (kèm CCCD/hộ chiếu/ngày sinh…).
 * Backend lấy id từ token nên không cần truyền `userId`; tự tắt khi chưa đăng nhập.
 */
export function useMyProfile() {
  const isAuthed = useAuthStore((s) => Boolean(s.user?.id));
  return useQuery({
    queryKey: queryKeys.users.me(),
    queryFn: () => usersService.getMyProfile(),
    enabled: isAuthed,
  });
}
