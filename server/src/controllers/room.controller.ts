import httpStatus from 'http-status';
import { Request, Response } from 'express';
import type { User } from '@prisma/client';
import pick from '../utils/pick';
import catchAsync from '../utils/catchAsync';
import { roomService } from '../services';

export class RoomController {
  createRoom = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const room = await roomService.createRoom(req.params.hotelId as string, req.user as User, req.body);
    res.status(httpStatus.CREATED).send(room);
  });

  updateRoom = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const room = await roomService.updateRoom(
      req.params.hotelId as string,
      req.params.roomId as string,
      req.user as User,
      req.body
    );
    res.send(room);
  });

  listRooms = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const filter = pick(req.query, ['status', 'roomTypeId']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await roomService.listRooms(req.params.hotelId as string, req.user as User, filter, options);
    res.send(result);
  });

  // Staff đổi nhanh trạng thái phòng (bản đồ phòng / housekeeping 1-tap)
  updateRoomStatus = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const room = await roomService.updateRoomStatus(
      req.params.hotelId as string,
      req.params.roomId as string,
      req.user as User,
      req.body.status
    );
    res.send(room);
  });
}

export const roomController = new RoomController();
