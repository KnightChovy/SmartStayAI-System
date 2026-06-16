import { Request, Response } from 'express';
import type { User } from '@prisma/client';
import pick from '../utils/pick';
import catchAsync from '../utils/catchAsync';
import { hotelService } from '../services';

export class HotelController {
  searchHotels = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const filter = pick(req.query, ['city', 'checkIn', 'checkOut', 'guests']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await hotelService.searchHotels(filter, options);
    res.send(result);
  });

  getHotel = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const hotel = await hotelService.getHotelById(req.params.hotelId as string);
    res.send(hotel);
  });

  getRoomTypes = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const filter = pick(req.query, ['checkIn', 'checkOut', 'guests', 'minPrice', 'maxPrice', 'bedType', 'viewType']);
    const roomTypes = await hotelService.getRoomTypes(req.params.hotelId as string, filter);
    res.send(roomTypes);
  });

  // Khách sạn của chính partner đang đăng nhập (id lấy từ token, không nhận qua URL)
  getMyHotels = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const hotels = await hotelService.getHotelsByOwner((req.user as User).id);
    res.send(hotels);
  });

  // Chi tiết 1 khách sạn cho chủ/manager (xem được cả KS chưa listed)
  getHotelForManage = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const hotel = await hotelService.getManagedHotelDetail(req.params.hotelId as string, req.user as User);
    res.send(hotel);
  });
}

export const hotelController = new HotelController();
