import type { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import logger from '../config/logger';

interface AuditEntry {
  userId: string; // ai thực hiện (actor)
  action: string; // vd 'user.suspend', 'commission.settle', 'hotel.update_flags'
  entityType: string; // 'user' | 'commission' | 'hotel' ...
  entityId: string; // id đối tượng bị tác động
  oldValue?: Prisma.InputJsonValue; // ảnh trước (tuỳ chọn)
  newValue?: Prisma.InputJsonValue; // ảnh sau (tuỳ chọn)
}

export class AuditService {
  /**
   * Ghi 1 dòng nhật ký kiểm toán cho thao tác nhạy cảm.
   * KHÔNG để lỗi ghi log làm hỏng thao tác chính → bọc try/catch, chỉ cảnh báo nếu ghi thất bại.
   */
  log = async (entry: AuditEntry): Promise<void> => {
    try {
      await prisma.auditLog.create({
        data: {
          userId: entry.userId,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          oldValue: entry.oldValue,
          newValue: entry.newValue,
        },
      });
    } catch (err) {
      logger.error(`[Audit] ghi log thất bại (${entry.action}): ${(err as Error).message}`);
    }
  };

  /** [Admin] Liệt kê nhật ký kiểm toán, lọc theo action / entityType / người thực hiện. */
  queryLogs = async (
    filter: { action?: string; entityType?: string; userId?: string },
    options: { limit?: number; page?: number }
  ) => {
    const limit = options.limit || 20;
    const page = options.page || 1;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};
    if (filter.action) where.action = filter.action;
    if (filter.entityType) where.entityType = filter.entityType;
    if (filter.userId) where.userId = filter.userId;

    const [results, totalResults] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, fullName: true, email: true, role: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { results, page, limit, totalPages: Math.ceil(totalResults / limit), totalResults };
  };
}

export const auditService = new AuditService();
