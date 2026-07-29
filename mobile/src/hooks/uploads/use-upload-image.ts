import { useMutation } from '@tanstack/react-query';
import { uploadService } from '@/services/upload.service';

/** `POST /uploads` — upload 1 ảnh (avatar, ảnh review…), trả về `{ url }`. */
export function useUploadImage() {
  return useMutation({
    mutationFn: ({ uri, folder }: { uri: string; folder?: string }) =>
      uploadService.uploadImage(uri, folder),
  });
}
