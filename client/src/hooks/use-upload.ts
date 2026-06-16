import { useMutation } from '@tanstack/react-query';
import { uploadService } from '@/services/upload.service';

/** Upload 1 file ảnh, trả về URL. */
export function useUpload() {
  return useMutation({
    mutationFn: ({ file, folder }: { file: File; folder?: string }) =>
      uploadService.uploadFile(file, folder),
  });
}
