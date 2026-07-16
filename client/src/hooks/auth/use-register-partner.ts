import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/authStore';
import type { RegisterPartnerPayload } from '@/types/auth.types';
import { toast } from 'sonner';

/**
 * Đăng ký làm Hotel Partner. BE tạo user role `hotel_partner` ngay (không cần
 * duyệt) + trả tokens → tự đăng nhập để đi tiếp bước nộp hồ sơ xác minh khách sạn.
 */
export function useRegisterPartner() {
  const setAuth = useAuthStore(state => state.setAuth);

  return useMutation({
    mutationFn: (payload: RegisterPartnerPayload) =>
      authService.registerPartner(payload),
    onSuccess: data => {
      const { user, tokens } = data;
      if (user && tokens?.access?.token && tokens?.refresh?.token) {
        setAuth(user, tokens.access.token, tokens.refresh.token);
      }
      toast.success('Partner account created', { duration: 1500 });
    },
  });
}
