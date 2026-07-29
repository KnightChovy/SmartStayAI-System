import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { usersService } from '@/services/users.service';
import { useAuthStore } from '@/stores/authStore';
import type { UpdateMyProfilePayload } from '@/types/users.type';

/**
 * `PATCH /users/me` — user tự cập nhật hồ sơ (họ tên, SĐT, ngày sinh, quốc tịch,
 * CCCD, hộ chiếu, avatar). Đồng bộ lại `authStore` để navbar/prefill thấy dữ liệu
 * mới ngay (authStore chỉ ghi lúc đăng nhập, không tự refresh).
 */
export function useUpdateMyProfile() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);
  return useMutation({
    mutationFn: (patch: UpdateMyProfilePayload) => usersService.updateMyProfile(patch),
    onSuccess: (profile) => {
      updateUser({
        fullName: profile.fullName,
        phone: profile.phone,
        avatarUrl: profile.avatarUrl,
      });
      queryClient.setQueryData(queryKeys.users.me(), profile);
    },
  });
}
