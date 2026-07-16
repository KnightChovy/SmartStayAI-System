import httpStatus from 'http-status';
import { Request, Response } from 'express';
import type { User } from '@prisma/client';
import catchAsync from '../utils/catchAsync';
import config from '../config/config';
import { paymentService } from '../services';
import type { VnpayParams, SepayWebhookPayload } from '../dto/payment.dto';

// VNPay gửi mọi tham số dạng query string ⇒ ép về Record<string,string>
const toVnpayParams = (query: Request['query']): VnpayParams => {
  const params: VnpayParams = {};
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === 'string') {
      params[key] = value;
    }
  }
  return params;
};

export class PaymentController {
  // Khách bấm thanh toán booking ⇒ trả về URL cổng VNPay để frontend redirect sang
  createVnpayPayment = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const ipAddr =
      (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || req.ip || '127.0.0.1';
    const result = await paymentService.createVnpayPaymentUrl(
      req.params.bookingId as string,
      req.user as User,
      ipAddr
    );
    res.status(httpStatus.CREATED).send(result);
  });

  // VNPay redirect TRÌNH DUYỆT khách về đây sau thanh toán ⇒ verify rồi đưa khách sang trang kết quả của client
  vnpayReturn = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const result = await paymentService.handleVnpayCallback(toVnpayParams(req.query));
    const status = result.success ? 'success' : 'failed';
    const url = `${config.clientUrl}/booking/payment-result?status=${status}&bookingCode=${result.bookingCode ?? ''}`;
    res.redirect(url);
  });

  // VNPay gọi SERVER-TO-SERVER (IPN) ⇒ trả JSON RspCode/Message đúng chuẩn VNPay
  vnpayIpn = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const result = await paymentService.handleVnpayCallback(toVnpayParams(req.query));
    res.send({ RspCode: result.rspCode, Message: result.message });
  });

  // Khách chọn trả bằng chuyển khoản ⇒ trả ảnh QR VietQR + nội dung chuyển khoản để khách quét
  createSepayPayment = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const result = await paymentService.createSepayPayment(req.params.bookingId as string, req.user as User);
    res.status(httpStatus.CREATED).send(result);
  });

  // SePay gọi SERVER-TO-SERVER khi tài khoản ngân hàng có biến động số dư.
  // Xác thực bằng header "Authorization: Apikey <key>" (không phải JWT của user).
  // SePay yêu cầu: trả HTTP 200/201 + { success: true } trong 30s, nếu không sẽ retry tới 7 lần.
  sepayWebhook = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const header = req.headers.authorization ?? '';
    const apiKey = header.startsWith('Apikey ') ? header.slice('Apikey '.length).trim() : null;
    if (!paymentService.verifySepayApiKey(apiKey)) {
      res.status(httpStatus.UNAUTHORIZED).send({ success: false, message: 'Invalid API key' });
      return;
    }
    const result = await paymentService.handleSepayWebhook(req.body as SepayWebhookPayload);
    res.send(result);
  });
}

export const paymentController = new PaymentController();
