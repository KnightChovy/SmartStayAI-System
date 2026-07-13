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
 * Xác thực TUỲ CHỌN: nếu request kèm JWT hợp lệ thì gắn `req.user`; nếu thiếu/không hợp lệ/hết hạn
 * thì KHÔNG chặn — cho đi tiếp như KHÁCH VÃNG LAI (`req.user` để trống). Dùng cho chatbot: khách chưa
 * đăng nhập vẫn hỏi được (chế độ chỉ-đọc), khách đã đăng nhập có thêm quyền tra đơn/đặt/huỷ phòng.
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  passport.authenticate('jwt', { session: false }, (_err: Error | null, user: User | false): void => {
    if (user) {
      req.user = user;
    }
    next();
  })(req, res, next);
};

export default auth;
