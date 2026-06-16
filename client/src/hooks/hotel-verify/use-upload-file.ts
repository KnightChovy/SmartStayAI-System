import { useMutation } from '@tanstack/react-query';
import { hotelVerifyService } from '@/services/hotel-verify.service';

export function useUploadFile() {
  return useMutation({
    mutationFn: (file: File) => hotelVerifyService.uploadFile(file),
  });
}
