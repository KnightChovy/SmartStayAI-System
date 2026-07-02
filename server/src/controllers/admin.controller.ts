import { Request, Response } from 'express';
import type { User } from '@prisma/client';
import pick from '../utils/pick';
import catchAsync from '../utils/catchAsync';
import { adminService, analyticsService, auditService } from '../services';

export class AdminController {
  // [Admin/Platform_manager] Số liệu tổng quan toàn sàn
  getOverview = catchAsync(async (_req: Request, res: Response): Promise<void> => {
    const overview = await adminService.getOverview();
    res.send(overview);
  });

  // ===== Pha 3 — Hoa hồng / payout =====
  listCommissions = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const filter = pick(req.query, ['status', 'partnerId']);
    const options = pick(req.query, ['limit', 'page']);
    const result = await adminService.listCommissions(filter, options);
    res.send(result);
  });

  settleCommission = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const commission = await adminService.settleCommission(req.params.commissionId as string, req.user as User);
    res.send(commission);
  });

  // ===== Pha 4 — Giám sát khách sạn toàn sàn =====
  listHotels = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const filter = pick(req.query, ['search', 'isListed', 'isActive']);
    const options = pick(req.query, ['limit', 'page']);
    const result = await adminService.listHotels(filter, options);
    res.send(result);
  });

  updateHotelFlags = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const hotel = await adminService.setHotelFlags(req.params.hotelId as string, req.body, req.user as User);
    res.send(hotel);
  });

  // [Platform Manager/Admin] Danh sách toàn bộ đối tác (hotel_partner)
  listPartners = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const filter = pick(req.query, ['search', 'status']);
    const options = pick(req.query, ['limit', 'page']);
    const result = await adminService.listPartners(filter, options);
    res.send(result);
  });

  // ===== Analytics & Performance =====
  getAnalytics = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const query = pick(req.query, ['period', 'range', 'topLimit']);
    const result = await analyticsService.getPlatformAnalytics(query);
    res.send(result);
  });

  getPerformanceLeaderboard = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const query = pick(req.query, ['from', 'to']);
    const result = await analyticsService.getPerformanceLeaderboard(query);
    res.send(result);
  });

  getHotelPerformance = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const query = pick(req.query, ['from', 'to']);
    const result = await analyticsService.getHotelPerformance(req.params.hotelId as string, query);
    res.send(result);
  });

  // ===== Pha 5 — Audit log =====
  listAuditLogs = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const filter = pick(req.query, ['action', 'entityType', 'userId']);
    const options = pick(req.query, ['limit', 'page']);
    const result = await auditService.queryLogs(filter, options);
    res.send(result);
  });
}

export const adminController = new AdminController();
