import { useState } from 'react';
import { Download, Info, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import {
  useRevenueBreakdown,
  useRevenueSummary,
  useRevenueTimeSeries,
} from '@/hooks/revenue';
import type {
  RevenueBreakdownGroupBy,
  RevenueBreakdownSortBy,
} from '@/types/admin.types';
import { adminService } from '@/services/admin.service';
import { errorMessage } from '@/utils/errorMessage';
import { formatDate, toDateInputValue } from '@/utils/formatDate';
import {
  BREAKDOWN_EXPORT_LIMIT,
  exportRevenueWorkbook,
} from './revenueReport';
import type { DateRange } from '@/types/revenue.types';
import { RevenueDateRangePicker } from '@/components/manager/revenue/RevenueDateRangePicker';
import {
  resolvePreset,
  type RangePreset,
} from '@/components/shared/date-range-presets';
import { RevenueKpiCards } from '@/components/manager/revenue/RevenueKpiCards';
import { RevenueVsCommissionChart } from '@/components/manager/revenue/RevenueVsCommissionChart';
import {
  RevenueBreakdownTable,
  type HotelDrillTarget,
} from '@/components/manager/revenue/RevenueBreakdownTable';
import { RevenueHotelDetailModal } from '@/components/manager/revenue/RevenueHotelDetailModal';

const BREAKDOWN_PAGE_SIZE = 10;

/** "Số liệu tính đến HH:mm" — giờ máy người xem, đủ để biết số có mới hay không. */
function formatAsOf(iso: string | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** "07-08-2026 21:35" — dùng cho khối ngữ cảnh của file xuất. */
function formatDateTime(iso: string): string {
  const time = formatAsOf(iso);
  return time ? `${formatDate(iso)} ${time}` : formatDate(iso);
}

export default function RevenuePage() {
  const [range, setRange] = useState<DateRange>(() =>
    resolvePreset('thisMonth')
  );
  const [preset, setPreset] = useState<RangePreset>('thisMonth');
  const [compare, setCompare] = useState(false);

  // ─── Breakdown (drill-down của KPI phía trên) ───
  const [groupBy, setGroupBy] = useState<RevenueBreakdownGroupBy>('partner');
  const [sortBy, setSortBy] = useState<RevenueBreakdownSortBy>('commission');
  const [page, setPage] = useState(1);
  const [partnerFilter, setPartnerFilter] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [hotelDrill, setHotelDrill] = useState<HotelDrillTarget | null>(null);
  const [exporting, setExporting] = useState(false);

  const summary = useRevenueSummary(range);
  const timeSeries = useRevenueTimeSeries({ ...range, compare });
  const breakdown = useRevenueBreakdown({
    ...range,
    groupBy,
    sortBy,
    page,
    limit: BREAKDOWN_PAGE_SIZE,
    // `partnerId` chỉ có nghĩa khi gộp theo khách sạn — gửi kèm ở chiều khác thì backend
    // sẽ lọc luôn danh sách đối tác/thành phố xuống còn một dòng, không phải ý người dùng.
    ...(groupBy === 'hotel' && partnerFilter
      ? { partnerId: partnerFilter.id }
      : {}),
  });

  const handleRangeChange = (next: DateRange, nextPreset: RangePreset) => {
    setRange(next);
    setPreset(nextPreset);
    setPage(1);
  };

  const handleGroupByChange = (next: RevenueBreakdownGroupBy) => {
    setGroupBy(next);
    setPage(1);
    if (next !== 'hotel') setPartnerFilter(null);
  };

  const handleDrillIntoPartner = (partner: { id: string; name: string }) => {
    setPartnerFilter(partner);
    setGroupBy('hotel');
    setPage(1);
  };

  // `asOf` của summary và của breakdown là hai lần chốt số khác nhau (hai request), nhưng
  // chênh nhau vài giây nên chỉ hiện một mốc ở header là đủ.
  const asOf = formatAsOf(summary.data?.asOf);

  // Kỳ đang chọn kéo qua tương lai ⇒ số liệu chỉ tới hôm nay. `null` khi kỳ đã trọn vẹn.
  const today = toDateInputValue(new Date());
  const partialTo = range.to > today ? today : null;

  /**
   * Xuất **toàn bộ những gì đang hiện trên màn hình** thành một file báo cáo nhiều khối:
   * KPI tóm tắt → chuỗi thời gian (dữ liệu của biểu đồ) → bảng phân rã.
   *
   * Bảng phân rã trên màn hình đang phân trang 10 dòng, nhưng file chỉ có 10 dòng trong khi
   * kỳ có 45 nhóm thì là báo cáo SAI, không phải báo cáo gọn ⇒ gọi lại endpoint với `limit`
   * tối đa để lấy đủ. Vượt trần 100 thì nói thẳng trong file, không cắt im lặng.
   */
  const handleExport = async () => {
    const points = timeSeries.data?.points ?? [];
    const summaryData = summary.data;
    if (points.length === 0 && !summaryData) {
      toast.error('No data to export for the selected period');
      return;
    }

    setExporting(true);
    try {
      const fullBreakdown = await adminService.getRevenueBreakdown({
        ...range,
        groupBy,
        sortBy,
        limit: BREAKDOWN_EXPORT_LIMIT,
        ...(groupBy === 'hotel' && partnerFilter
          ? { partnerId: partnerFilter.id }
          : {}),
      });

      await exportRevenueWorkbook(
        `platform-revenue_${range.from}_${range.to}`,
        {
          range,
          summary: summaryData,
          points,
          bucket: timeSeries.data?.bucket ?? 'day',
          compare,
          groupBy,
          partnerFilter,
          breakdown: fullBreakdown,
          partialTo,
          labels: {
            period: `${formatDate(range.from)} – ${formatDate(range.to)}`,
            asOf: summaryData ? formatDateTime(summaryData.asOf) : '—',
            exported: formatDateTime(new Date().toISOString()),
            partialTo: partialTo ? formatDate(partialTo) : '',
          },
        }
      );
      toast.success('Excel report downloaded');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not export the report'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-role-manager-light rounded-lg">
              <TrendingUp className="w-6 h-6 text-role-manager-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Platform Revenue
              </h1>
              <p className="text-slate-500 text-sm">
                What guests paid, and how much of it the platform kept
                {asOf && (
                  <span className="text-slate-400"> · data as of {asOf}</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <RevenueDateRangePicker
              value={range}
              preset={preset}
              onChange={handleRangeChange}
            />
            <button
              type="button"
              onClick={handleExport}
              disabled={timeSeries.isLoading || exporting}
              title="Download everything on this page as Excel: summary, chart data and the full breakdown — one sheet each"
              className="flex items-center gap-2 text-sm font-medium text-white bg-role-manager-primary rounded-lg px-3 py-2 hover:bg-role-manager-secondary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              {exporting ? 'Preparing…' : 'Export Excel'}
            </button>
          </div>
        </div>

        {/* Preset như "This quarter" kéo tới hết quý (30/09) trong khi hôm nay mới 07/08 ⇒
            mọi con số trên trang chỉ tính tới hôm nay. Không nói ra thì người đọc so kỳ này
            với một kỳ ĐÃ TRỌN VẸN và kết luận nhầm là doanh thu đang giảm. */}
        {partialTo && (
          <p className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            <Info className="h-3.5 w-3.5 shrink-0" />
            This period runs to {formatDate(range.to)} — figures below only
            cover up to today ({formatDate(partialTo)}).
          </p>
        )}
      </div>

      {/* KPI Cards */}
      <RevenueKpiCards
        data={summary.data}
        isLoading={summary.isLoading}
        isError={summary.isError}
        onRetry={() => summary.refetch()}
      />

      <RevenueVsCommissionChart
        data={timeSeries.data}
        isLoading={timeSeries.isLoading}
        isError={timeSeries.isError}
        onRetry={() => timeSeries.refetch()}
        compare={compare}
        onToggleCompare={() => setCompare(c => !c)}
      />

      <RevenueBreakdownTable
        data={breakdown.data}
        isLoading={breakdown.isLoading}
        isError={breakdown.isError}
        onRetry={() => breakdown.refetch()}
        groupBy={groupBy}
        onGroupByChange={handleGroupByChange}
        sortBy={sortBy}
        onSortByChange={next => {
          setSortBy(next);
          setPage(1);
        }}
        page={page}
        onPageChange={setPage}
        partnerFilter={partnerFilter}
        onDrillIntoPartner={handleDrillIntoPartner}
        onClearPartnerFilter={() => {
          setPartnerFilter(null);
          setPage(1);
        }}
        onOpenHotel={setHotelDrill}
      />

      <RevenueHotelDetailModal
        hotel={hotelDrill}
        range={range}
        onClose={() => setHotelDrill(null)}
      />
    </div>
  );
}
