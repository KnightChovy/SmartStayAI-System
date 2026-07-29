import { api } from '@/lib/api';

export interface UploadResult {
  url: string;
  publicId?: string;
}

/**
 * Upload 1 ảnh lên server (`POST /uploads`, multipart field "file").
 * Trên React Native, phần tử file của FormData là `{ uri, name, type }` (không
 * có `File` như web). Backend trả `{ url, publicId }` (Cloudinary).
 */
export const uploadService = {
  async uploadImage(uri: string, folder = 'avatars'): Promise<UploadResult> {
    const name = uri.split('/').pop() || `upload-${folder}.jpg`;
    const ext = name.split('.').pop()?.toLowerCase();
    const type = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

    const formData = new FormData();
    // RN FormData chấp nhận object file — cast qua unknown vì lib.dom kỳ vọng Blob.
    formData.append('file', { uri, name, type } as unknown as Blob);

    const { data } = await api.post<UploadResult>('/uploads', formData, {
      params: { folder },
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};
