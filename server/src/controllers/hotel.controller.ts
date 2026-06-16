import { Request, Response } from 'express';
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
}

export const hotelController = new HotelController();
