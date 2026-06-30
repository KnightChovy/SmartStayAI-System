import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { usersService } from '@/services/users.service';
import { useAuthStore } from '@/stores/authStore';
import type { UpdateProfilePayload } from '@/types/users.type';

/**
 * `PATCH /users/:userId` — cập nhật hồ sơ của chính mình.
 * Tự lấy `userId` từ authStore (self-access) rồi đồng bộ user sau khi cập nhật.
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) throw new Error('Chưa đăng nhập.');
      return usersService.updateProfile(userId, payload);
    },
    onSuccess: (user) => {
      updateUser(user);
      queryClient.setQueryData(queryKeys.users.profile(user.id), user);
    },
  });
}
