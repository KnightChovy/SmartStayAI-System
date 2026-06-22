import { api } from '@/lib/api';

export interface UploadResult {
  url: string;
  publicId?: string;
}

/**
 * Upload 1 file ảnh lên server (`POST /uploads`, multipart field "file").
 * Backend trả `{ url, publicId }` (Cloudinary). Dùng cho avatar, ảnh review...
 */
export const uploadService = {
  async uploadFile(file: File, folder?: string): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post<UploadResult>('/uploads', formData, {
      params: folder ? { folder } : undefined,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};
