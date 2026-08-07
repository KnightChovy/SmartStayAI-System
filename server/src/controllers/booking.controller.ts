import httpStatus from 'http-status';
import { Request, Response } from 'express';
import type { User } from '@prisma/client';
import pick from '../utils/pick';
import catchAsync from '../utils/catchAsync';
import { bookingService } from '../services';

export class BookingController {
  createBooking = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const customerId = (req.user as User).id;
    const booking = await bookingService.createBooking(customerId, req.body);
    res.status(httpStatus.CREATED).send(booking);
  });

  getMyBookings = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const customerId = (req.user as User).id;
    const filter = pick(req.query, ['status']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await bookingService.getMyBookings(customerId, filter, options);
    res.send(result);
  });

  // [Platform Manager] Toàn bộ booking toàn sàn
  listPlatformBookings = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const filter = pick(req.query, ['status', 'hotelId', 'partnerId', 'fromDate', 'toDate', 'search']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await bookingService.listPlatformBookings(filter, options);
    res.send(result);
  });

  // [Partner] Toàn bộ booking của mọi khách sạn của partner đang đăng nhập
  listMyPartnerBookings = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const filter = pick(req.query, ['status', 'hotelId', 'fromDate', 'toDate', 'search']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await bookingService.listPartnerBookings((req.user as User).id, filter, options);
    res.send(result);
  });

  getBooking = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const booking = await bookingService.getBookingById(req.params.bookingId as string, req.user as User);
    res.send(booking);
  });

  // Xem trước tiền hoàn trước khi khách bấm huỷ
  getRefundPreview = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const preview = await bookingService.getRefundPreview(req.params.bookingId as string, req.user as User);
    res.send(preview);
  });

  cancelBooking = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const booking = await bookingService.cancelBooking(req.params.bookingId as string, req.user as User, req.body);
    res.send(booking);
  });

  // [M12] Staff/chủ KS liệt kê booking của một khách sạn
  listHotelBookings = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const filter = pick(req.query, ['status', 'fromDate', 'toDate']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await bookingService.listHotelBookings(
      req.params.hotelId as string,
      req.user as User,
      filter,
      options
    );
    res.send(result);
  });

  // [M12] Staff/chủ KS xem chi tiết một booking của khách sạn
  getHotelBooking = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const booking = await bookingService.getHotelBookingById(
      req.params.hotelId as string,
      req.params.bookingId as string,
      req.user as User
    );
    res.send(booking);
  });

  // [M13] Staff quét QR / nhập mã voucher để tra booking trước khi check-in
  lookupByVoucher = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const booking = await bookingService.lookupBookingByVoucher(
      req.params.hotelId as string,
      req.query.voucherCode as string,
      req.user as User
    );
    res.send(booking);
  });

  // Gán TRƯỚC phòng vật lý cho đơn đã xác nhận nhưng chưa tới
  assignRoom = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const booking = await bookingService.assignRoom(
      req.params.hotelId as string,
      req.params.bookingId as string,
      req.user as User,
      req.body
    );
    res.send(booking);
  });

  // Gỡ phòng đã gán trước (chưa check-in)
  releaseAssignedRoom = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const booking = await bookingService.releaseAssignedRoom(
      req.params.hotelId as string,
      req.params.bookingId as string,
      req.user as User
    );
    res.send(booking);
  });

  // [M13] Check-in khách
  checkIn = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const booking = await bookingService.checkInBooking(
      req.params.hotelId as string,
      req.params.bookingId as string,
      req.user as User,
      req.body
    );
    res.send(booking);
  });

  // [M13 + S12] Check-out khách + phát hành hoá đơn
  checkOut = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const booking = await bookingService.checkOutBooking(
      req.params.hotelId as string,
      req.params.bookingId as string,
      req.user as User,
      req.body
    );
    res.send(booking);
  });

  // Staff ghi nhận đã thu tiền mặt cho booking trả tại khách sạn
  recordCashPayment = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const booking = await bookingService.recordCashPayment(
      req.params.hotelId as string,
      req.params.bookingId as string,
      req.user as User
    );
    res.send(booking);
  });

  // Staff đánh dấu khách no-show (không đến nhận phòng)
  markNoShow = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const booking = await bookingService.markNoShow(
      req.params.hotelId as string,
      req.params.bookingId as string,
      req.user as User
    );
    res.send(booking);
  });
}

export const bookingController = new BookingController();
