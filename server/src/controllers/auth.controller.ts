import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync';
import { authService, userService, tokenService, emailService } from '../services';
import { Request, Response } from 'express';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';

export const register = catchAsync(async (req: Request, res: Response) => {
  const { email, password, name, verificationCode } = req.body;

  // 1. Verify OTP code
  const tokenRecord = await prisma.verificationToken.findFirst({
    where: {
      email,
      code: verificationCode,
      expiresAt: { gt: new Date() },
    },
  });

  if (!tokenRecord) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired verification code');
  }

  // 2. Delete verification token record
  await prisma.verificationToken.deleteMany({
    where: { email },
  });

  // 3. Create user (forwarding all fields)
  const user = await userService.createUser({
    name,
    email,
    password,
    phone: req.body.phone,
    avatarUrl: req.body.avatarUrl,
    dateOfBirth: req.body.dateOfBirth,
    nationality: req.body.nationality,
    idCardNumber: req.body.idCardNumber,
    passportNumber: req.body.passportNumber,
    preferredLanguage: req.body.preferredLanguage,
    preferredCurrency: req.body.preferredCurrency,
    marketingOptIn: req.body.marketingOptIn,
  });

  // 4. Mark email as verified
  const verifiedUser = await prisma.user.update({
    where: { id: user.id },
    data: { emailVerifiedAt: new Date() },
  });

  // 5. Generate tokens
  const tokens = await tokenService.generateAuthTokens(verifiedUser);
  res.status(httpStatus.CREATED).send({ user: verifiedUser, tokens });
});

export const sendOtp = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;

  // Check if email already exists
  const existingUser = await userService.getUserByEmail(email);
  if (existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }

  // Generate 6-digit OTP code
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Save to VerificationToken table (expires in 10 minutes)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.verificationToken.deleteMany({ where: { email } });
  await prisma.verificationToken.create({
    data: {
      email,
      code: otpCode,
      expiresAt,
    },
  });

  // Send email (handling offline local SMTP gracefully and logging to terminal)
  console.log(`\n🔑 [OTP Verification] The code for ${email} is: ${otpCode}\n`);
  try {
    await emailService.sendOtpEmail(email, otpCode);
  } catch (error) {
    console.error(`❌ [Email Service Failure] Detailed error:`, error);
    console.log(`[Email Service Bypass] SMTP email server is offline. Use console logged OTP code.`);
  }

  res.status(httpStatus.OK).send({
    status: 'success',
    message: `Verification OTP sent successfully to ${email}`,
  });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  res.send({ user, tokens });
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

export const refreshTokens = catchAsync(async (req: Request, res: Response) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

export const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  res.status(httpStatus.NO_CONTENT).send();
});

export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  await authService.resetPassword(req.query.token as string, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

export const sendVerificationEmail = catchAsync(async (req: Request, res: Response) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user);
  await emailService.sendVerificationEmail((req.user as any).email, verifyEmailToken);
  res.status(httpStatus.NO_CONTENT).send();
});

export const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  await authService.verifyEmail(req.query.token as string);
  res.status(httpStatus.NO_CONTENT).send();
});
