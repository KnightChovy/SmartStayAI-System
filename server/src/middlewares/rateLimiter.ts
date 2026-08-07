import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
});

// Giới hạn tần suất chat AI THEO USER (không theo IP) — chống một tài khoản spam đốt quota API key.
// Đặt SAU middleware auth() để req.user đã có; rơi về IP nếu vì lý do nào đó chưa có user.
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req: Request): string => {
    const user = req.user as { id?: string } | undefined;
    return user?.id ?? req.ip ?? 'anonymous';
  },
  message: { code: 429, message: 'You are sending messages too quickly. Please wait a moment and try again.' },
});
