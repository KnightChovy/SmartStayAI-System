import type { UploadApiResponse } from 'cloudinary';
import cloudinary from '../config/cloudinary';

export interface UploadResult {
  url: string;
  publicId: string;
}

export class UploadService {
  /**
   * Đẩy buffer file lên Cloudinary và trả về URL truy cập.
   * @param {Express.Multer.File} file - file đã được multer nạp vào memory
   * @param {string} folder - thư mục con trên Cloudinary để gom nhóm (vd: licenses, properties)
   * @returns {Promise<UploadResult>}
   */
  uploadBuffer = (file: Express.Multer.File, folder: string): Promise<UploadResult> => {
    return new Promise<UploadResult>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `smartstay/${folder}`, resource_type: 'auto' },
        (error, result?: UploadApiResponse) => {
          if (error || !result) {
            reject(error ?? new Error('Cloudinary upload failed'));
            return;
          }
          resolve({ url: result.secure_url, publicId: result.public_id });
        }
      );
      stream.end(file.buffer);
    });
  };
}

export const uploadService = new UploadService();
