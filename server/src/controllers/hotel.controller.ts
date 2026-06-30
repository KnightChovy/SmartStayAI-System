import httpStatus from 'http-status';
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

  // Partner tự bật/tắt mở bán khách sạn của mình
  setHotelListing = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const hotel = await hotelService.setHotelListing(
      req.params.hotelId as string,
      req.body.isListed as boolean,
      req.user as User
    );
    res.send(hotel);
  });

  // Partner cập nhật hồ sơ khách sạn của mình
  updateHotel = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const hotel = await hotelService.updateHotel(req.params.hotelId as string, req.body, req.user as User);
    res.send(hotel);
  });

  // Thêm ảnh khách sạn
  addHotelImages = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const images = await hotelService.addHotelImages(req.params.hotelId as string, req.body.images, req.user as User);
    res.status(httpStatus.CREATED).send(images);
  });

  // Xoá một ảnh khách sạn
  deleteHotelImage = catchAsync(async (req: Request, res: Response): Promise<void> => {
    await hotelService.deleteHotelImage(req.params.hotelId as string, req.params.imageId as string, req.user as User);
    res.status(httpStatus.NO_CONTENT).send();
  });

  // Đặt ảnh chính cho khách sạn
  setPrimaryHotelImage = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const image = await hotelService.setPrimaryHotelImage(
      req.params.hotelId as string,
      req.params.imageId as string,
      req.user as User
    );
    res.send(image);
  });

  // Danh sách tiện nghi đã gán cho khách sạn (cho màn hình quản trị)
  getHotelAmenities = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const amenities = await hotelService.getHotelAmenities(req.params.hotelId as string, req.user as User);
    res.send(amenities);
  });

  // Gán lại toàn bộ tiện nghi của khách sạn
  setHotelAmenities = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const amenities = await hotelService.setHotelAmenities(
      req.params.hotelId as string,
      req.user as User,
      req.body.amenities
    );
    res.send(amenities);
  });
}

export const hotelController = new HotelController();
