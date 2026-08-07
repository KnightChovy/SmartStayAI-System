import { CalendarCheck, Info, Layers, Undo2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';
import { formatCompactVnd, formatVndFull } from '@/utils/formatCurrency';
import type { RevenueSummary } from '@/types/revenue.types';
import { ChangeBadge } from './ChangeBadge';
import { SectionError } from './states';

interface RevenueKpiCardsProps {
  data: RevenueSummary | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function RevenueKpiCards({
  data,
  isLoading,
  isError,
  onRetry,
}: RevenueKpiCardsProps) {
  if (isError) {
    return <SectionError onRetry={onRetry} />;
  }

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="h-44 animate-pulse rounded-xl border border-slate-200 bg-white lg:col-span-5" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-7">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-44 animate-pulse rounded-xl border border-slate-200 bg-white"
            />
          ))}
        </div>
      </div>
    );
  }

  const { kpis } = data;
  const disputed = Number(data.commissionDisputed);
  const refunded = Number(data.refunded);

  /**
   * Kỳ đang chọn CHƯA kết thúc ⇒ mọi % so sánh đều là **7 ngày so với trọn 31 ngày**.
   * Đo thật trên deploy: tháng 8 mới tới ngày 07 mà badge báo `-34.95%` — người đọc sẽ
   * kết luận "doanh thu giảm 35%" trong khi tháng vẫn đang chạy. BE tính `comparison` theo
   * cửa sổ cùng ĐỘ DÀI (01/07–31/07) chứ không theo số ngày đã trôi qua, nên FE không dựng
   * lại được con số công bằng ⇒ thà không hiện còn hơn hiện một số sai.
   */
  const periodInProgress = data.range.to > todayKey();
  const changeOf = (pct: number | null) => (periodInProgress ? null : pct);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* ── Hero: tiền sàn THỰC THU ────────────────────────────────────────── */}
      <section className="rounded-xl border border-emerald-200 bg-linear-to-br from-emerald-50/80 to-white p-6 lg:col-span-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Platform revenue
          </p>
          <HintIcon>
            Commission the platform actually earned in this period (pending +
            settled). Disputed commission is excluded.
          </HintIcon>
        </div>

        {/* Số ĐẦY ĐỦ, không rút gọn: đây là con số đem đi đối chiếu sổ sách, "9.6M" thì
            không đối chiếu được với cái gì. */}
        <p className="mt-2 text-3xl font-bold leading-tight text-emerald-700 xl:text-4xl">
          {formatVndFull(kpis.totalCommission.value)}
        </p>

        {/* Nói ra QUAN HỆ giữa các số thay vì để người đọc tự ghép: sàn giữ X% của Y. */}
        <p className="mt-2 text-sm text-slate-600">
          {kpis.takeRate.value === null ? (
            <>Take rate — </>
          ) : (
            <>
              <span className="font-semibold text-slate-900">
                {kpis.takeRate.value}%
              </span>{' '}
              take rate{' '}
            </>
          )}
          on {formatCompactVnd(kpis.grossRevenue.value)} of bookings
        </p>

        {periodInProgress ? (
          <p className="mt-3 text-xs text-slate-400">
            No comparison while the period is still running
          </p>
        ) : (
          kpis.totalCommission.changePct !== null && (
            <div className="mt-3 flex items-center gap-1.5">
              <ChangeBadge value={kpis.totalCommission.changePct} />
              <span className="text-xs text-slate-500">
                vs {formatShortRange(data.previousRange)}
              </span>
            </div>
          )
        )}

        {disputed > 0 && (
          <p className="mt-3 text-xs font-medium text-amber-600">
            Excludes {formatVndFull(data.commissionDisputed)} in dispute
          </p>
        )}
      </section>

      {/* ── Bối cảnh: cố ý NHẸ hơn hero (icon inline, số nhỏ hơn) ───────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-7">
        <StatTile
          icon={Layers}
          iconClass="text-role-manager-primary"
          label="Gross Revenue "
          value={formatCompactVnd(kpis.grossRevenue.value)}
          fullValue={formatVndFull(kpis.grossRevenue.value)}
          note="What guests paid, before commission"
          changePct={changeOf(kpis.grossRevenue.changePct)}
          previousRange={data.previousRange}
          hint="Total value of confirmed / checked-in / checked-out bookings in the period. This is the marketplace volume — it is not the platform's income."
        />
        <StatTile
          icon={CalendarCheck}
          iconClass="text-amber-600"
          label="Bookings"
          value={kpis.bookings.value.toLocaleString('vi-VN')}
          note={
            data.avgBookingValue === null
              ? 'No average to show'
              : `Avg. ${formatVndFull(data.avgBookingValue)} each`
          }
          changePct={changeOf(kpis.bookings.changePct)}
          previousRange={data.previousRange}
          hint="Bookings counted in the period. The API does not return the previous-period count, so no change is shown."
        />
        <StatTile
          icon={Undo2}
          iconClass={refunded > 0 ? 'text-red-600' : 'text-slate-400'}
          label="Refunded"
          value={formatCompactVnd(data.refunded)}
          fullValue={formatVndFull(data.refunded)}
          valueClass={refunded > 0 ? 'text-red-600' : undefined}
          note={
            refunded > 0 ? 'Money returned to guests' : 'No refunds this period'
          }
          changePct={null}
          previousRange={data.previousRange}
          hint="Refunds actually paid out (transfer completed). Requests still awaiting hotel approval, or rejected, are not counted."
        />
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon,
  iconClass,
  label,
  value,
  fullValue,
  valueClass,
  note,
  changePct,
  previousRange,
  hint,
}: {
  icon: LucideIcon;
  iconClass: string;
  label: string;
  value: string;
  fullValue?: string;
  valueClass?: string;
  note: string;
  changePct: number | null;
  previousRange: { from: string; to: string };
  hint: string;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className={cn('h-4 w-4 shrink-0', iconClass)} />
          {/* KHÔNG truncate: ô hẹp (3 tile trên 7/12 cột) làm "Gross Revenue " bị cắt
              thành "Gross booking val…" — nhãn cụt thì thà xuống dòng còn hơn. */}
          <p className="text-xs font-medium leading-tight text-slate-500">
            {label}
          </p>
        </div>
        <HintIcon>{hint}</HintIcon>
      </div>

      {fullValue ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <p
              className={cn(
                'w-fit cursor-default text-xl font-bold text-slate-900 tabular-nums',
                valueClass
              )}
            >
              {value}
            </p>
          </TooltipTrigger>
          <TooltipContent>{fullValue}</TooltipContent>
        </Tooltip>
      ) : (
        <p
          className={cn(
            'text-xl font-bold text-slate-900 tabular-nums',
            valueClass
          )}
        >
          {value}
        </p>
      )}

      <p className="mt-1 text-xs text-slate-400">{note}</p>

      {/* Không còn dòng "— vs previous period" khi KHÔNG có kỳ trước để so: bốn dấu gạch
          xếp hàng chỉ chiếm chỗ mà không nói gì. */}
      {changePct !== null && (
        <div className="mt-auto flex items-center gap-1.5 pt-3">
          <ChangeBadge value={changePct} />
          <span className="text-xs text-slate-400">
            vs {formatShortRange(previousRange)}
          </span>
        </div>
      )}
    </div>
  );
}

function HintIcon({ children }: { children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="What this number means"
          className="shrink-0 text-slate-300 transition-colors hover:text-slate-500"
        >
          <Info className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-60 text-xs">{children}</TooltipContent>
    </Tooltip>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Hôm nay dạng YYYY-MM-DD (giờ local) — so chuỗi trực tiếp được với `range.to`. */
function todayKey(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "01/04 – 30/06" — nói RÕ đang so với kỳ nào thay vì "previous period" mơ hồ. */
function formatShortRange({ from, to }: { from: string; to: string }): string {
  const short = (d: string) => {
    const [, m, dd] = d.split('-');
    return `${dd}/${m}`;
  };
  return `${short(from)} – ${short(to)}`;
}
