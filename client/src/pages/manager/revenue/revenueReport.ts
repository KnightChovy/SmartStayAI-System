import type { Row, Sheet } from 'write-excel-file/browser';
import {
  isHotelRow,
  isPartnerRow,
  type AdminRevenueBreakdown,
  type RevenueBreakdownGroupBy,
  type RevenueBreakdownRow,
} from '@/types/admin.types';
import type {
  DateRange,
  RevenueBucket,
  RevenueSummary,
  RevenueTimePoint,
} from '@/types/revenue.types';
import { dropFuturePeriods } from '@/utils/revenueBucket';

/** Trần `limit` của `GET /admin/revenue/breakdown` — xuất tối đa bấy nhiêu nhóm. */
export const BREAKDOWN_EXPORT_LIMIT = 100;

/**
 * Xuất báo cáo doanh thu ra **Excel thật (.xlsx)**, mỗi khối một sheet.
 *
 * Vì sao bỏ CSV: CSV không có khái niệm "cột" — nó chỉ là văn bản ngăn bằng dấu phẩy, còn
 * việc tách cột do ứng dụng đọc tự đoán theo **locale máy**. Windows tiếng Việt lấy dấu chấm
 * phẩy làm mặc định nên file dồn hết vào cột A. Thêm nữa ba bảng (tóm tắt / theo kỳ / phân rã)
 * có số cột khác nhau, nhồi chung một file CSV thì kiểu gì cũng lệch.
 *
 * `.xlsx` giải quyết tận gốc: cột là cột thật, **ba sheet riêng**, số là số (định dạng
 * `#,##0` nên Excel tự chấm phân cách theo máy người xem và **cộng được**), phần trăm là
 * kiểu phần trăm thật, tiêu đề in đậm và **đóng băng dòng đầu** để cuộn vẫn thấy tên cột.
 */

// Định dạng số: tiền để nguyên số, Excel tự hiển thị phân cách nghìn theo locale người xem —
// tự chèn dấu chấm vào chuỗi là biến số thành chữ, mất khả năng tính toán.
const MONEY = '#,##0';
const PERCENT = '0.00%';
const HEADER_BG = '#F1F5F9';
const TOTAL_BG = '#F8FAFC';

const GROUP_LABEL: Record<RevenueBreakdownGroupBy, string> = {
  partner: 'Partner',
  hotel: 'Hotel',
  city: 'City',
};

interface BuildArgs {
  range: DateRange;
  summary: RevenueSummary | undefined;
  points: RevenueTimePoint[];
  /** Bucket THẬT của chuỗi đang hiển thị — dùng để loại kỳ tương lai đúng như biểu đồ. */
  bucket: RevenueBucket;
  compare: boolean;
  groupBy: RevenueBreakdownGroupBy;
  partnerFilter: { id: string; name: string } | null;
  breakdown: AdminRevenueBreakdown | undefined;
  /** Kỳ kéo qua tương lai ⇒ ngày thực tế mà số liệu dừng lại. */
  partialTo: string | null;
  /** Đã format sẵn ở trang (dd-MM-yyyy) để file dùng chung một kiểu ngày với màn hình. */
  labels: { period: string; asOf: string; exported: string; partialTo: string };
}

// ─── Cell helpers ────────────────────────────────────────────────────────────

const title = (text: string): Row => [
  { value: text, fontWeight: 'bold', fontSize: 14 },
];

const metaRow = (label: string, value: string): Row => [
  { value: label, fontWeight: 'bold', textColor: '#64748B' },
  { value, type: String },
];

const headerCell = (text: string, align?: 'left' | 'right') => ({
  value: text,
  fontWeight: 'bold' as const,
  backgroundColor: HEADER_BG,
  align,
  wrap: true,
});

/** Ô tiền: **số thật** + định dạng, để Excel cộng được. `null` khi không có giá trị. */
const money = (v: string | number | null | undefined, bold = false) => {
  const n = v === null || v === undefined || v === '' ? NaN : Number(v);
  return {
    value: Number.isFinite(n) ? Math.round(n) : undefined,
    type: Number,
    format: MONEY,
    align: 'right' as const,
    fontWeight: bold ? ('bold' as const) : undefined,
  };
};

/** Ô phần trăm: lưu **phân số** (0.1178) + định dạng `0.00%` ⇒ Excel hiện `11.78%` và vẫn là số. */
const percent = (pct: number | null | undefined, bold = false) => ({
  value: pct === null || pct === undefined || !Number.isFinite(pct) ? undefined : pct / 100,
  type: Number,
  format: PERCENT,
  align: 'right' as const,
  fontWeight: bold ? ('bold' as const) : undefined,
});

const count = (v: number, bold = false) => ({
  value: v,
  type: Number,
  format: '#,##0',
  align: 'right' as const,
  fontWeight: bold ? ('bold' as const) : undefined,
});

const text = (v: string, bold = false) => ({
  value: v,
  type: String,
  fontWeight: bold ? ('bold' as const) : undefined,
});

// ─── Sheets ──────────────────────────────────────────────────────────────────

function summarySheet(args: BuildArgs): Sheet<Blob> {
  const { summary, labels, partialTo } = args;
  const data: Row[] = [
    title('Platform revenue'),
    metaRow('Period', labels.period),
  ];

  if (partialTo) {
    data.push(
      metaRow('Note', `Figures only cover up to ${labels.partialTo}`)
    );
  }
  data.push(metaRow('Currency', summary?.currency ?? 'VND'));
  data.push(metaRow('Data as of', labels.asOf));
  data.push(metaRow('Exported', labels.exported));
  data.push([]);

  data.push([headerCell('Metric'), headerCell('Value', 'right')]);

  if (summary) {
    const { kpis } = summary;
    const line = (
      label: string,
      cell: ReturnType<typeof money> | ReturnType<typeof percent> | ReturnType<typeof count>
    ): Row => [text(label), cell];

    data.push(
      line('Platform revenue (commission)', money(kpis.totalCommission.value, true)),
      line('Gross booking value (GMV)', money(kpis.grossRevenue.value)),
      // `takeRatePct` của BE — không tự chia lại commission/GMV.
      line('Take rate', percent(kpis.takeRate.value)),
      line('Bookings', count(kpis.bookings.value)),
      line('Average booking value', money(summary.avgBookingValue)),
      line('Commission settled', money(summary.commissionSettled)),
      line('Commission pending', money(summary.commissionPending)),
      // Hai khoản NẰM NGOÀI doanh thu — nói rõ ngay trong nhãn vì file không có tooltip.
      line(
        'Commission disputed (excluded from revenue)',
        money(summary.commissionDisputed)
      ),
      line('Refunded to guests', money(summary.refunded))
    );
  }

  return {
    sheet: 'Summary',
    data,
    columns: [{ width: 42 }, { width: 20 }],
  };
}

function timeSeriesSheet(args: BuildArgs): Sheet<Blob> | null {
  const { points, bucket, compare } = args;
  // Bỏ kỳ tương lai bằng ĐÚNG luật của biểu đồ: preset "This quarter" kéo tới hết quý nên BE
  // trả bucket rỗng của tháng chưa tới — để lại thì sheet có dòng toàn số 0 mà màn hình không có.
  const charted = dropFuturePeriods(points, bucket);
  if (charted.length === 0) return null;

  const header: Row = [
    headerCell('Period'),
    headerCell('Bookings', 'right'),
    headerCell('Gross booking value', 'right'),
    headerCell('Platform commission', 'right'),
    headerCell('Paid out to hotels', 'right'),
    headerCell('Take rate', 'right'),
  ];
  if (compare) header.push(headerCell('Previous period GMV', 'right'));

  const rows: Row[] = charted.map(p => {
    const gmv = Number(p.revenue);
    const commission = Number(p.commission);
    const row: Row = [
      text(p.period),
      count(p.bookings),
      money(p.revenue),
      money(p.commission),
      // Cột này chính là phần xám của cột chồng trên biểu đồ — cộng ngang ra đúng GMV.
      money(Math.max(0, gmv - commission)),
      percent(gmv > 0 ? (commission / gmv) * 100 : null),
    ];
    if (compare) row.push(money(p.previousRevenue));
    return row;
  });

  const totalGmv = charted.reduce((s, p) => s + Number(p.revenue), 0);
  const totalCommission = charted.reduce((s, p) => s + Number(p.commission), 0);
  const totalRow: Row = [
    { ...text('TOTAL', true), backgroundColor: TOTAL_BG, topBorderStyle: 'thin' },
    { ...count(charted.reduce((s, p) => s + p.bookings, 0), true), backgroundColor: TOTAL_BG },
    { ...money(totalGmv, true), backgroundColor: TOTAL_BG },
    { ...money(totalCommission, true), backgroundColor: TOTAL_BG },
    { ...money(Math.max(0, totalGmv - totalCommission), true), backgroundColor: TOTAL_BG },
    {
      ...percent(totalGmv > 0 ? (totalCommission / totalGmv) * 100 : null, true),
      backgroundColor: TOTAL_BG,
    },
  ];
  if (compare) totalRow.push({ value: undefined, backgroundColor: TOTAL_BG });

  return {
    sheet: 'Revenue over time',
    data: [header, ...rows, totalRow],
    // Đóng băng dòng tiêu đề — cuộn xuống vẫn biết mình đang đọc cột nào.
    stickyRowsCount: 1,
    columns: [
      { width: 14 },
      { width: 11 },
      { width: 22 },
      { width: 22 },
      { width: 22 },
      { width: 12 },
      ...(compare ? [{ width: 22 }] : []),
    ],
  };
}

function breakdownSheet(args: BuildArgs): Sheet<Blob> | null {
  const { breakdown, groupBy, partnerFilter } = args;
  if (!breakdown || breakdown.results.length === 0) return null;

  const label = GROUP_LABEL[groupBy];
  const byHotel = groupBy === 'hotel';

  const header: Row = [
    headerCell(label),
    headerCell(byHotel ? 'City' : 'Hotels', byHotel ? undefined : 'right'),
    ...(byHotel ? [headerCell('Partner')] : []),
    headerCell('Bookings', 'right'),
    headerCell('Gross booking value', 'right'),
    headerCell('Commission rate (avg this period)', 'right'),
    headerCell('Platform commission', 'right'),
    headerCell('Refunded', 'right'),
    headerCell('Share of commission', 'right'),
  ];

  const rows: Row[] = breakdown.results.map(r => breakdownRow(r, byHotel));

  const totalRow: Row = [
    { ...text('TOTAL (all groups)', true), backgroundColor: TOTAL_BG, topBorderStyle: 'thin' },
    { value: undefined, backgroundColor: TOTAL_BG },
    ...(byHotel ? [{ value: undefined, backgroundColor: TOTAL_BG }] : []),
    { ...count(breakdown.totals.bookingCount, true), backgroundColor: TOTAL_BG },
    { ...money(breakdown.totals.gmv, true), backgroundColor: TOTAL_BG },
    // Tỉ lệ tổng KHÔNG phải trung bình các dòng, cũng không tính được bằng commission/GMV.
    { value: undefined, backgroundColor: TOTAL_BG },
    { ...money(breakdown.totals.commission, true), backgroundColor: TOTAL_BG },
    { ...money(breakdown.totals.refunded, true), backgroundColor: TOTAL_BG },
    { ...percent(100, true), backgroundColor: TOTAL_BG },
  ];

  const data: Row[] = [header, ...rows, totalRow];

  // Không cắt trong im lặng: vượt trần thì nói ra ngay trong file.
  if (breakdown.totalResults > breakdown.results.length) {
    data.push([]);
    data.push([
      {
        value: `Only the top ${breakdown.results.length} of ${breakdown.totalResults} groups are included (export limit).`,
        fontStyle: 'italic',
        textColor: '#B45309',
      },
    ]);
  }

  return {
    sheet: partnerFilter
      ? `Hotels of ${partnerFilter.name}`.slice(0, 31)
      : `By ${label.toLowerCase()}`,
    data,
    stickyRowsCount: 1,
    columns: [
      { width: 34 },
      { width: byHotel ? 18 : 10 },
      ...(byHotel ? [{ width: 30 }] : []),
      { width: 11 },
      { width: 22 },
      { width: 26 },
      { width: 22 },
      { width: 18 },
      { width: 18 },
    ],
  };
}

/** Ba shape dòng khác nhau tuỳ `groupBy` — tra bằng type guard, không ép kiểu. */
function breakdownRow(row: RevenueBreakdownRow, byHotel: boolean): Row {
  const hotel = isHotelRow(row) ? row : null;
  const partner = isPartnerRow(row) ? row : null;

  const name = hotel
    ? (hotel.name ?? 'Unnamed hotel')
    : partner
      ? (partner.name ?? 'Unnamed partner')
      : (('city' in row ? row.city : null) ?? 'Unknown city');

  const second: Row[number] = hotel
    ? text(hotel.city ?? '—')
    : 'hotelCount' in row && row.hotelCount !== null
      ? count(row.hotelCount)
      : text('—');

  return [
    text(name),
    second,
    ...(byHotel ? [text(hotel?.partnerName ?? '—')] : []),
    count(row.bookingCount),
    money(row.gmv),
    // `commissionRatePct` của BE, KHÔNG phải commission/GMV (hoàn tiền làm hai vế lệch mẫu số).
    percent(Number(row.commissionRatePct)),
    money(row.commission),
    money(row.refunded),
    percent(row.sharePct),
  ];
}

// ─── Public API ──────────────────────────────────────────────────────────────

/** Dựng và tải file `.xlsx` gồm 3 sheet: Summary · Revenue over time · Breakdown. */
export async function exportRevenueWorkbook(
  fileName: string,
  args: BuildArgs
): Promise<void> {
  const sheets = [
    summarySheet(args),
    timeSeriesSheet(args),
    breakdownSheet(args),
  ].filter((s): s is Sheet<Blob> => s !== null);

  // Nạp thư viện LÚC BẤM, không nằm trong bundle chính: nó chỉ phục vụ một nút mà mọi người
  // dùng app đều phải tải. Đây cũng là lý do hàm gọi có trạng thái "Preparing…".
  const { default: writeXlsxFile } = await import('write-excel-file/browser');

  await writeXlsxFile(sheets, { fontFamily: 'Calibri', fontSize: 11 }).toFile(
    fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`
  );
}
