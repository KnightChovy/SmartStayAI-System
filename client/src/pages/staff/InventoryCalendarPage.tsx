import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { AlertTriangle, CalendarRange, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';
import { useInventoryCalendar } from '@/hooks/staff';
import { useStaffHotelStore } from '@/stores/staffHotelStore';
import type { InventoryDayCell } from '@/types/staff.types';
import { errorMessage } from '@/utils/errorMessage';
import { formatCurrency } from '@/utils/formatCurrency';
import { todayUtcKey } from '@/utils/formatDate';
import { shiftDateKey } from '@/utils/inventoryCalendar';

/** Số ngày hiển thị cùng lúc. 14 vừa một màn hình, 30 để nhìn cả tháng. */
const WINDOWS = [14, 30] as const;
type WindowSize = (typeof WINDOWS)[number];

const DEFAULT_WINDOW: WindowSize = 14;

const isWindowSize = (value: number): value is WindowSize =>
  (WINDOWS as readonly number[]).includes(value);

/** Thứ viết tắt của một khoá ngày UTC (dựng ngày ở UTC để không lệch múi giờ máy). */
function weekdayLabel(dateKey: string): string {
  return new Date(`${dateKey}T00:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'short',
    timeZone: 'UTC',
  });
}

/** `dd/MM` cho header cột — cắt thẳng từ khoá ngày, không qua `new Date()` để khỏi lệch múi giờ. */
function dayMonthLabel(dateKey: string): string {
  const [, month, day] = dateKey.split('-');
  return `${day}/${month}`;
}

function isWeekend(dateKey: string): boolean {
  const weekday = new Date(`${dateKey}T00:00:00Z`).getUTCDay();
  return weekday === 0 || weekday === 6;
}

export default function InventoryCalendarPage() {
  const hotel = useStaffHotelStore(state => state.hotel);
  const [params, setParams] = useSearchParams();

  // Khoảng ngày nằm trên URL để F5 / chia sẻ link giữ nguyên — cùng cách Front desk làm với `?bucket=`.
  const today = todayUtcKey();
  const from = params.get('from') ?? today;
  const daysParam = Number(params.get('days'));
  const days: WindowSize = isWindowSize(daysParam) ? daysParam : DEFAULT_WINDOW;
  const to = shiftDateKey(from, days - 1);

  const { data, isLoading, isFetching, isError, error } = useInventoryCalendar(
    hotel?.id,
    from,
    to
  );

  const setRange = (nextFrom: string, nextDays: WindowSize) => {
    setParams(
      prev => {
        const next = new URLSearchParams(prev);
        next.set('from', nextFrom);
        next.set('days', String(nextDays));
        return next;
      },
      { replace: true }
    );
  };

  const dates = useMemo(() => data?.rows[0]?.days.map(d => d.date) ?? [], [data]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Inventory calendar</h1>
          <p className="text-sm text-slate-500">
            Rooms left to sell per night, cheapest room type first · {hotel?.name}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
            {WINDOWS.map(size => (
              <button
                key={size}
                type="button"
                onClick={() => setRange(from, size)}
                aria-pressed={days === size}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  days === size
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                {size} days
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setRange(shiftDateKey(from, -days), days)}
              aria-label="Previous period"
              className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setRange(today, days)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setRange(shiftDateKey(from, days), days)}
              aria-label="Next period"
              className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Chú giải màu — đọc được ô mà không phải rê chuột. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-white ring-1 ring-slate-200" />
          Rooms available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-amber-100 ring-1 ring-amber-300" />
          Fully booked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-rose-100 ring-1 ring-rose-300" />
          Overbooked
        </span>
      </div>

      {isError && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          {errorMessage(error, 'Could not load the inventory calendar.')}
        </div>
      )}

      {/* Chạm trần phân trang ⇒ số liệu có thể thiếu. Nói ra thay vì hiện một con số sai trông rất thật. */}
      {data?.truncated && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          Too many bookings in this range to load them all — the numbers below may be higher than
          reality. Try a shorter period.
        </div>
      )}

      {isLoading && <CalendarSkeleton />}

      {!isLoading && !isError && data && data.rows.length === 0 && (
        <p className="py-12 text-center text-sm text-slate-400">
          No rooms recorded for this hotel yet.
        </p>
      )}

      {!isLoading && !isError && data && data.rows.length > 0 && (
        <div
          className={cn(
            'overflow-x-auto rounded-xl border border-slate-200 bg-white',
            isFetching && 'opacity-60'
          )}
        >
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 min-w-40 border-b border-slate-200 bg-white px-3 py-2 text-left text-xs font-semibold text-slate-500">
                  Room type
                </th>
                {dates.map(date => (
                  <th
                    key={date}
                    className={cn(
                      'min-w-14 border-b border-slate-200 px-1 py-2 text-center text-[11px] font-medium',
                      isWeekend(date) ? 'bg-slate-50 text-slate-500' : 'text-slate-500',
                      date === today && 'border-x border-x-slate-900/20 bg-slate-100'
                    )}
                  >
                    <span className="block">{weekdayLabel(date)}</span>
                    <span
                      className={cn(
                        'block text-slate-700',
                        date === today && 'font-semibold text-slate-900'
                      )}
                    >
                      {dayMonthLabel(date)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map(row => (
                <tr key={row.roomTypeId} className="border-b border-slate-100 last:border-0">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 max-w-50 bg-white px-3 py-2 text-left"
                    title={row.roomTypeName}
                  >
                    <span className="block truncate text-sm font-medium text-slate-700">
                      {row.roomTypeName}
                    </span>
                    {/* Hàng xếp theo giá tăng dần — hiện luôn giá để thứ tự đọc ra được lý do. */}
                    <span className="block text-[11px] text-slate-400">
                      {row.basePrice === null
                        ? 'Not for sale'
                        : `from ${formatCurrency(row.basePrice)}`}
                    </span>
                  </th>
                  {row.days.map(cell => (
                    <DayCell
                      key={cell.date}
                      cell={cell}
                      roomTypeName={row.roomTypeName}
                      isToday={cell.date === today}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-slate-400">
        Counts come from the hotel&apos;s rooms, maintenance blocks and bookings. Final availability
        is confirmed at booking time.
      </p>
    </div>
  );
}

function DayCell({
  cell,
  roomTypeName,
  isToday,
}: {
  cell: InventoryDayCell;
  roomTypeName: string;
  isToday: boolean;
}) {
  const soldOut = cell.available === 0;
  const overbooked = cell.available < 0;
  // Cho cả trình đọc màn hình — tooltip của Radix chỉ hiện khi rê chuột, mà ô thì chỉ có mỗi con số.
  const summary = `${roomTypeName} ${dayMonthLabel(cell.date)}: ${cell.available} left, ${cell.booked} booked of ${cell.sellable} sellable`;

  return (
    <td
      className={cn(
        'p-0 text-center text-sm tabular-nums',
        isWeekend(cell.date) && 'bg-slate-50/60',
        isToday && 'border-x border-x-slate-900/20',
        overbooked && 'bg-rose-100 font-semibold text-rose-700',
        soldOut && 'bg-amber-100 font-medium text-amber-800',
        !soldOut && !overbooked && 'text-slate-700'
      )}
    >
      <Tooltip>
        {/* Trigger là span phủ kín ô để rê chuột ở đâu trong ô cũng hiện, không riêng con số. */}
        <TooltipTrigger asChild>
          <span className="block cursor-default px-1 py-2" aria-label={summary}>
            {cell.available}
          </span>
        </TooltipTrigger>
        <TooltipContent className="flex-col items-start gap-0.5 py-2">
          <span className="font-medium">
            {weekdayLabel(cell.date)} {dayMonthLabel(cell.date)} · {roomTypeName}
          </span>
          <span>
            <span className="font-semibold">{cell.booked}</span> booked ·{' '}
            <span className="font-semibold">{Math.max(0, cell.available)}</span> left
          </span>
          <span className="opacity-70">{cell.sellable} rooms sellable</span>
          {overbooked && (
            <span className="font-semibold text-rose-300">
              Overbooked by {Math.abs(cell.available)}
            </span>
          )}
          {soldOut && <span className="font-semibold text-amber-300">Fully booked</span>}
        </TooltipContent>
      </Tooltip>
    </td>
  );
}

function CalendarSkeleton() {
  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-2">
        <CalendarRange className="size-4 text-slate-300" />
        <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-9 animate-pulse rounded bg-slate-100" />
      ))}
    </div>
  );
}
