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

  getBooking = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const booking = await bookingService.getBookingById(req.params.bookingId as string, req.user as User);
    res.send(booking);
  });

  cancelBooking = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const booking = await bookingService.cancelBooking(
      req.params.bookingId as string,
      req.user as User,
      req.body.reason
    );
    res.send(booking);
  });
}

export const bookingController = new BookingController();
