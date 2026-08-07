import passport from 'passport';
import httpStatus from 'http-status';
import { Request, Response, NextFunction } from 'express';
import type { User } from '@prisma/client';
import ApiError from '../utils/ApiError';
import { roleRights } from '../config/roles';

const verifyCallback =
  (req: Request, resolve: () => void, reject: (reason?: unknown) => void, requiredRights: string[]) =>
  (err: Error | null, user: User | false, info?: unknown): void => {
    if (err || info || !user) {
      return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
    }
    req.user = user;

    if (requiredRights.length) {
      const userRights = roleRights.get(user.role) || [];
      const hasRequiredRights = requiredRights.every((requiredRight) => userRights.includes(requiredRight));
      if (!hasRequiredRights && req.params.userId !== user.id) {
        return reject(new ApiError(httpStatus.FORBIDDEN, 'Forbidden'));
      }
    }

    resolve();
  };

const auth =
  (...requiredRights: string[]) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      passport.authenticate('jwt', { session: false }, verifyCallback(req, resolve, reject, requiredRights))(req, res, next);
    })
      .then(() => next())
      .catch((err) => next(err));
  };

/**
 * Xác thực TUỲ CHỌN: KHÔNG gửi token → cho đi tiếp như KHÁCH VÃNG LAI (chế độ chỉ-đọc). CÓ gửi token
 * hợp lệ → gắn `req.user` (thêm quyền tra đơn/đặt/huỷ). CÓ gửi token nhưng HỎNG/HẾT HẠN → trả 401.
 *
 * Vì sao token hỏng phải 401 (không âm thầm hạ xuống vãng lai): nếu nuốt lỗi, hội thoại sẽ bị tạo với
 * userId = null ⇒ khách MẤT LỊCH SỬ vĩnh viễn (/me, /mine lọc theo userId), lễ tân thấy "Guest", và
 * client trả 2xx nên interceptor KHÔNG refresh token (chỉ refresh khi 401/403) ⇒ lỗi tự lặp mãi.
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  passport.authenticate('jwt', { session: false }, (_err: Error | null, user: User | false): void => {
    if (user) {
      req.user = user;
      return next();
    }
    // Có Authorization header mà xác thực vẫn trượt = token hỏng/hết hạn → báo để client refresh rồi gửi lại
    if (req.headers.authorization) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'Token is invalid or has expired'));
    }
    // Không có token → khách vãng lai
    return next();
  })(req, res, next);
};

export default auth;
