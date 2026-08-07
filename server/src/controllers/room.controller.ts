import httpStatus from 'http-status';
import { Request, Response } from 'express';
import type { User } from '@prisma/client';
import pick from '../utils/pick';
import catchAsync from '../utils/catchAsync';
import { isTrue } from '../utils/query';
import { roomService, roomBlockService } from '../services';

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
    const filter = pick(req.query, ['status', 'roomTypeId', 'isActive']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await roomService.listRooms(req.params.hotelId as string, req.user as User, filter, options);
    res.send(result);
  });

  // Lịch tồn kho theo từng đêm (mỗi loại phòng × mỗi ngày còn bao nhiêu phòng bán được)
  getInventoryCalendar = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const result = await roomService.getInventoryCalendar(req.params.hotelId as string, req.user as User, {
      from: req.query.from as unknown as Date,
      to: req.query.to as unknown as Date,
    });
    res.send(result);
  });

  // Buồng phòng đổi trạng thái dọn phòng — chiều duy nhất staff bấm trực tiếp
  updateHousekeeping = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const room = await roomService.updateHousekeeping(
      req.params.hotelId as string,
      req.params.roomId as string,
      req.user as User,
      req.body.hkStatus
    );
    res.send(room);
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

  // Xoá phòng vật lý (chỉ khi chưa từng được đặt)
  deleteRoom = catchAsync(async (req: Request, res: Response): Promise<void> => {
    await roomService.deleteRoom(req.params.hotelId as string, req.params.roomId as string, req.user as User);
    res.status(httpStatus.NO_CONTENT).send();
  });

  /**
   * Chặn phòng để sửa. `?dryRun=true` chỉ KIỂM TRA và trả về hậu quả (booking bị ảnh hưởng, ngày
   * thiếu phòng) mà không ghi gì — FE gọi mỗi khi user đổi ngày trong modal để cảnh báo trước.
   */
  createBlock = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const hotelId = req.params.hotelId as string;
    const roomId = req.params.roomId as string;
    // isTrue chứ không so với chuỗi: Joi đã convert `dryRun` thành boolean trước khi tới đây
    // (xem utils/query.ts) — so chuỗi làm nhánh xem trước không bao giờ chạy và ghi block thật.
    if (isTrue(req.query.dryRun)) {
      const preview = await roomBlockService.previewBlock(hotelId, roomId, req.user as User, req.body);
      res.send(preview);
      return;
    }
    const result = await roomBlockService.createBlock(hotelId, roomId, req.user as User, req.body);
    res.status(httpStatus.CREATED).send(result);
  });

  // Sửa đợt chặn đang mở (gia hạn / rút ngắn / sửa lý do, chi phí) — trả kèm hậu quả như lúc tạo
  updateBlock = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const result = await roomBlockService.updateBlock(
      req.params.hotelId as string,
      req.params.roomId as string,
      req.params.blockId as string,
      req.user as User,
      req.body
    );
    res.send(result);
  });

  // Đánh dấu đã sửa xong — trả phòng về kho bán cho những ngày còn lại của đợt chặn
  resolveBlock = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const block = await roomBlockService.resolveBlock(
      req.params.hotelId as string,
      req.params.roomId as string,
      req.params.blockId as string,
      req.user as User
    );
    res.send(block);
  });

  // Danh sách đợt chặn của khách sạn (mặc định chỉ những đợt chưa xử lý xong)
  listBlocks = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const blocks = await roomBlockService.listBlocks(
      req.params.hotelId as string,
      req.user as User,
      isTrue(req.query.includeResolved)
    );
    res.send(blocks);
  });
}

export const roomController = new RoomController();
