import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import config from '../config/config';
import ApiError from '../utils/ApiError';

// Chặn /internal/jobs nếu không phải cron ngoài: phải gửi header "x-cron-secret" KHỚP CRON_SECRET.
// Đây là máy-gọi-máy nên KHÔNG dùng JWT của user. Secret rỗng (chưa cấu hình) ⇒ CHẶN hết cho an toàn.
const cronAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const provided = req.headers['x-cron-secret'];
  if (!config.cron.secret || provided !== config.cron.secret) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid cron secret');
  }
  next();
};

export default cronAuth;
