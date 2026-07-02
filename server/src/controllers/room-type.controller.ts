import httpStatus from 'http-status';
import { Request, Response } from 'express';
import type { User } from '@prisma/client';
import catchAsync from '../utils/catchAsync';
import { roomTypeService } from '../services';

export class RoomTypeController {
  createRoomType = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const roomType = await roomTypeService.createRoomType(req.params.hotelId as string, req.user as User, req.body);
    res.status(httpStatus.CREATED).send(roomType);
  });

  updateRoomType = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const roomType = await roomTypeService.updateRoomType(
      req.params.hotelId as string,
      req.params.roomTypeId as string,
      req.user as User,
      req.body
    );
    res.send(roomType);
  });

  listRoomTypes = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const roomTypes = await roomTypeService.listRoomTypes(req.params.hotelId as string, req.user as User);
    res.send(roomTypes);
  });

  addImages = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const images = await roomTypeService.addImages(
      req.params.hotelId as string,
      req.params.roomTypeId as string,
      req.user as User,
      req.body.images
    );
    res.status(httpStatus.CREATED).send(images);
  });

  setAmenities = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const roomType = await roomTypeService.setAmenities(
      req.params.hotelId as string,
      req.params.roomTypeId as string,
      req.user as User,
      req.body.amenities
    );
    res.send(roomType);
  });

  // Danh sách cấu hình giường của loại phòng
  getBeds = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const beds = await roomTypeService.getBeds(
      req.params.hotelId as string,
      req.params.roomTypeId as string,
      req.user as User
    );
    res.send(beds);
  });

  // Gán lại toàn bộ cấu hình giường của loại phòng
  setBeds = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const beds = await roomTypeService.setBeds(
      req.params.hotelId as string,
      req.params.roomTypeId as string,
      req.user as User,
      req.body.beds
    );
    res.send(beds);
  });

  // Xoá loại phòng (chỉ khi chưa có phòng/booking)
  deleteRoomType = catchAsync(async (req: Request, res: Response): Promise<void> => {
    await roomTypeService.deleteRoomType(
      req.params.hotelId as string,
      req.params.roomTypeId as string,
      req.user as User
    );
    res.status(httpStatus.NO_CONTENT).send();
  });
}

export const roomTypeController = new RoomTypeController();
