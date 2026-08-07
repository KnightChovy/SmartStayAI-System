import { ArrowDown, ChevronRight, Info, Layers, X } from 'lucide-react';
import AppPagination from '@/common/pagination/AppPagination';
import { TableSkeleton } from '@/components/shared/skeletons';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';
import { formatCompactVnd, formatVndFull } from '@/utils/formatCurrency';
import {
  isHotelRow,
  isPartnerRow,
  type AdminRevenueBreakdown,
  type RevenueBreakdownGroupBy,
  type RevenueBreakdownRow,
  type RevenueBreakdownSortBy,
  type RevenueBreakdownTotals,
} from '@/types/admin.types';
import { SectionEmpty, SectionError } from './states';

const GROUP_OPTIONS: { value: RevenueBreakdownGroupBy; label: string }[] = [
  { value: 'partner', label: 'By partner' },
  { value: 'hotel', label: 'By hotel' },
  { value: 'city', label: 'By city' },
];

export interface HotelDrillTarget {
  id: string;
  name: string;
}

interface RevenueBreakdownTableProps {
  data: AdminRevenueBreakdown | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  groupBy: RevenueBreakdownGroupBy;
  onGroupByChange: (next: RevenueBreakdownGroupBy) => void;
  sortBy: RevenueBreakdownSortBy;
  onSortByChange: (next: RevenueBreakdownSortBy) => void;
  page: number;
  onPageChange: (next: number) => void;
  /** Đang lọc theo 1 đối tác (drill-down từ hàng partner). */
  partnerFilter: { id: string; name: string } | null;
  onDrillIntoPartner: (partner: { id: string; name: string }) => void;
  onClearPartnerFilter: () => void;
  /** Mở khối chi tiết doanh thu của một khách sạn (dòng `groupBy=hotel`). */
  onOpenHotel: (hotel: HotelDrillTarget) => void;
}

export function RevenueBreakdownTable({
  data,
  isLoading,
  isError,
  onRetry,
  groupBy,
  onGroupByChange,
  sortBy,
  onSortByChange,
  page,
  onPageChange,
  partnerFilter,
  onDrillIntoPartner,
  onClearPartnerFilter,
  onOpenHotel,
}: RevenueBreakdownTableProps) {
  const rows = data?.results ?? [];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-role-manager-light p-2">
            <Layers className="h-5 w-5 text-role-manager-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Revenue breakdown</h2>
          </div>
        </div>

        {/* Chỉ còn MỘT bộ điều khiển ở đây. Việc sắp xếp chuyển xuống chính tiêu đề cột —
            đó là chỗ người dùng đi tìm nó, và bỏ được một dropdown đặt xa dữ liệu. */}
        <Segmented
          options={GROUP_OPTIONS}
          value={groupBy}
          onChange={onGroupByChange}
        />
      </div>

      {/* Chip drill-down: nói rõ đang xem khách sạn CỦA AI, và cho đường thoát ra. */}
      {partnerFilter && (
        <div className="mb-4 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-role-manager-light px-3 py-1 text-xs font-medium text-role-manager-primary">
            Hotels of {partnerFilter.name}
            <button
              type="button"
              onClick={onClearPartnerFilter}
              aria-label="Clear partner filter"
              className="rounded-full p-0.5 hover:bg-white/60"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        </div>
      )}

      {isError ? (
        <SectionError onRetry={onRetry} />
      ) : isLoading && !data ? (
        <TableSkeleton rows={6} columns={7} className="border-0" />
      ) : rows.length === 0 ? (
        <SectionEmpty message="No revenue attributed to any group in this period" />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-200 text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3 text-left font-semibold">
                    {groupBy === 'city'
                      ? 'City'
                      : groupBy === 'hotel'
                        ? 'Hotel'
                        : 'Partner'}
                  </th>
                  <SortableHeader
                    label="Bookings"
                    column="bookingCount"
                    sortBy={sortBy}
                    onSort={onSortByChange}
                  />
                  <SortableHeader
                    label="GMV"
                    column="gmv"
                    sortBy={sortBy}
                    onSort={onSortByChange}
                  />
                  <th className="px-3 py-3 text-right font-semibold">
                    <HeaderHint label="Comm. rate">
                      Weighted average rate actually charged in this period,
                      taken from the rate frozen at payment time. It is
                      deliberately not commission ÷ GMV — a refund recalculates
                      the commission but leaves GMV untouched, so dividing gives
                      a wrong number.
                    </HeaderHint>
                  </th>
                  <SortableHeader
                    label="Commission"
                    column="commission"
                    sortBy={sortBy}
                    onSort={onSortByChange}
                  />
                  <th className="px-3 py-3 text-right font-semibold">
                    Refunded
                  </th>
                  <th className="w-32 px-3 py-3 text-left font-semibold">
                    <HeaderHint label="Share">
                      Share of the sorted column across every group in the
                      period — not just this page.
                    </HeaderHint>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map(row => (
                  <Row
                    key={rowKey(row)}
                    row={row}
                    sortBy={sortBy}
                    totals={data?.totals}
                    onDrillIntoPartner={onDrillIntoPartner}
                    onOpenHotel={onOpenHotel}
                  />
                ))}
              </tbody>
              {data && <TotalsRow totals={data.totals} />}
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Showing {(data!.page - 1) * data!.limit + 1}–
              {(data!.page - 1) * data!.limit + rows.length} of{' '}
              {data!.totalResults}
            </p>
            {data!.totalPages > 1 && (
              <AppPagination
                currentPage={page}
                totalPages={data!.totalPages}
                onPageChange={onPageChange}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Row({
  row,
  sortBy,
  totals,
  onDrillIntoPartner,
  onOpenHotel,
}: {
  row: RevenueBreakdownRow;
  sortBy: RevenueBreakdownSortBy;
  totals: RevenueBreakdownTotals | undefined;
  onDrillIntoPartner: (partner: { id: string; name: string }) => void;
  onOpenHotel: (hotel: HotelDrillTarget) => void;
}) {
  const partner = isPartnerRow(row) ? row : null;
  const hotel = isHotelRow(row) ? row : null;

  const label = partner
    ? (partner.name ?? 'Unnamed partner')
    : hotel
      ? (hotel.name ?? 'Unnamed hotel')
      : ((!partner && !hotel && 'city' in row ? row.city : null) ??
        'Unknown city');

  const meta = partner
    ? plural(partner.hotelCount, 'hotel')
    : hotel
      ? (hotel.city ?? '—')
      : !partner && !hotel && 'hotelCount' in row
        ? plural(row.hotelCount, 'hotel')
        : null;

  // Đối tác drill xuống danh sách khách sạn của họ; khách sạn mở khối doanh thu chi tiết.
  // Dòng thành phố không có tầng dưới nào để đi tiếp nên cố ý không giả vờ bấm được.
  const onOpen = partner
    ? () =>
        onDrillIntoPartner({
          id: partner.partnerId,
          name: partner.name ?? 'Unnamed partner',
        })
    : hotel
      ? () =>
          onOpenHotel({
            id: hotel.hotelId,
            name: hotel.name ?? 'Unnamed hotel',
          })
      : undefined;

  return (
    <tr
      className={cn(
        'text-slate-700',
        onOpen && 'cursor-pointer transition-colors hover:bg-slate-50/60'
      )}
      onClick={onOpen}
    >
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-900" title={label}>
              {label}
            </p>
            {meta && <p className="text-xs text-slate-400">{meta}</p>}
          </div>
          {onOpen && (
            <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-slate-300" />
          )}
        </div>
      </td>
      <td className="px-3 py-3 text-right tabular-nums">
        {row.bookingCount.toLocaleString('vi-VN')}
      </td>
      <td
        className="px-3 py-3 text-right tabular-nums"
        title={formatVndFull(row.gmv)}
      >
        {formatCompactVnd(row.gmv)}
      </td>
      <td className="px-3 py-3 text-right tabular-nums text-slate-500">
        {formatRatePct(row.commissionRatePct)}
      </td>
      <td
        className="px-3 py-3 text-right font-semibold tabular-nums text-slate-900"
        title={formatVndFull(row.commission)}
      >
        {formatCompactVnd(row.commission)}
      </td>
      <td
        className={cn(
          'px-3 py-3 text-right tabular-nums',
          Number(row.refunded) > 0 ? 'text-red-600' : 'text-slate-400'
        )}
        title={formatVndFull(row.refunded)}
      >
        {formatCompactVnd(row.refunded)}
      </td>
      <td className="px-3 py-3">
        <ShareBar row={row} sortBy={sortBy} totals={totals} />
      </td>
    </tr>
  );
}

/** Tổng TOÀN BỘ nhóm trong kỳ (không phải tổng của trang) — để đọc được mà không phải cộng tay. */
function TotalsRow({ totals }: { totals: RevenueBreakdownTotals }) {
  return (
    <tfoot>
      <tr className="border-t-2 border-slate-200 text-xs text-slate-600">
        <td className="px-3 py-3 font-semibold uppercase tracking-wide text-slate-500">
          Totals
        </td>
        <td className="px-3 py-3 text-right font-semibold tabular-nums">
          {totals.bookingCount.toLocaleString('vi-VN')}
        </td>
        <td
          className="px-3 py-3 text-right font-semibold tabular-nums"
          title={formatVndFull(totals.gmv)}
        >
          {formatCompactVnd(totals.gmv)}
        </td>
        {/* Cố ý để trống: tỉ lệ tổng không phải trung bình của các dòng, và cũng không
            tính được bằng commission/gmv (xem chú thích ở header cột). */}
        <td className="px-3 py-3 text-right text-slate-300">—</td>
        <td
          className="px-3 py-3 text-right font-semibold tabular-nums text-slate-900"
          title={formatVndFull(totals.commission)}
        >
          {formatCompactVnd(totals.commission)}
        </td>
        <td
          className="px-3 py-3 text-right font-semibold tabular-nums"
          title={formatVndFull(totals.refunded)}
        >
          {formatCompactVnd(totals.refunded)}
        </td>
        <td className="px-3 py-3 text-slate-400">100%</td>
      </tr>
    </tfoot>
  );
}

/**
 * Thanh tỷ trọng **một sắc** (sequential) — đo độ lớn, không phải phân biệt danh tính, nên
 * không dùng bảng màu phân loại. Bám theo đúng tiêu chí đang sắp xếp để chiều dài thanh
 * khớp thứ tự dòng; lệch nhau thì bảng đọc như bị sắp sai.
 */
function ShareBar({
  row,
  sortBy,
  totals,
}: {
  row: RevenueBreakdownRow;
  sortBy: RevenueBreakdownSortBy;
  totals: RevenueBreakdownTotals | undefined;
}) {
  // Tiêu chí `commission` dùng thẳng `sharePct` của BE (đã tính trên tổng toàn bộ nhóm).
  // Hai tiêu chí còn lại BE không có sẵn nên chia trên `totals` — vẫn là tổng TOÀN SÀN,
  // không phải tổng của trang: lấy tổng trang làm mẫu số sẽ ra tỷ lệ sai mà nhìn vẫn
  // "hợp lý", và dòng đầu trang nào cũng thành 100%.
  let pct: number | null = null;
  if (sortBy === 'commission') {
    pct = row.sharePct;
  } else if (totals) {
    const total =
      sortBy === 'bookingCount' ? totals.bookingCount : Number(totals[sortBy]);
    const value =
      sortBy === 'bookingCount' ? row.bookingCount : Number(row[sortBy]);
    if (Number.isFinite(total) && total > 0) pct = (value / total) * 100;
  }

  if (pct === null || !Number.isFinite(pct)) {
    return <span className="text-xs text-slate-300">—</span>;
  }

  const clamped = Math.max(0, Math.min(100, pct));

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-role-manager-primary"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="w-10 shrink-0 text-right text-xs tabular-nums text-slate-500">
        {clamped >= 0.1 ? clamped.toFixed(1) : '<0.1'}%
      </span>
    </div>
  );
}

/**
 * Tiêu đề cột bấm được để đổi tiêu chí sắp xếp.
 *
 * Backend **chỉ sắp giảm dần**, không có chiều tăng — nên bấm lại cột đang chọn là no-op
 * chứ không đảo chiều. Mũi tên luôn chỉ xuống để không hứa một thao tác không tồn tại.
 */
function SortableHeader({
  label,
  column,
  sortBy,
  onSort,
}: {
  label: string;
  column: RevenueBreakdownSortBy;
  sortBy: RevenueBreakdownSortBy;
  onSort: (next: RevenueBreakdownSortBy) => void;
}) {
  const active = sortBy === column;
  return (
    <th
      className="px-3 py-3 text-right font-semibold"
      aria-sort={active ? 'descending' : 'none'}
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        title={active ? `Sorted by ${label}, highest first` : `Sort by ${label}`}
        className={cn(
          // `uppercase` khai lại ở đây: `<button>` không thừa hưởng `text-transform`
          // của hàng header (đã đo — tiêu đề bấm được hiện thường trong khi các cột
          // khác hoa, nhìn như hai loại tiêu đề khác nhau).
          'inline-flex items-center gap-1 rounded uppercase transition-colors',
          active
            ? 'text-role-manager-primary'
            : 'text-slate-500 hover:text-slate-800'
        )}
      >
        {label}
        <ArrowDown
          className={cn('h-3 w-3', active ? 'opacity-100' : 'opacity-0')}
        />
      </button>
    </th>
  );
}

/** Nhãn cột kèm chú thích — hai loại "%" trên màn này rất dễ bị hiểu nhầm là bug. */
function HeaderHint({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex cursor-default items-center gap-1">
          {label}
          <Info className="h-3 w-3 text-slate-300" />
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-64 text-xs normal-case tracking-normal">
        {children}
      </TooltipContent>
    </Tooltip>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-1">
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={cn(
            'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
            value === o.value
              ? 'bg-role-manager-primary text-white'
              : 'text-slate-500 hover:bg-slate-100'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Khoá React ổn định theo chiều đang gộp (thành phố có thể null ⇒ fallback nhãn cố định). */
function rowKey(row: RevenueBreakdownRow): string {
  if (isHotelRow(row)) return row.hotelId;
  if (isPartnerRow(row)) return row.partnerId;
  return row.city ?? '__unknown_city__';
}

function plural(count: number | null, noun: string): string | null {
  if (count === null) return null;
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

/**
 * `"15.00"` → `15.00%`. GIỮ 2 chữ số thập phân, không rút gọn: đây là một cột số để
 * so sánh theo chiều dọc, mà `13.61% / 14% / 10%` lệch số chữ số thì mắt phải căn lại
 * từng dòng. BE trả string nên parse trước.
 */
function formatRatePct(value: string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `${n.toFixed(2)}%`;
}
