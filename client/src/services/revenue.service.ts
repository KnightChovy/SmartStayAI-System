import type {
  PartnerStatus,
  RevenueByPartnerParams,
  RevenueByPartnerResponse,
  RevenueBreakdown,
  RevenueBreakdownParams,
  RevenuePartnerRow,
  RevenueSummary,
  RevenueTimePoint,
  RevenueTimeSeries,
  RevenueTimeSeriesParams,
  RevenueRangeParams,
} from '@/types/revenue.types';

/**
 * ⚠️ MOCK SERVICE — dữ liệu giả lập cho trang Platform Revenue.
 *
 * Backend CHƯA có các endpoint revenue (xem `docs/revenue-api-spec.md`). Toàn bộ số liệu ở đây được
 * sinh **deterministic theo khoảng ngày** để: (1) đổi date-range là số liệu đổi theo, (2) mọi khối
 * (KPI / chart / bảng) luôn nhất quán vì cùng suy ra từ một hàm gốc, (3) không nhảy số khi refetch.
 *
 * KHI BE XONG: chỉ cần thay thân mỗi hàm bên dưới bằng `api.get('/platform-manager/revenue/...', { params })`
 * — shape trả về đã khớp contract nên hook/type/component KHÔNG phải sửa.
 */

const DAY = 86_400_000;
const pad = (n: number) => String(n).padStart(2, '0');
const parse = (d: string) => {
  const [y, m, dd] = d.split('-').map(Number);
  return Date.UTC(y, m - 1, dd);
};
const keyOf = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const todayMs = () => parse(keyOf(Date.now()));
const daysInclusive = (from: string, to: string) =>
  Math.max(0, Math.floor((parse(to) - parse(from)) / DAY) + 1);

/** FNV-1a hash → hệ số ổn định trong [0.78, 1.22] theo seed. */
function seededFactor(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return 0.78 + ((h >>> 0) % 1000) / 2272; // ~0.78..1.22
}

interface MockPartner {
  id: string;
  hotelId: string;
  name: string;
  city: string;
  rate: number; // %
  status: PartnerStatus;
  baseMonthly: number; // VND/tháng ở mức "trung bình"
  avgBooking: number; // giá trị TB mỗi booking (VND)
}

const PARTNERS: MockPartner[] = [
  { id: 'p-01', hotelId: 'h-01', name: 'Vinpearl Resort Phú Quốc', city: 'Phú Quốc', rate: 12, status: 'active', baseMonthly: 920_000_000, avgBooking: 3_200_000 },
  { id: 'p-02', hotelId: 'h-02', name: 'Mường Thanh Grand Hà Nội', city: 'Hà Nội', rate: 10, status: 'active', baseMonthly: 640_000_000, avgBooking: 2_100_000 },
  { id: 'p-03', hotelId: 'h-03', name: 'Rex Hotel Sài Gòn', city: 'TP. Hồ Chí Minh', rate: 11, status: 'active', baseMonthly: 540_000_000, avgBooking: 2_600_000 },
  { id: 'p-04', hotelId: 'h-04', name: 'Novotel Nha Trang', city: 'Nha Trang', rate: 10, status: 'active', baseMonthly: 430_000_000, avgBooking: 1_900_000 },
  { id: 'p-05', hotelId: 'h-05', name: 'Gold Coast Hotel Đà Nẵng', city: 'Đà Nẵng', rate: 9, status: 'active', baseMonthly: 360_000_000, avgBooking: 1_700_000 },
  { id: 'p-06', hotelId: 'h-06', name: 'Marriott Đà Nẵng', city: 'Đà Nẵng', rate: 13, status: 'active', baseMonthly: 720_000_000, avgBooking: 3_800_000 },
  { id: 'p-07', hotelId: 'h-07', name: 'Liberty Central Sài Gòn', city: 'TP. Hồ Chí Minh', rate: 10, status: 'active', baseMonthly: 300_000_000, avgBooking: 2_000_000 },
  { id: 'p-08', hotelId: 'h-08', name: 'Palace Hotel Huế', city: 'Huế', rate: 8, status: 'inactive', baseMonthly: 180_000_000, avgBooking: 1_400_000 },
  { id: 'p-09', hotelId: 'h-09', name: 'Fusion Maia Đà Nẵng', city: 'Đà Nẵng', rate: 14, status: 'active', baseMonthly: 480_000_000, avgBooking: 4_100_000 },
  { id: 'p-10', hotelId: 'h-10', name: 'Silk Path Grand Sapa', city: 'Lào Cai', rate: 9, status: 'suspended', baseMonthly: 150_000_000, avgBooking: 1_600_000 },
  { id: 'p-11', hotelId: 'h-11', name: 'Sheraton Hà Nội', city: 'Hà Nội', rate: 12, status: 'active', baseMonthly: 560_000_000, avgBooking: 3_000_000 },
  { id: 'p-12', hotelId: 'h-12', name: 'InterContinental Phú Quốc', city: 'Phú Quốc', rate: 13, status: 'active', baseMonthly: 680_000_000, avgBooking: 3_600_000 },
];

interface Bucket {
  key: string;
  subFrom: string;
  subTo: string;
}

/** Chia [from,to] thành các bucket ngày (range ngắn) hoặc tháng (range dài). */
function enumerateBuckets(from: string, to: string): { bucket: 'day' | 'month'; buckets: Bucket[] } {
  const days = daysInclusive(from, to);
  if (days <= 45) {
    const buckets: Bucket[] = [];
    for (let ms = parse(from); ms <= parse(to); ms += DAY) {
      const k = keyOf(ms);
      buckets.push({ key: k, subFrom: k, subTo: k });
    }
    return { bucket: 'day', buckets };
  }
  const buckets: Bucket[] = [];
  const end = parse(to);
  let cur = Date.UTC(new Date(parse(from)).getUTCFullYear(), new Date(parse(from)).getUTCMonth(), 1);
  while (cur <= end) {
    const d = new Date(cur);
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth();
    const monthFirst = Date.UTC(y, m, 1);
    const monthLast = Date.UTC(y, m + 1, 0);
    const subFrom = Math.max(parse(from), monthFirst);
    const subTo = Math.min(end, monthLast);
    buckets.push({ key: `${y}-${pad(m + 1)}`, subFrom: keyOf(subFrom), subTo: keyOf(subTo) });
    cur = Date.UTC(y, m + 1, 1);
  }
  return { bucket: 'month', buckets };
}

/** Doanh thu 1 đối tác trong 1 sub-range (đã clip về ≤ hôm nay — kỳ tương lai = 0). */
function partnerBucket(p: MockPartner, subFrom: string, subTo: string) {
  const clippedTo = Math.min(parse(subTo), todayMs());
  if (parse(subFrom) > clippedTo) return { gross: 0, commission: 0, bookings: 0 };
  const d = Math.floor((clippedTo - parse(subFrom)) / DAY) + 1;
  const factor = seededFactor(p.id + subFrom);
  const gross = Math.round((p.baseMonthly / 30) * d * factor);
  const commission = Math.round((gross * p.rate) / 100);
  const bookings = Math.max(0, Math.round(gross / p.avgBooking));
  return { gross, commission, bookings };
}

function previousRange(from: string, to: string): { from: string; to: string } {
  const len = daysInclusive(from, to);
  const prevTo = parse(from) - DAY;
  const prevFrom = prevTo - (len - 1) * DAY;
  return { from: keyOf(prevFrom), to: keyOf(prevTo) };
}

function changePct(cur: number, prev: number): number | null {
  if (prev === 0) return null;
  return Math.round(((cur - prev) / prev) * 1000) / 10;
}

/** Tổng gross/commission/bookings và per-partner cho một range. */
function aggregate(from: string, to: string) {
  const { buckets } = enumerateBuckets(from, to);
  const perPartner = new Map<string, { gross: number; commission: number; bookings: number }>();
  const perBucket = buckets.map(b => ({ key: b.key, subFrom: b.subFrom, subTo: b.subTo, gross: 0, commission: 0 }));
  let gross = 0;
  let commission = 0;

  buckets.forEach((b, i) => {
    for (const p of PARTNERS) {
      const v = partnerBucket(p, b.subFrom, b.subTo);
      gross += v.gross;
      commission += v.commission;
      perBucket[i].gross += v.gross;
      perBucket[i].commission += v.commission;
      const acc = perPartner.get(p.id) ?? { gross: 0, commission: 0, bookings: 0 };
      acc.gross += v.gross;
      acc.commission += v.commission;
      acc.bookings += v.bookings;
      perPartner.set(p.id, acc);
    }
  });

  const activePartners = [...perPartner.values()].filter(v => v.gross > 0).length;
  return { gross, commission, perPartner, perBucket, activePartners };
}

// Giả lập độ trễ mạng để loading/skeleton hiển thị thật.
const delay = <T>(value: T, ms = 350): Promise<T> =>
  new Promise(resolve => setTimeout(() => resolve(value), ms));

export const revenueService = {
  async getSummary(params: RevenueRangeParams): Promise<RevenueSummary> {
    const { from, to } = params;
    const prev = previousRange(from, to);
    const cur = aggregate(from, to);
    const pre = aggregate(prev.from, prev.to);

    const curRate = cur.gross > 0 ? Math.round((cur.commission / cur.gross) * 1000) / 10 : 0;
    const preRate = pre.gross > 0 ? Math.round((pre.commission / pre.gross) * 1000) / 10 : 0;
    const curPerPartner = cur.activePartners > 0 ? Math.round(cur.gross / cur.activePartners) : 0;
    const prePerPartner = pre.activePartners > 0 ? Math.round(pre.gross / pre.activePartners) : 0;

    return delay({
      range: { from, to },
      previousRange: prev,
      kpis: {
        grossRevenue: { value: String(cur.gross), previous: String(pre.gross), changePct: changePct(cur.gross, pre.gross) },
        totalCommission: { value: String(cur.commission), previous: String(pre.commission), changePct: changePct(cur.commission, pre.commission) },
        avgCommissionRate: { value: curRate, previous: preRate, changePct: changePct(curRate, preRate) },
        avgRevenuePerPartner: { value: String(curPerPartner), previous: String(prePerPartner), changePct: changePct(curPerPartner, prePerPartner) },
      },
    });
  },

  async getTimeSeries(params: RevenueTimeSeriesParams): Promise<RevenueTimeSeries> {
    const { from, to, compare } = params;
    const { bucket } = enumerateBuckets(from, to);
    const cur = aggregate(from, to);

    const totalBaseDaily = PARTNERS.reduce((s, p) => s + p.baseMonthly / 30, 0);

    // Overlay kỳ trước: canh 1:1 theo index bucket.
    let prevBucketGross: number[] = [];
    if (compare) {
      const prev = previousRange(from, to);
      prevBucketGross = aggregate(prev.from, prev.to).perBucket.map(b => b.gross);
    }

    const points: RevenueTimePoint[] = cur.perBucket.map((b, i) => {
      const d = daysInclusive(b.subFrom, b.subTo);
      const target = Math.round(totalBaseDaily * d * seededFactor('target' + b.key));
      const point: RevenueTimePoint = {
        period: b.key,
        revenue: String(b.gross),
        commission: String(b.commission),
        target: String(target),
      };
      if (compare) point.previousRevenue = String(prevBucketGross[i] ?? 0);
      return point;
    });

    return delay({ bucket, points });
  },

  async getByPartner(params: RevenueByPartnerParams): Promise<RevenueByPartnerResponse> {
    const { from, to, search, status, sortBy = 'grossRevenue:desc', page = 1, limit = 10 } = params;
    const cur = aggregate(from, to);
    const prev = previousRange(from, to);
    const pre = aggregate(prev.from, prev.to);

    let rows: RevenuePartnerRow[] = PARTNERS.map(p => {
      const c = cur.perPartner.get(p.id) ?? { gross: 0, commission: 0, bookings: 0 };
      const pr = pre.perPartner.get(p.id) ?? { gross: 0, commission: 0, bookings: 0 };
      return {
        partnerId: p.id,
        hotelId: p.hotelId,
        hotelName: p.name,
        bookings: c.bookings,
        grossRevenue: String(c.gross),
        commission: String(c.commission),
        commissionRate: p.rate,
        changePct: changePct(c.gross, pr.gross),
        status: p.status,
      };
    }).filter(r => Number(r.grossRevenue) > 0 || Number(r.bookings) > 0);

    if (search) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(r => r.hotelName.toLowerCase().includes(q));
    }
    if (status) rows = rows.filter(r => r.status === status);

    const [field, dir] = sortBy.split(':');
    const sign = dir === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
      const va = sortField(a, field);
      const vb = sortField(b, field);
      if (typeof va === 'string' && typeof vb === 'string') return va.localeCompare(vb) * sign;
      return ((va as number) - (vb as number)) * sign;
    });

    const totalResults = rows.length;
    const totalPages = Math.max(1, Math.ceil(totalResults / limit));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const results = rows.slice((safePage - 1) * limit, safePage * limit);

    return delay({ results, page: safePage, limit, totalPages, totalResults });
  },

  async getBreakdown(params: RevenueBreakdownParams): Promise<RevenueBreakdown> {
    const { from, to, by = 'city' } = params;
    const cur = aggregate(from, to);
    const byLabel = new Map<string, number>();
    for (const p of PARTNERS) {
      const c = cur.perPartner.get(p.id);
      if (!c || c.gross <= 0) continue;
      byLabel.set(p.city, (byLabel.get(p.city) ?? 0) + c.gross);
    }
    const total = [...byLabel.values()].reduce((s, v) => s + v, 0);
    const segments = [...byLabel.entries()]
      .map(([label, revenue]) => ({
        label,
        revenue: String(revenue),
        share: total > 0 ? Math.round((revenue / total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => Number(b.revenue) - Number(a.revenue));

    return delay({ by, segments });
  },
};

function sortField(r: RevenuePartnerRow, field: string): string | number {
  switch (field) {
    case 'hotelName':
      return r.hotelName;
    case 'bookings':
      return r.bookings;
    case 'commission':
      return Number(r.commission);
    case 'commissionRate':
      return r.commissionRate;
    case 'changePct':
      return r.changePct ?? -Infinity;
    case 'status':
      return r.status;
    case 'grossRevenue':
    default:
      return Number(r.grossRevenue);
  }
}
