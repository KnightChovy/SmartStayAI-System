import httpStatus from 'http-status';
import { Request, Response } from 'express';
import type { User } from '@prisma/client';
import catchAsync from '../utils/catchAsync';
import sanitizeUser from '../utils/sanitizeUser';
import { authService, tokenService, emailService } from '../services';

export class AuthController {
  register = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { verificationCode } = req.body;
    const result = await authService.registerUser(req.body, verificationCode);
    res.status(httpStatus.CREATED).send(result);
  });

  sendOtp = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;
    await authService.generateAndSendOtp(email);
    res.status(httpStatus.OK).send({
      status: 'success',
      message: `Verification OTP sent successfully to ${email}`,
    });
  });

  login = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    const user = await authService.loginUserWithEmailAndPassword(email, password);
    const tokens = await tokenService.generateAuthTokens(user);
    res.send({ user: sanitizeUser(user), tokens });
  });

  logout = catchAsync(async (req: Request, res: Response): Promise<void> => {
    await authService.logout(req.body.refreshToken);
    res.status(httpStatus.NO_CONTENT).send();
  });

  refreshTokens = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const tokens = await authService.refreshAuth(req.body.refreshToken);
    res.send({ ...tokens });
  });

  forgotPassword = catchAsync(async (req: Request, res: Response): Promise<void> => {
    await authService.forgotPassword(req.body.email);
    res.status(httpStatus.NO_CONTENT).send();
  });

  resetPassword = catchAsync(async (req: Request, res: Response): Promise<void> => {
    await authService.resetPassword(req.query.token as string, req.body.password);
    res.status(httpStatus.NO_CONTENT).send();
  });

  sendVerificationEmail = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const user = req.user as User;
    const verifyEmailToken = await tokenService.generateVerifyEmailToken(user);
    await emailService.sendVerificationEmail(user.email, verifyEmailToken);
    res.status(httpStatus.NO_CONTENT).send();
  });

  verifyEmail = catchAsync(async (req: Request, res: Response): Promise<void> => {
    await authService.verifyEmail(req.query.token as string);
    res.status(httpStatus.NO_CONTENT).send();
  });
}

export const authController = new AuthController();
