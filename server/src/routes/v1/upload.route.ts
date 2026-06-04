import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import { uploadSingle } from '../../middlewares/upload';
import { uploadValidation } from '../../validations';
import { uploadController } from '../../controllers';

const router = express.Router();

// Upload 1 file (multipart/form-data, field "file") → trả về URL Cloudinary.
// Dùng chung cho mọi luồng cần lưu ảnh/giấy tờ (đăng ký khách sạn, avatar...).
router.post('/', auth(), validate(uploadValidation.uploadFile), uploadSingle('file'), uploadController.uploadFile);

export default router;
