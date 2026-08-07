import httpStatus from 'http-status';
import type { UploadApiResponse } from 'cloudinary';
import cloudinary from '../config/cloudinary';
import ApiError from '../utils/ApiError';

export interface UploadResult {
  url: string;
  publicId: string;
}

// Chặn treo vô hạn: nếu Cloudinary không phản hồi trong khoảng này (mạng chậm/chặn, sai cấu hình)
// thì reject để request trả lỗi rõ ràng thay vì loading mãi ở client.
const UPLOAD_TIMEOUT_MS = 60_000;

export class UploadService {
  /**
   * Đẩy buffer file lên Cloudinary và trả về URL truy cập. Có timeout cứng để không bao giờ treo vô hạn.
   * @param {Express.Multer.File} file - file đã được multer nạp vào memory
   * @param {string} folder - thư mục con trên Cloudinary để gom nhóm (vd: licenses, properties)
   * @returns {Promise<UploadResult>}
   */
  uploadBuffer = (file: Express.Multer.File, folder: string): Promise<UploadResult> => {
    return new Promise<UploadResult>((resolve, reject) => {
      // Backstop: buộc reject nếu callback của Cloudinary không bao giờ được gọi
      const timer = setTimeout(() => {
        reject(
          new ApiError(httpStatus.GATEWAY_TIMEOUT, 'Image upload timed out — please try again')
        );
      }, UPLOAD_TIMEOUT_MS);

      const stream = cloudinary.uploader.upload_stream(
        { folder: `smartstay/${folder}`, resource_type: 'auto', timeout: UPLOAD_TIMEOUT_MS },
        (error, result?: UploadApiResponse) => {
          clearTimeout(timer);
          if (error || !result) {
            reject(error ?? new Error('Cloudinary upload failed'));
            return;
          }
          resolve({ url: result.secure_url, publicId: result.public_id });
        }
      );
      // Lỗi ở tầng stream (mạng đứt...) cũng phải reject để không kẹt Promise
      stream.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
      stream.end(file.buffer);
    });
  };
}

export const uploadService = new UploadService();
