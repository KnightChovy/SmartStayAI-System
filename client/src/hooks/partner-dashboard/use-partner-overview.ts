import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { usePartnerHotels } from '@/hooks/hotels';
import { hotelRevenueService } from '@/services/hotel-revenue.service';
import { hotelRevenueKeys } from '@/hooks/hotel-revenue/keys';
import type {
  HotelRevenueReport,
  HotelWalletResponse,
  WalletTransactionType,
} from '@/types/hotel-revenue.types';
import type { HotelPerformance } from '@/types/platform-manager.types';

/**
 * View-model tổng hợp cho Dashboard của Hotel Partner.
 * Gộp dữ liệu từ **tất cả** khách sạn của partner (mỗi khách sạn 3 endpoint:
 * `/hotels/:id/revenue`, `/hotels/:id/analytics`, `/hotels/:id/wallet`).
 * Field nào backend không cung cấp (top rooms / revenue target) sẽ để component tự bỏ trống.
 */
export interface PartnerOverviewStats {
  /** Số booking trong tháng này (tổng các khách sạn). */
  monthlyBookings: number;
  /** Doanh thu ròng tháng này (VND, tổng các khách sạn). */
  monthlyNet: number;
  /** Doanh thu gộp tháng này (VND). */
  monthlyGross: number;
  /** Tỷ lệ lấp đầy trung bình 0..1 (null nếu chưa đủ dữ liệu). */
  occupancyRate: number | null;
  /** Điểm đánh giá trung bình 0..5 (null nếu chưa có review). */
  avgRating: number | null;
  /** Tổng số phòng vật lý của mọi khách sạn. */
  totalRooms: number;
  /** Tổng số loại phòng. */
  totalRoomTypes: number;
  /** Số khách sạn của partner. */
  hotelCount: number;
}

export interface PartnerRevenuePoint {
  period: string;
  gross: number;
  bookings: number;
}

export interface PartnerActivity {
  id: string;
  type: WalletTransactionType;
  amount: number;
  description: string | null;
  hotelName: string;
  createdAt: string;
}

/** Khoảng thời gian "từ đầu tháng → hôm nay" (YYYY-MM-DD). */
function useMonthRange() {
  return useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return { from: `${y}-${m}-01`, to: `${y}-${m}-${d}` };
  }, []);
}

const num = (v: string | number | null | undefined): number => {
  const n = typeof v === 'string' ? Number(v) : v ?? 0;
  return Number.isNaN(n) ? 0 : n;
};

const avg = (xs: number[]): number | null =>
  xs.length === 0 ? null : xs.reduce((a, b) => a + b, 0) / xs.length;

export function usePartnerOverview() {
  const range = useMonthRange();
  const { data: hotels = [], isLoading: hotelsLoading, isError: hotelsError } = usePartnerHotels();
  const ids = hotels.map(h => h.id);

  const revenueParams = { from: range.from, to: range.to, groupBy: 'day' as const };

  const revenueQueries = useQueries({
    queries: ids.map(id => ({
      queryKey: hotelRevenueKeys.revenue(id, revenueParams),
      queryFn: () => hotelRevenueService.getRevenue(id, revenueParams),
    })),
  });

  const analyticsQueries = useQueries({
    queries: ids.map(id => ({
      queryKey: hotelRevenueKeys.analytics(id, {}),
      queryFn: () => hotelRevenueService.getAnalytics(id, {}),
    })),
  });

  const walletQueries = useQueries({
    queries: ids.map(id => ({
      queryKey: hotelRevenueKeys.wallet(id, { limit: 5 }),
      queryFn: () => hotelRevenueService.getWallet(id, { limit: 5 }),
    })),
  });

  const revenues = revenueQueries
    .map(q => q.data)
    .filter((d): d is HotelRevenueReport => !!d);
  const analytics = analyticsQueries
    .map(q => q.data)
    .filter((d): d is HotelPerformance => !!d);
  const wallets = walletQueries
    .map(q => q.data)
    .filter((d): d is HotelWalletResponse => !!d);

  const stats = useMemo<PartnerOverviewStats>(() => {
    const monthlyBookings = revenues.reduce((s, r) => s + r.summary.bookingCount, 0);
    const monthlyNet = revenues.reduce((s, r) => s + num(r.summary.net), 0);
    const monthlyGross = revenues.reduce((s, r) => s + num(r.summary.gross), 0);

    const occ = analytics
      .map(a => a.metrics.occupancyRate)
      .filter((v): v is number => v !== null);
    const ratings = analytics
      .map(a => a.metrics.avgRating)
      .filter((v): v is number => v !== null);

    return {
      monthlyBookings,
      monthlyNet,
      monthlyGross,
      occupancyRate: avg(occ),
      avgRating: avg(ratings),
      totalRooms: hotels.reduce((s, h) => s + (h._count?.rooms ?? 0), 0),
      totalRoomTypes: hotels.reduce((s, h) => s + (h._count?.roomTypes ?? 0), 0),
      hotelCount: hotels.length,
    };
  }, [revenues, analytics, hotels]);

  /** Chuỗi doanh thu theo ngày, gộp tất cả khách sạn theo `period`. */
  const series = useMemo<PartnerRevenuePoint[]>(() => {
    const byPeriod = new Map<string, PartnerRevenuePoint>();
    for (const r of revenues) {
      for (const p of r.series) {
        const cur = byPeriod.get(p.period) ?? { period: p.period, gross: 0, bookings: 0 };
        cur.gross += num(p.gross);
        cur.bookings += p.bookingCount;
        byPeriod.set(p.period, cur);
      }
    }
    return [...byPeriod.values()].sort((a, b) => a.period.localeCompare(b.period));
  }, [revenues]);

  /** Hoạt động gần đây = giao dịch ví mới nhất của mọi khách sạn, mới nhất trước. */
  const activities = useMemo<PartnerActivity[]>(() => {
    const hotelName = new Map(hotels.map(h => [h.id, h.name]));
    const all: PartnerActivity[] = [];
    walletQueries.forEach((q, i) => {
      const data = q.data;
      const id = ids[i];
      if (!data) return;
      for (const t of data.transactions.results) {
        all.push({
          id: t.id,
          type: t.type,
          amount: num(t.amount),
          description: t.description,
          hotelName: hotelName.get(id) ?? '',
          createdAt: t.createdAt,
        });
      }
    });
    return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);
  }, [wallets, hotels]); // eslint-disable-line react-hooks/exhaustive-deps

  const isLoading =
    hotelsLoading ||
    revenueQueries.some(q => q.isLoading) ||
    analyticsQueries.some(q => q.isLoading);

  return {
    hotels,
    stats,
    series,
    activities,
    isLoading,
    isError: hotelsError,
  };
}
