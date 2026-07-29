import { adminService } from '@/services/admin.service';
import type { AdminPlatformRevenue } from '@/types/admin.types';
import type {
  DateRange,
  RevenueBucket,
  RevenueRangeParams,
  RevenueSummary,
  RevenueTimePoint,
  RevenueTimeSeries,
  RevenueTimeSeriesParams,
} from '@/types/revenue.types';

/**
 * Data layer trang Platform Revenue (`/manager/revenue`) — gọi `GET /admin/revenue`.
 *
 * Endpoint dùng permission `viewPlatformStats`, role `platform_manager` có sẵn quyền đó nên
 * manager gọi được (không cần endpoint `/platform-manager/revenue/*` như bản mock cũ giả định).
 *
 * BE trả `summary` + `series[]` + `comparison`; service này chỉ map sang shape mà UI đang dùng
 * và **lấp bucket rỗng** — BE `GROUP BY` trên bảng bookings nên kỳ không có booking sẽ KHÔNG có
 * dòng, để nguyên thì chart nhảy cách quãng và overlay kỳ trước lệch cột.
 */

const DAY = 86_400_000;
const pad = (n: number) => String(n).padStart(2, '0');
const parse = (d: string) => {
  const [y, m, dd] = d.split('-').map(Number);
  return Date.UTC(y, m - 1, dd);
};
const keyOf = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const daysInclusive = (from: string, to: string) =>
  Math.max(0, Math.floor((parse(to) - parse(from)) / DAY) + 1);

/** ≤ 45 ngày thì vẽ theo ngày, dài hơn gom theo tháng (2 giá trị `groupBy` BE nhận). */
function pickBucket(from: string, to: string): RevenueBucket {
  return daysInclusive(from, to) <= 45 ? 'day' : 'month';
}

/** Kỳ trước = khoảng ngay trước, cùng độ dài — đúng cách BE tính `comparison`. */
function previousRange(from: string, to: string): DateRange {
  const len = daysInclusive(from, to);
  const prevTo = parse(from) - DAY;
  return { from: keyOf(prevTo - (len - 1) * DAY), to: keyOf(prevTo) };
}

function changePct(cur: number, prev: number): number | null {
  if (prev === 0) return null;
  return Math.round(((cur - prev) / prev) * 1000) / 10;
}

/** Tỷ lệ hoa hồng bình quân (%) — cùng công thức hint trên KPI card. */
function commissionRate(commission: number, gmv: number): number {
  return gmv > 0 ? Math.round((commission / gmv) * 1000) / 10 : 0;
}

/** Liệt kê đủ bucket trong [from,to] để lấp kỳ BE không trả (không có booking). */
function enumeratePeriods(from: string, to: string, bucket: RevenueBucket): string[] {
  const end = parse(to);
  const periods: string[] = [];
  if (bucket === 'day') {
    for (let ms = parse(from); ms <= end; ms += DAY) periods.push(keyOf(ms));
    return periods;
  }
  const start = new Date(parse(from));
  let y = start.getUTCFullYear();
  let m = start.getUTCMonth();
  while (Date.UTC(y, m, 1) <= end) {
    periods.push(`${y}-${pad(m + 1)}`);
    m += 1;
    if (m > 11) {
      m = 0;
      y += 1;
    }
  }
  return periods;
}

const indexByPeriod = (res: AdminPlatformRevenue) =>
  new Map(res.series.map(p => [p.period, p]));

export const revenueService = {
  /** KPI cards toàn sàn (`GET /admin/revenue`). */
  async getSummary(params: RevenueRangeParams): Promise<RevenueSummary> {
    const { from, to } = params;
    const res = await adminService.getPlatformRevenue({ from, to, groupBy: 'month' });
    const { summary, comparison } = res;

    const gmv = Number(summary.gmv);
    const commission = Number(summary.netPlatformRevenue);
    const curRate = commissionRate(commission, gmv);
    const preRate = comparison
      ? commissionRate(
          Number(comparison.previous.netPlatformRevenue),
          Number(comparison.previous.gmv)
        )
      : 0;

    return {
      range: { from, to },
      previousRange: previousRange(from, to),
      kpis: {
        grossRevenue: {
          value: summary.gmv,
          changePct: comparison?.change.gmvPct ?? null,
        },
        totalCommission: {
          value: summary.netPlatformRevenue,
          changePct: comparison?.change.netRevenuePct ?? null,
        },
        avgCommissionRate: {
          value: curRate,
          changePct: comparison ? changePct(curRate, preRate) : null,
        },
        // BE không trả số booking kỳ trước ⇒ không suy được % thay đổi (badge hiện "—").
        bookings: { value: summary.bookingCount, changePct: null },
      },
      commissionPending: summary.commissionPending,
      commissionSettled: summary.commissionSettled,
      refunded: summary.refunded,
    };
  },

  /** Chuỗi thời gian Revenue vs Commission; `compare` gọi thêm một lần cho kỳ trước để overlay. */
  async getTimeSeries(params: RevenueTimeSeriesParams): Promise<RevenueTimeSeries> {
    const { from, to, compare } = params;
    const bucket = pickBucket(from, to);
    const prevRange = previousRange(from, to);

    const [cur, prev] = await Promise.all([
      adminService.getPlatformRevenue({ from, to, groupBy: bucket }),
      compare
        ? adminService.getPlatformRevenue({ ...prevRange, groupBy: bucket })
        : Promise.resolve(null),
    ]);

    const curByPeriod = indexByPeriod(cur);
    // Overlay canh 1:1 theo index bucket (nhãn trục X vẫn là kỳ hiện tại), nên phải lấp
    // bucket rỗng của cả hai kỳ trước khi ghép — không thì cột lệch nhau.
    const prevGross = prev
      ? enumeratePeriods(prevRange.from, prevRange.to, bucket).map(
          period => indexByPeriod(prev).get(period)?.gmv ?? '0'
        )
      : [];

    const points: RevenueTimePoint[] = enumeratePeriods(from, to, bucket).map((period, i) => {
      const row = curByPeriod.get(period);
      const point: RevenueTimePoint = {
        period,
        revenue: row?.gmv ?? '0',
        commission: row?.commission ?? '0',
        bookings: row?.bookingCount ?? 0,
      };
      if (prev) point.previousRevenue = prevGross[i] ?? '0';
      return point;
    });

    return { bucket, points };
  },
};
