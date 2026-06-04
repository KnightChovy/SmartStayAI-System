import multer, { MulterError } from 'multer';
import httpStatus from 'http-status';
import { Request, Response, NextFunction } from 'express';
import ApiError from '../utils/ApiError';

// Chỉ nhận ảnh phổ biến và PDF (giấy phép, giấy tờ tuỳ thân...)
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

// Lưu file trong RAM để đẩy thẳng buffer lên Cloudinary, không ghi tạm xuống đĩa.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new ApiError(httpStatus.BAD_REQUEST, 'Chỉ chấp nhận ảnh JPEG/PNG/WEBP hoặc file PDF'));
  },
});

/**
 * Bọc multer.single() để chuyển lỗi của multer (file quá lớn, sai field...) thành ApiError 400,
 * tránh để lỗi rơi xuống errorConverter và bị quy nhầm thành 500.
 */
export const uploadSingle =
  (fieldName: string) =>
  (req: Request, res: Response, next: NextFunction): void => {
    upload.single(fieldName)(req, res, (err: unknown) => {
      if (err instanceof MulterError) {
        next(new ApiError(httpStatus.BAD_REQUEST, err.message));
        return;
      }
      if (err) {
        next(err); // ApiError từ fileFilter hoặc lỗi không lường trước
        return;
      }
      next();
    });
  };
