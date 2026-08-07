import { Request, Response } from 'express';
import type { User } from '@prisma/client';
import pick from '../utils/pick';
import catchAsync from '../utils/catchAsync';
import { adminService, auditService } from '../services';

export class AdminController {
  // [Admin/Platform_manager] Số liệu tổng quan toàn sàn
  getOverview = catchAsync(async (_req: Request, res: Response): Promise<void> => {
    const overview = await adminService.getOverview();
    res.send(overview);
  });

  // [Admin/PM] Doanh thu nền tảng theo khoảng thời gian + so sánh kỳ trước
  getPlatformRevenue = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const options = pick(req.query, ['from', 'to', 'groupBy']);
    const result = await adminService.getPlatformRevenue(options);
    res.send(result);
  });

  // [Admin/PM] Doanh thu chi tiết theo từng đối tác / khách sạn / thành phố
  getRevenueBreakdown = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const options = pick(req.query, ['groupBy', 'from', 'to', 'partnerId', 'sortBy', 'limit', 'page']);
    const result = await adminService.getRevenueBreakdown(options as Parameters<typeof adminService.getRevenueBreakdown>[0]);
    res.send(result);
  });

  // ===== Pha 3 — Hoa hồng / payout =====
  listCommissions = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const filter = pick(req.query, ['status', 'partnerId']);
    const options = pick(req.query, ['limit', 'page']);
    const result = await adminService.listCommissions(filter, options);
    res.send(result);
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

  // ===== Pha 5 — Audit log =====
  listAuditLogs = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const filter = pick(req.query, ['action', 'entityType', 'userId']);
    const options = pick(req.query, ['limit', 'page']);
    const result = await auditService.queryLogs(filter, options);
    res.send(result);
  });

  // ===== Pha 6 — Giao dịch thanh toán toàn sàn =====
  listPayments = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const filter = pick(req.query, ['status', 'paymentMethod', 'hotelId']);
    const options = pick(req.query, ['limit', 'page']);
    const result = await adminService.listPayments(filter, options);
    res.send(result);
  });
}

export const adminController = new AdminController();
