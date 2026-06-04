import { v2 as cloudinary } from 'cloudinary';
import config from './config';

// Cấu hình Cloudinary tập trung một lần khi ứng dụng khởi động.
// Các service upload đều dùng chung instance này (không config lại ở nơi khác).
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
  secure: true,
});

export default cloudinary;
