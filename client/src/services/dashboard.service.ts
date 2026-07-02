import type {
  ActivityLog,
  DashboardAlert,
  DashboardRangeParams,
  DashboardSearchResults,
  DashboardSummary,
  DashboardTimeSeries,
  DashboardVerification,
  TopHotel,
  VerificationStatus,
} from '@/types/dashboard.types';

/**
 * ⚠️ MOCK SERVICE — dữ liệu giả lập cho Manager Dashboard.
 *
 * Số liệu sinh deterministic theo khoảng ngày (đổi date-range → số đổi theo, mọi khối nhất quán,
 * không nhảy khi refetch). Khi BE sẵn sàng chỉ cần thay thân mỗi hàm bằng `api.get(...)` — shape
 * trả về đã theo `types/dashboard.types.ts`.
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

function seededFactor(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return 0.8 + ((h >>> 0) % 1000) / 2500; // ~0.8..1.2
}

function changePct(cur: number, prev: number): number | null {
  if (prev === 0) return null;
  return Math.round(((cur - prev) / prev) * 1000) / 10;
}

function previousRange(from: string, to: string): { from: string; to: string } {
  const len = daysInclusive(from, to);
  const prevTo = parse(from) - DAY;
  const prevFrom = prevTo - (len - 1) * DAY;
  return { from: keyOf(prevFrom), to: keyOf(prevTo) };
}

// ===== Chỉ số theo tháng (deterministic) =====
// revenue/bookings = "flow" trong tháng; activeUsers/hotelPartners = "level" luỹ kế tới tháng đó.

function monthIndex(monthKey: string): number {
  const [y, m] = monthKey.split('-').map(Number);
  return y * 12 + (m - 1);
}

function monthMetrics(monthKey: string) {
  const idx = monthIndex(monthKey);
  const growth = idx - monthIndex('2026-01'); // 0 tại 2026-01, tăng dần theo thời gian
  const f = seededFactor(monthKey);
  const revenue = Math.round((2_600_000_000 + growth * 90_000_000) * f);
  const bookings = Math.round(revenue / 2_500_000);
  const activeUsers = Math.round((16_000 + growth * 420) * (0.97 + (f - 0.8) * 0.15));
  const hotelPartners = Math.round(120 + growth * 3.5 * f);
  return { revenue, bookings, activeUsers, hotelPartners };
}

/** Danh sách monthKey của N tháng gần nhất tính tới mốc `to`. */
function monthsBack(to: string, n: number): string[] {
  const d = new Date(parse(to));
  let y = d.getUTCFullYear();
  let m = d.getUTCMonth();
  const keys: string[] = [];
  for (let i = 0; i < n; i += 1) {
    keys.unshift(`${y}-${pad(m + 1)}`);
    m -= 1;
    if (m < 0) {
      m = 11;
      y -= 1;
    }
  }
  return keys;
}

/** monthKey của các tháng chồng lấn [from,to]. */
function monthsInRange(from: string, to: string): string[] {
  const start = new Date(parse(from));
  const end = parse(to);
  const keys: string[] = [];
  let cur = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1);
  while (cur <= end) {
    const d = new Date(cur);
    keys.push(`${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`);
    cur = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
  }
  return keys.length ? keys : [`${start.getUTCFullYear()}-${pad(start.getUTCMonth() + 1)}`];
}

/** Phần overlap của range trong 1 tháng (số ngày), clip về ≤ hôm nay. */
function overlapDays(monthKey: string, from: string, to: string): number {
  const [y, m] = monthKey.split('-').map(Number);
  const mFirst = Date.UTC(y, m - 1, 1);
  const mLast = Date.UTC(y, m, 0);
  const start = Math.max(mFirst, parse(from));
  const end = Math.min(mLast, parse(to), todayMs());
  if (end < start) return 0;
  return Math.floor((end - start) / DAY) + 1;
}

function daysInMonth(monthKey: string): number {
  const [y, m] = monthKey.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Gộp chỉ số cho một range: flow (revenue/bookings) prorate theo ngày; level lấy tháng cuối. */
function metricsForRange(from: string, to: string) {
  const months = monthsInRange(from, to);
  let revenue = 0;
  let bookings = 0;
  for (const mk of months) {
    const frac = overlapDays(mk, from, to) / daysInMonth(mk);
    const mm = monthMetrics(mk);
    revenue += Math.round(mm.revenue * frac);
    bookings += Math.round(mm.bookings * frac);
  }
  const lastMonth = months[months.length - 1];
  const level = monthMetrics(lastMonth);
  return { revenue, bookings, activeUsers: level.activeUsers, hotelPartners: level.hotelPartners };
}

const delay = <T>(value: T, ms = 350): Promise<T> =>
  new Promise(resolve => setTimeout(() => resolve(value), ms));

// ===== Verifications: giữ state module-level để approve/reject phản ánh ngay =====

function seedVerifications(): DashboardVerification[] {
  const base = todayMs();
  const raw: Omit<DashboardVerification, 'submittedAt'>[] = [
    { id: 'vr-001', code: 'VR-001', hotelId: 'h-01', hotelName: 'Mường Thanh Grand Hà Nội', status: 'pending' },
    { id: 'vr-002', code: 'VR-002', hotelId: 'h-02', hotelName: 'Vinpearl Resort Phú Quốc', status: 'pending' },
    { id: 'vr-003', code: 'VR-003', hotelId: 'h-03', hotelName: 'Marriott Đà Nẵng', status: 'approved' },
    { id: 'vr-004', code: 'VR-004', hotelId: 'h-04', hotelName: 'Rex Hotel Sài Gòn', status: 'pending' },
    { id: 'vr-005', code: 'VR-005', hotelId: 'h-05', hotelName: 'Sheraton Hà Nội', status: 'rejected' },
    { id: 'vr-006', code: 'VR-006', hotelId: 'h-06', hotelName: 'Novotel Nha Trang', status: 'pending' },
  ];
  return raw.map((r, i) => ({ ...r, submittedAt: keyOf(base - (i + 1) * 2 * DAY) }));
}

let verifications: DashboardVerification[] = seedVerifications();

export const dashboardService = {
  async getSummary(params: DashboardRangeParams): Promise<DashboardSummary> {
    const { from, to } = params;
    const prev = previousRange(from, to);
    const cur = metricsForRange(from, to);
    const pre = metricsForRange(prev.from, prev.to);

    // Sparkline: 8 tháng gần nhất tính tới `to`.
    const spark = monthsBack(to, 8).map(mk => monthMetrics(mk));

    return delay({
      range: { from, to },
      previousRange: prev,
      kpis: {
        hotelPartners: {
          value: cur.hotelPartners,
          previous: pre.hotelPartners,
          changePct: changePct(cur.hotelPartners, pre.hotelPartners),
          sparkline: spark.map(s => s.hotelPartners),
        },
        activeUsers: {
          value: cur.activeUsers,
          previous: pre.activeUsers,
          changePct: changePct(cur.activeUsers, pre.activeUsers),
          sparkline: spark.map(s => s.activeUsers),
        },
        bookings: {
          value: cur.bookings,
          previous: pre.bookings,
          changePct: changePct(cur.bookings, pre.bookings),
          sparkline: spark.map(s => s.bookings),
        },
        revenue: {
          value: cur.revenue,
          previous: pre.revenue,
          changePct: changePct(cur.revenue, pre.revenue),
          sparkline: spark.map(s => s.revenue),
        },
      },
    });
  },

  // Chart theo 12 tháng gần nhất tính tới cuối range (AC-1).
  async getTimeSeries(params: DashboardRangeParams): Promise<DashboardTimeSeries> {
    const points = monthsBack(params.to, 12).map(mk => {
      const m = monthMetrics(mk);
      return { period: mk, revenue: m.revenue, bookings: m.bookings, activeUsers: m.activeUsers };
    });
    return delay({ points });
  },

  async getVerifications(params: DashboardRangeParams): Promise<DashboardVerification[]> {
    const { from, to } = params;
    const list = verifications.filter(
      v => v.submittedAt >= from && v.submittedAt <= to
    );
    return delay(list.length ? list : verifications.slice(0, 5), 300);
  },

  async approveVerification(id: string): Promise<DashboardVerification> {
    return this.reviewVerification(id, 'approved');
  },

  async rejectVerification(id: string): Promise<DashboardVerification> {
    return this.reviewVerification(id, 'rejected');
  },

  async reviewVerification(id: string, status: VerificationStatus): Promise<DashboardVerification> {
    verifications = verifications.map(v => (v.id === id ? { ...v, status } : v));
    const updated = verifications.find(v => v.id === id);
    if (!updated) throw new Error('Verification not found');
    return delay(updated, 250);
  },

  async getAlerts(): Promise<DashboardAlert[]> {
    return delay(
      [
        { id: 'al-1', hotelId: 'h-07', hotelName: 'Liberty Central Hotel', issue: 'Multiple guest complaints (4)', severity: 'high' },
        { id: 'al-2', hotelId: 'h-08', hotelName: 'Palace Hotel Huế', issue: 'Cancellation rate > 30%', severity: 'medium' },
        { id: 'al-3', hotelId: 'h-09', hotelName: 'Gold Coast Hotel', issue: 'Incomplete profile for 14 days', severity: 'low' },
      ],
      300
    );
  },

  async getTopHotels(params: DashboardRangeParams): Promise<TopHotel[]> {
    const { from, to } = params;
    const catalog = [
      { hotelId: 'h-02', name: 'Vinpearl Resort Phú Quốc', base: 920_000_000 },
      { hotelId: 'h-03', name: 'Marriott Đà Nẵng', base: 720_000_000 },
      { hotelId: 'h-05', name: 'Sheraton Hà Nội', base: 560_000_000 },
      { hotelId: 'h-01', name: 'Mường Thanh Grand Hà Nội', base: 640_000_000 },
      { hotelId: 'h-04', name: 'Rex Hotel Sài Gòn', base: 540_000_000 },
    ];
    const days = daysInclusive(from, to);
    const rows = catalog
      .map(c => {
        const f = seededFactor(c.hotelId + from);
        const revenue = Math.round((c.base / 30) * days * f);
        return { hotelId: c.hotelId, name: c.name, revenue, bookings: Math.round(revenue / 3_000_000) };
      })
      .filter(r => r.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue);
    return delay(rows, 300);
  },

  async getRecentActivity(): Promise<ActivityLog[]> {
    const base = Date.now();
    const raw: Omit<ActivityLog, 'at'>[] = [
      { id: 'ac-1', actor: 'Nguyễn Manager', action: 'approved verification', target: 'Marriott Đà Nẵng' },
      { id: 'ac-2', actor: 'Trần Admin', action: 'suspended partner', target: 'Palace Hotel Huế' },
      { id: 'ac-3', actor: 'Nguyễn Manager', action: 'settled commission', target: 'VR-014' },
      { id: 'ac-4', actor: 'System', action: 'flagged high cancellation', target: 'Gold Coast Hotel' },
      { id: 'ac-5', actor: 'Lê Manager', action: 'updated payout rate', target: 'Vinpearl Resort Phú Quốc' },
    ];
    const list = raw.map((r, i) => ({ ...r, at: new Date(base - (i + 1) * 3 * 3_600_000).toISOString() }));
    return delay(list, 300);
  },

  async search(query: string): Promise<DashboardSearchResults> {
    const q = query.trim().toLowerCase();
    const hotels = [
      { id: 'h-01', name: 'Mường Thanh Grand Hà Nội', city: 'Hà Nội' },
      { id: 'h-02', name: 'Vinpearl Resort Phú Quốc', city: 'Phú Quốc' },
      { id: 'h-03', name: 'Marriott Đà Nẵng', city: 'Đà Nẵng' },
      { id: 'h-05', name: 'Sheraton Hà Nội', city: 'Hà Nội' },
    ];
    const users = [
      { id: 'u-01', name: 'Nguyễn Văn A', email: 'a.nguyen@example.com' },
      { id: 'u-02', name: 'Trần Thị B', email: 'b.tran@example.com' },
      { id: 'u-03', name: 'Manager Lê', email: 'manager.le@example.com' },
    ];
    const bookings = [
      { id: 'bk-01', code: 'BK-90231', hotelName: 'Vinpearl Resort Phú Quốc' },
      { id: 'bk-02', code: 'BK-90244', hotelName: 'Marriott Đà Nẵng' },
      { id: 'bk-03', code: 'BK-90250', hotelName: 'Sheraton Hà Nội' },
    ];
    return delay(
      {
        hotels: hotels.filter(h => `${h.name} ${h.city}`.toLowerCase().includes(q)),
        users: users.filter(u => `${u.name} ${u.email}`.toLowerCase().includes(q)),
        bookings: bookings.filter(b => `${b.code} ${b.hotelName}`.toLowerCase().includes(q)),
      },
      200
    );
  },
};
