import prisma from '../config/prisma';

export class AdminService {
  /**
   * [Admin/Platform_manager] Tổng quan toàn sàn: user, khách sạn, booking, doanh thu.
   * Tính TRỰC TIẾP bằng aggregate trong MỘT transaction (ảnh chụp nhất quán) — không phụ thuộc
   * bảng thống kê tiền-tính-sẵn nào, nên luôn đúng thời điểm gọi.
   */
  getOverview = async () => {
    // Mốc đầu tháng theo UTC (khớp toUtcDate toàn hệ thống) để đếm "tháng này"
    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    const [
      userTotal,
      usersByRole,
      suspendedUsers,
      newUsersThisMonth,
      hotelTotal,
      hotelListed,
      bookingTotal,
      bookingsByStatus,
      bookingsThisMonth,
      gmvAgg,
      commissionByStatus,
      refundAgg,
    ] = await prisma.$transaction([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.groupBy({ by: ['role'], where: { deletedAt: null }, _count: { _all: true } }),
      prisma.user.count({ where: { deletedAt: null, status: 'suspended' } }),
      prisma.user.count({ where: { deletedAt: null, createdAt: { gte: startOfMonth } } }),
      prisma.hotel.count({ where: { deletedAt: null } }),
      prisma.hotel.count({ where: { deletedAt: null, isListed: true } }),
      prisma.booking.count(),
      prisma.booking.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.booking.count({ where: { createdAt: { gte: startOfMonth } } }),
      // GMV = tổng tiền các booking ĐÃ chốt (confirmed trở đi); bỏ pending/cancelled/no_show
      prisma.booking.aggregate({
        _sum: { totalAmount: true },
        where: { status: { in: ['confirmed', 'checked_in', 'checked_out'] } },
      }),
      prisma.platformCommission.groupBy({ by: ['status'], _sum: { commissionAmount: true } }),
      prisma.refund.aggregate({ _sum: { amount: true } }),
    ]);

    // groupBy → object {key: số} cho dễ đọc ở client
    const byRole: Record<string, number> = {};
    for (const r of usersByRole) byRole[r.role] = r._count._all;
    const byStatus: Record<string, number> = {};
    for (const r of bookingsByStatus) byStatus[r.status] = r._count._all;
    const commission: Record<string, string> = {};
    for (const r of commissionByStatus) commission[r.status] = (r._sum.commissionAmount ?? 0).toString();

    return {
      users: {
        total: userTotal,
        byRole,
        suspended: suspendedUsers,
        newThisMonth: newUsersThisMonth,
      },
      hotels: {
        total: hotelTotal,
        listed: hotelListed,
        unlisted: hotelTotal - hotelListed,
      },
      bookings: {
        total: bookingTotal,
        byStatus,
        thisMonth: bookingsThisMonth,
      },
      revenue: {
        // tiền dạng chuỗi để khỏi sai số số thực với Decimal
        gmv: (gmvAgg._sum.totalAmount ?? 0).toString(),
        commissionPending: commission.pending ?? '0',
        commissionSettled: commission.settled ?? '0',
        refundedTotal: (refundAgg._sum.amount ?? 0).toString(),
      },
    };
  };
}

export const adminService = new AdminService();
