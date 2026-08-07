import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { AlertTriangle, CalendarRange, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';
import { RoomDayBoard } from '@/components/staff/RoomDayBoard';
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

/**
 * Lịch tồn kho + bản đồ phòng **theo từng ngày** (gộp trang Room map cũ vào đây).
 *
 * Vì sao gộp: Room map cũ chỉ nói được tình trạng của HÔM NAY (`rooms.status` không có chiều thời
 * gian), nên đổi trạng thái ở đó là đổi cho mọi ngày cùng lúc — bấm "Maintenance" là BE chặn phòng
 * suốt 7 ngày kể từ hôm nay, bấm "Available" là gỡ sạch mọi đợt chặn đang có. Giờ bấm vào một ô
 * trên lịch sẽ mở đúng các phòng của ngày đó, và thao tác chặn phòng chỉ ảnh hưởng ngày đã chọn.
 */
export default function InventoryCalendarPage() {
  const hotel = useStaffHotelStore(state => state.hotel);
  const [params, setParams] = useSearchParams();

  // Khoảng ngày nằm trên URL để F5 / chia sẻ link giữ nguyên — cùng cách Front desk làm với `?bucket=`.
  const today = todayUtcKey();
  const from = params.get('from') ?? today;
  const daysParam = Number(params.get('days'));
  const days: WindowSize = isWindowSize(daysParam) ? daysParam : DEFAULT_WINDOW;
  const to = shiftDateKey(from, days - 1);

  // Điều hướng từ ô tìm kiếm toàn cục ("Room 101") — mở luôn bản đồ phòng của hôm nay.
  const highlightRoom = params.get('room');
  const selectedDate = params.get('date') ?? (highlightRoom ? today : null);
  const selectedTypeId = params.get('type');

  const {
    data,
    rooms,
    blocks,
    bookings,
    bookingsTruncated,
    detailLoading,
    isLoading,
    isFetching,
    isError,
    error,
    // Nguồn thô của bản đồ phòng chỉ tải khi staff thật sự mở một ngày — nó tốn tới 20 request
    // phân trang booking, trong khi lưới chỉ cần đúng một.
  } = useInventoryCalendar(hotel?.id, from, to, { withRoomDetail: Boolean(selectedDate) });

  const setRange = (nextFrom: string, nextDays: WindowSize) => {
    const nextTo = shiftDateKey(nextFrom, nextDays - 1);
    setParams(
      prev => {
        const next = new URLSearchParams(prev);
        next.set('from', nextFrom);
        next.set('days', String(nextDays));
        // Ngày đang chọn rơi ra ngoài khung mới thì bỏ chọn — giữ lại sẽ hiện bản đồ phòng của một
        // ngày không còn ô nào trên lưới, không đối chiếu được với gì.
        const current = next.get('date');
        if (current && (current < nextFrom || current > nextTo)) {
          next.delete('date');
          next.delete('type');
        }
        return next;
      },
      { replace: true }
    );
  };

  /** Chọn một ô (ngày + loại phòng) hoặc cả một ngày (`roomTypeId = null`). */
  const selectDay = (date: string, roomTypeId: string | null) => {
    setParams(
      prev => {
        const next = new URLSearchParams(prev);
        next.set('date', date);
        if (roomTypeId) next.set('type', roomTypeId);
        else next.delete('type');
        // Ô lịch được bấm là chủ đích mới của người dùng ⇒ bỏ highlight cũ từ ô tìm kiếm.
        next.delete('room');
        return next;
      },
      { replace: true }
    );
  };

  const clearSelection = () => {
    setParams(
      prev => {
        const next = new URLSearchParams(prev);
        next.delete('date');
        next.delete('type');
        next.delete('room');
        return next;
      },
      { replace: true }
    );
  };

  const dates = useMemo(() => data?.rows[0]?.days.map(d => d.date) ?? [], [data]);

  const selectedRow = data?.rows.find(row => row.roomTypeId === selectedTypeId);
  const selectedCell = selectedRow?.days.find(day => day.date === selectedDate);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Rooms &amp; inventory</h1>
          <p className="text-sm text-slate-500">
            Rooms left to sell per night · click any day to open its room map · {hotel?.name}
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

      {/*
        Chạm trần phân trang ⇒ BẢN ĐỒ PHÒNG có thể thiếu đơn. Lưới bên trên không dính vì nó đọc
        thẳng tồn kho từ server, không đếm booking ở client nữa.
      */}
      {bookingsTruncated && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          Too many bookings in this range to load them all — the room map below may be missing some
          guests. The numbers in the grid are unaffected. Try a shorter period.
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
                      'min-w-14 border-b border-slate-200 p-0 text-center text-[11px] font-medium',
                      isWeekend(date) ? 'bg-slate-50 text-slate-500' : 'text-slate-500',
                      date === today && 'border-x border-x-slate-900/20 bg-slate-100'
                    )}
                  >
                    {/* Bấm vào đầu cột = xem MỌI loại phòng của ngày đó. */}
                    <button
                      type="button"
                      onClick={() => selectDay(date, null)}
                      aria-label={`Show every room on ${dayMonthLabel(date)}`}
                      className={cn(
                        'w-full cursor-pointer px-1 py-2 transition-colors hover:bg-slate-100',
                        date === selectedDate && 'bg-slate-900/5'
                      )}
                    >
                      <span className="block">{weekdayLabel(date)}</span>
                      <span
                        className={cn(
                          'block text-slate-700',
                          date === today && 'font-semibold text-slate-900',
                          date === selectedDate && 'font-semibold underline underline-offset-2'
                        )}
                      >
                        {dayMonthLabel(date)}
                      </span>
                    </button>
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
                      selected={
                        cell.date === selectedDate &&
                        (selectedTypeId === null || selectedTypeId === row.roomTypeId)
                      }
                      onSelect={() => selectDay(cell.date, row.roomTypeId)}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Nguồn thô của bản đồ phòng tải sau (chỉ khi mở một ngày) nên phải có trạng thái chờ riêng. */}
      {selectedDate && detailLoading && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        </div>
      )}

      {/* Bản đồ phòng của ngày đang chọn — thay cho trang Room map cũ. */}
      {selectedDate && !isError && rooms && blocks && bookings && (
        <RoomDayBoard
          hotelId={hotel?.id}
          date={selectedDate}
          isToday={selectedDate === today}
          rooms={rooms}
          blocks={blocks}
          bookings={bookings}
          dataTo={to}
          roomTypeId={selectedTypeId}
          roomTypeName={selectedRow?.roomTypeName}
          cell={selectedCell}
          highlightRoom={highlightRoom}
          onClearRoomType={() => selectDay(selectedDate, null)}
          onClose={clearSelection}
        />
      )}

      {!selectedDate && !isLoading && !isError && data && data.rows.length > 0 && (
        <p className="text-center text-sm text-slate-400">
          Pick a day above to see every room for that night and block rooms for that date only.
        </p>
      )}

      <p className="text-xs text-slate-400">
        Counts come straight from the hotel&apos;s nightly inventory — the same numbers a guest sees
        when booking.
        {data?.hasDerivedCells &&
          ' Nights with no inventory row yet are counted from the room list instead (marked in the tooltip).'}
      </p>
    </div>
  );
}

function DayCell({
  cell,
  roomTypeName,
  isToday,
  selected,
  onSelect,
}: {
  cell: InventoryDayCell;
  roomTypeName: string;
  isToday: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const soldOut = cell.available === 0;
  const overbooked = cell.available < 0;
  // Cho cả trình đọc màn hình — tooltip của Radix chỉ hiện khi rê chuột, mà ô thì chỉ có mỗi con số.
  const summary = `${roomTypeName} ${dayMonthLabel(cell.date)}: ${cell.available} left, ${cell.booked} booked of ${cell.sellable} sellable. Open the room map for this day.`;

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
        {/* Trigger là nút phủ kín ô để rê/bấm ở đâu trong ô cũng ăn, không riêng con số. */}
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onSelect}
            aria-label={summary}
            aria-pressed={selected}
            className={cn(
              'block w-full cursor-pointer px-1 py-2 transition-colors hover:bg-slate-900/5',
              selected && 'bg-slate-900/10 ring-2 ring-slate-900 ring-inset'
            )}
          >
            {cell.available}
          </button>
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
          {/* Nói ra khi đêm đó chưa có dòng tồn kho: số này suy từ danh sách phòng, chưa phải con
              số đã chốt mà khách nhìn thấy lúc đặt. */}
          {cell.source === 'derived' && (
            <span className="opacity-70">Not in the availability table yet — counted from rooms</span>
          )}
          {overbooked && (
            <span className="font-semibold text-rose-300">
              Overbooked by {Math.abs(cell.available)}
            </span>
          )}
          {soldOut && <span className="font-semibold text-amber-300">Fully booked</span>}
          <span className="mt-0.5 opacity-70">Click to see the rooms for this night</span>
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
