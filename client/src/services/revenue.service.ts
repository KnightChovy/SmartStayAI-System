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
import {
  DAY_MS as DAY,
  daysInclusive,
  parseDateKey as parse,
  pickRevenueBucket,
} from '@/utils/revenueBucket';

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

const pad = (n: number) => String(n).padStart(2, '0');
const keyOf = (ms: number) => new Date(ms).toISOString().slice(0, 10);

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

/**
 * Take rate của KỲ TRƯỚC — chỉ dùng để suy ra % thay đổi.
 *
 * Kỳ hiện tại đọc thẳng `summary.takeRatePct` của BE; riêng kỳ trước thì `comparison.previous`
 * chỉ có `gmv` + `netPlatformRevenue` nên phải tự chia. Đây đúng công thức BE dùng cho
 * `takeRatePct` (khác hẳn `commission / gmv` ở bảng breakdown — chỗ đó cấm tự tính vì hoàn
 * tiền làm hai vế lệch mẫu số). `null` khi kỳ trước chưa có GMV.
 */
function previousTakeRate(commission: number, gmv: number): number | null {
  return gmv > 0 ? Math.round((commission / gmv) * 10000) / 100 : null;
}

function changeBetween(cur: number | null, prev: number | null): number | null {
  if (cur === null || prev === null) return null;
  return changePct(cur, prev);
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

    const prevRate = comparison
      ? previousTakeRate(
          Number(comparison.previous.netPlatformRevenue),
          Number(comparison.previous.gmv)
        )
      : null;

    return {
      range: { from, to },
      previousRange: previousRange(from, to),
      asOf: res.asOf,
      currency: res.currency,
      kpis: {
        grossRevenue: {
          value: summary.gmv,
          changePct: comparison?.change.gmvPct ?? null,
        },
        totalCommission: {
          value: summary.netPlatformRevenue,
          changePct: comparison?.change.netRevenuePct ?? null,
        },
        takeRate: {
          // Số của BE, KHÔNG tự chia lại — `null` nghĩa là chưa có GMV, không phải 0%.
          value: summary.takeRatePct,
          changePct: changeBetween(summary.takeRatePct, prevRate),
        },
        // BE không trả số booking kỳ trước ⇒ không suy được % thay đổi (badge hiện "—").
        bookings: { value: summary.bookingCount, changePct: null },
      },
      avgBookingValue: summary.avgBookingValue,
      commissionPending: summary.commissionPending,
      commissionSettled: summary.commissionSettled,
      commissionDisputed: summary.commissionDisputed,
      refunded: summary.refunded,
    };
  },

  /** Chuỗi thời gian Revenue vs Commission; `compare` gọi thêm một lần cho kỳ trước để overlay. */
  async getTimeSeries(params: RevenueTimeSeriesParams): Promise<RevenueTimeSeries> {
    const { from, to, compare } = params;
    const bucket = pickRevenueBucket(from, to);
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
