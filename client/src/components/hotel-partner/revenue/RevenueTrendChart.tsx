import {
  BarChart,
  Bar,
  LabelList,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCompactVnd, formatVndFull } from '@/utils/formatCurrency';
import type {
  HotelRevenueGroupBy,
  HotelRevenueSeriesPoint,
} from '@/types/hotel-revenue.types';

interface RevenueTrendChartProps {
  series: HotelRevenueSeriesPoint[];
  groupBy: HotelRevenueGroupBy;
}

interface TrendRow {
  period: string;
  periodLabel: string;
  gross: number;
  net: number;
  commission: number;
}

interface TrendTooltipProps {
  active?: boolean;
  payload?: Array<{ payload?: TrendRow }>;
}

/**
 * Net (giữ lại) và Commission (trả sàn) — **màu đã chạy qua validator** của skill dataviz
 * ở nền sáng: CVD ΔE 8.9 (đạt), tương phản nền dưới 3:1 nên bắt buộc có nhãn nhìn thấy được
 * (legend + tooltip + nhãn tổng trên đầu cột) làm bù trừ. Trùng đúng màu icon KPI phía trên
 * để mắt nối được số với cột.
 */
const NET_COLOR = '#10b981';
const COMMISSION_COLOR = '#f59e0b';

/** Trên ngưỡng này thì nhãn tổng trên đầu cột bắt đầu chồng nhau ⇒ chỉ để tooltip. */
const DIRECT_LABEL_MAX_BARS = 12;

/**
 * `period` của BE là `YYYY-MM-DD` (day) hoặc `YYYY-MM` (month) — đọc trên trục X thì dài
 * và không cho biết đang xem theo ngày hay theo tháng. Rút gọn tại chỗ hiển thị,
 * giữ nguyên chuỗi gốc cho tooltip.
 */
function axisLabel(period: string, groupBy: HotelRevenueGroupBy): string {
  const [y, m, d] = period.split('-');
  if (groupBy === 'month') return m ? `${m}/${y}` : period;
  return d ? `${d}/${m}` : period;
}

/** Tooltip: tổng (gross) in đậm ở trên, rồi tách Net / Commission với số VND đầy đủ. */
function ChartTooltip({ active, payload }: TrendTooltipProps) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-slate-800">{row.periodLabel}</p>
      <p className="mb-1.5 text-slate-500">
        Gross{' '}
        <span className="font-medium text-slate-800">
          {formatVndFull(row.gross)}
        </span>
      </p>
      {[
        { name: 'Net revenue', value: row.net, color: NET_COLOR },
        { name: 'Commission', value: row.commission, color: COMMISSION_COLOR },
      ].map(entry => (
        <div key={entry.name} className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: entry.color }}
          />
          <span className="text-slate-500">{entry.name}:</span>
          <span className="font-medium text-slate-800">
            {formatVndFull(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Doanh thu từng kỳ dưới dạng **cột chồng**: Net (giữ lại) + Commission (trả sàn),
 * nên chiều cao cả cột **chính là Gross** — backend tính `net = gross − commission`
 * (`server/src/services/revenue.service.ts:57,116`) nên phép cộng này khớp tuyệt đối,
 * không phải xấp xỉ cho đẹp.
 *
 * **CỐ Ý KHÔNG vẽ Gross thành cột thứ ba** và **không dùng hai trục Y**: hoa hồng chỉ
 * bằng ~15% doanh thu, cho nó trục riêng sẽ vẽ cột hoa hồng cao ngang cột doanh thu —
 * cùng chiều cao nhưng khác đơn vị là đọc sai tỷ lệ. Một trục duy nhất, cột hoa hồng
 * nhỏ đúng như nó nhỏ thật.
 */
export function RevenueTrendChart({ series, groupBy }: RevenueTrendChartProps) {
  const data: TrendRow[] = series.map(p => ({
    period: axisLabel(p.period, groupBy),
    periodLabel: p.period,
    gross: Number(p.gross),
    net: Number(p.net),
    commission: Number(p.commission),
  }));

  const showValueLabels = data.length <= DIRECT_LABEL_MAX_BARS;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 24, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="period"
          tick={{ fontSize: 12, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={16}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          width={52}
          /*
           * Bỏ đuôi " VNĐ" trên tick: chuỗi "300K VNĐ" dài hơn bề rộng trục nên recharts
           * **ngắt xuống hai dòng** (đã thấy trên trình duyệt: "300K" / "VNĐ"). Đơn vị đã nằm
           * ở tooltip, nhãn tổng trên đầu cột và các thẻ KPI ngay phía trên.
           */
          tickFormatter={v => formatCompactVnd(v).replace(' VNĐ', '')}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8fafc' }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />

        {/* Đáy cột neo vào trục nên để vuông; chỉ đầu cột (đầu dữ liệu) bo 4px. */}
        <Bar
          dataKey="net"
          name="Net revenue"
          stackId="revenue"
          fill={NET_COLOR}
          stroke="#ffffff"
          strokeWidth={2}
          maxBarSize={44}
        />
        <Bar
          dataKey="commission"
          name="Commission"
          stackId="revenue"
          fill={COMMISSION_COLOR}
          stroke="#ffffff"
          strokeWidth={2}
          radius={[4, 4, 0, 0]}
          maxBarSize={44}
        >
          {showValueLabels && (
            <LabelList
              dataKey="gross"
              position="top"
              offset={8}
              fontSize={11}
              fill="#64748b"
              /*
               * Cũng bỏ " VNĐ" như tick trục Y: nhãn bị bó theo bề rộng cột (44px) nên
               * "300K VNĐ" xuống hai dòng và dòng trên **bị cắt** ở mép trên biểu đồ.
               */
              formatter={v =>
                formatCompactVnd(typeof v === 'number' ? v : null).replace(' VNĐ', '')
              }
            />
          )}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
