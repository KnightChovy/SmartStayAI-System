import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, CalendarOff, Loader2, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Modal } from '@/components/hotel-partner/shared/Modal';
import { cn } from '@/lib/cn';
import { useCreateRoomBlock } from '@/hooks/staff';
import type {
  CreateRoomBlockPayload,
  HotelBooking,
  RoomBlockListItem,
  RoomBlockType,
  StaffRoom,
} from '@/types/staff.types';
import { errorMessage } from '@/utils/errorMessage';
import { formatCurrency } from '@/utils/formatCurrency';
import { todayUtcKey } from '@/utils/formatDate';
import { previewRoomBlockLocally } from '@/utils/inventoryCalendar';

const REASON_MAX = 500;

interface BlockTypeMeta {
  value: RoomBlockType;
  label: string;
  hint: string;
  icon: typeof Wrench;
}

/**
 * Hai loại chặn KHÔNG thay thế nhau — `ooo` rút phòng khỏi kho bán, `oos` thì không. Chọn nhầm là
 * hoặc bán mất một phòng đang hỏng, hoặc khoá oan một phòng vẫn bán được.
 */
const BLOCK_TYPES: BlockTypeMeta[] = [
  {
    value: 'ooo',
    label: 'Maintenance',
    hint: 'Room is unusable — removed from what can be sold on those dates.',
    icon: Wrench,
  },
  {
    value: 'oos',
    label: 'Out of service',
    hint: 'Paused for the day (deep clean, setup) but still counted as sellable.',
    icon: CalendarOff,
  },
];

/** `dd/MM` từ khoá ngày — cắt thẳng chuỗi, không qua `new Date()` để khỏi lệch múi giờ. */
function dayMonth(dateKey: string): string {
  const [, month, day] = dateKey.split('-');
  return `${day}/${month}`;
}

interface BlockRoomModalProps {
  open: boolean;
  onClose: () => void;
  hotelId: string | undefined;
  room: StaffRoom | null;
  /** Ngày đang xem trên lịch — mặc định chặn đúng ngày này. */
  date: string;
  /** Loại chặn chọn sẵn theo mục staff vừa bấm (Maintenance → `ooo`, Out of service → `oos`). */
  initialBlockType?: RoomBlockType;
  /** Nguồn của lịch tồn kho — dùng để xem trước hậu quả ngay tại client. */
  rooms: StaffRoom[];
  blocks: RoomBlockListItem[];
  bookings: HotelBooking[];
  /** Ngày cuối của khung lịch đang tải — quá mốc này thì chưa có booking để kết luận. */
  dataTo: string;
}

/**
 * Chặn một phòng theo KHOẢNG NGÀY — thao tác "đổi trạng thái theo ngày" thật sự.
 *
 * Mặc định `startDate = endDate = ngày đang xem`, nên bấm từ một ô trên lịch chỉ ảnh hưởng đúng
 * ngày đó. Muốn dài hơn thì tự kéo ngày kết thúc.
 */
export function BlockRoomModal({
  open,
  onClose,
  hotelId,
  room,
  date,
  initialBlockType = 'ooo',
  rooms,
  blocks,
  bookings,
  dataTo,
}: BlockRoomModalProps) {
  const [blockType, setBlockType] = useState<RoomBlockType>(initialBlockType);
  const [startDate, setStartDate] = useState(date);
  const [endDate, setEndDate] = useState(date);
  const [reason, setReason] = useState('');
  const [cost, setCost] = useState('');
  const [showErrors, setShowErrors] = useState(false);

  // Mở lại modal ở một ô khác thì form phải nói về đúng ô đó. Khoá theo `room.id + date` để việc
  // reset chỉ chạy khi thực sự đổi mục tiêu, không phải mỗi lần re-render.
  const target = `${room?.id ?? ''}:${date}:${initialBlockType}`;
  const [syncedTarget, setSyncedTarget] = useState(target);
  if (open && syncedTarget !== target) {
    setSyncedTarget(target);
    setBlockType(initialBlockType);
    setStartDate(date);
    setEndDate(date);
    setReason('');
    setCost('');
    setShowErrors(false);
  }

  const rangeInvalid = Boolean(startDate && endDate && endDate < startDate);
  const reasonMissing = reason.trim().length === 0;

  const payload: CreateRoomBlockPayload = {
    blockType,
    startDate,
    endDate,
    reason: reason.trim(),
    ...(cost.trim() !== '' && !Number.isNaN(Number(cost)) ? { estimatedCost: Number(cost) } : {}),
  };

  // Xem trước tính tại client trên đúng dữ liệu của lịch (xem `previewRoomBlockLocally` để biết vì
  // sao không gọi `?dryRun=true` của BE). Không tốn request nên cập nhật ngay khi đổi ngày.
  const preview = useMemo(() => {
    if (!open || !room || rangeInvalid) return null;
    return previewRoomBlockLocally({
      rooms,
      blocks,
      bookings,
      roomId: room.id,
      blockType,
      startDate,
      endDate,
      dataTo,
    });
  }, [open, room, rangeInvalid, rooms, blocks, bookings, blockType, startDate, endDate, dataTo]);

  const createBlock = useCreateRoomBlock(hotelId);

  if (!room) return null;

  const submit = async () => {
    if (reasonMissing || rangeInvalid) {
      setShowErrors(true);
      return;
    }
    try {
      const result = await createBlock.mutateAsync({
        roomId: room.id,
        payload: { ...payload, reason: reason.trim() },
      });
      const affected = result.affectedBookings.length;
      toast.success(
        affected > 0
          ? `Room ${room.roomNumber} blocked — ${affected} booking${affected === 1 ? '' : 's'} need a new room.`
          : `Room ${room.roomNumber} blocked ${dayMonth(startDate)}${endDate !== startDate ? ` → ${dayMonth(endDate)}` : ''}.`
      );
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not block this room.'));
    }
  };

  const affectedBookings = preview?.affectedBookings ?? [];
  const shortageNights = preview?.shortageNights ?? [];
  // Chặn kéo dài quá khung lịch đang tải ⇒ nói rõ đã kiểm tới đâu, không im lặng báo "an toàn".
  const uncheckedTail = preview && preview.checkedThrough !== null && preview.checkedThrough < endDate;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Block room ${room.roomNumber}`}
      description={`${room.roomType.name} · applies only to the dates you pick`}
      icon={Wrench}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={createBlock.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => void submit()}
            disabled={createBlock.isPending}
            className="bg-slate-900 text-white hover:bg-slate-800"
          >
            {createBlock.isPending && <Loader2 className="mr-1.5 size-4 animate-spin" />}
            Block room
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-2 sm:grid-cols-2">
          {BLOCK_TYPES.map(meta => {
            const Icon = meta.icon;
            const active = blockType === meta.value;
            return (
              <button
                key={meta.value}
                type="button"
                onClick={() => setBlockType(meta.value)}
                aria-pressed={active}
                className={cn(
                  'rounded-xl border p-3 text-left transition-colors',
                  active
                    ? 'border-slate-900 bg-slate-50'
                    : 'border-slate-200 hover:border-slate-300'
                )}
              >
                <span className="flex items-center gap-2 text-sm font-medium text-slate-900">
                  <Icon className="size-4 text-slate-500" />
                  {meta.label}
                </span>
                <span className="mt-1 block text-xs leading-snug text-slate-500">{meta.hint}</span>
              </button>
            );
          })}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="block-start"
              className="mb-1 block text-xs font-medium text-slate-600"
            >
              First blocked day
            </label>
            <DatePicker
              id="block-start"
              value={startDate}
              onChange={value => {
                setStartDate(value);
                // Giữ khoảng ngày luôn hợp lệ thay vì để staff bấm rồi ăn 400 từ BE.
                if (value && endDate && endDate < value) setEndDate(value);
              }}
              min={todayUtcKey()}
              clearable={false}
              placeholder="Pick a date"
            />
          </div>
          <div>
            <label htmlFor="block-end" className="mb-1 block text-xs font-medium text-slate-600">
              Last blocked day
            </label>
            <DatePicker
              id="block-end"
              value={endDate}
              onChange={setEndDate}
              min={startDate || todayUtcKey()}
              clearable={false}
              placeholder="Pick a date"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              This day is still blocked — same day in both fields blocks a single night.
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="block-reason" className="mb-1 block text-xs font-medium text-slate-600">
            Reason <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="block-reason"
            value={reason}
            onChange={e => setReason(e.target.value)}
            maxLength={REASON_MAX}
            rows={2}
            placeholder="Broken air conditioner, waiting for parts…"
            className={cn(
              'w-full rounded-lg border px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400',
              showErrors && reasonMissing ? 'border-rose-300' : 'border-slate-200'
            )}
          />
          <div className="mt-1 flex items-center justify-between text-[11px]">
            <span className={showErrors && reasonMissing ? 'text-rose-600' : 'text-slate-400'}>
              {showErrors && reasonMissing
                ? 'A reason is required — this takes a room off sale.'
                : 'Shown to whoever picks up the room later.'}
            </span>
            <span className="text-slate-400">
              {reason.length}/{REASON_MAX}
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="block-cost" className="mb-1 block text-xs font-medium text-slate-600">
            Estimated repair cost (optional)
          </label>
          <Input
            id="block-cost"
            type="number"
            min={0}
            inputMode="numeric"
            value={cost}
            onChange={e => setCost(e.target.value)}
            placeholder="0"
          />
          {cost.trim() !== '' && !Number.isNaN(Number(cost)) && Number(cost) > 0 && (
            <p className="mt-1 text-[11px] text-slate-400">{formatCurrency(Number(cost))}</p>
          )}
        </div>

        {/* Xem trước: BE tính thật trên dữ liệu thật, không ghi gì. */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-600">Impact of this block</p>

          {rangeInvalid && (
            <p className="mt-2 text-xs text-rose-600">
              The last blocked day cannot be before the first one.
            </p>
          )}

          {preview && (
            <div className="mt-2 space-y-2 text-xs">
              {affectedBookings.length === 0 && shortageNights.length === 0 && (
                <p className="text-emerald-700">
                  No guest is assigned to this room on those dates and every night still has enough
                  rooms.
                </p>
              )}

              {affectedBookings.length > 0 && (
                <div>
                  <p className="flex items-center gap-1.5 font-medium text-rose-700">
                    <AlertTriangle className="size-3.5" />
                    {affectedBookings.length} booking
                    {affectedBookings.length === 1 ? '' : 's'} assigned to this room — move them to
                    another room
                  </p>
                  <ul className="mt-1 space-y-0.5 text-slate-600">
                    {affectedBookings.map(booking => (
                      <li key={booking.id}>
                        {booking.bookingCode} · {booking.customer.fullName}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {uncheckedTail && preview?.checkedThrough && (
                <p className="text-slate-500">
                  Checked up to {dayMonth(preview.checkedThrough)} — later days are outside the
                  period loaded above, so they were not checked for shortages.
                </p>
              )}

              {shortageNights.length > 0 && (
                <div>
                  <p className="flex items-center gap-1.5 font-medium text-amber-700">
                    <AlertTriangle className="size-3.5" />
                    {shortageNights.length} night
                    {shortageNights.length === 1 ? '' : 's'} would be short of rooms
                  </p>
                  <ul className="mt-1 space-y-0.5 text-slate-600">
                    {shortageNights.map(night => (
                      <li key={night.date}>
                        {dayMonth(night.date)}: {night.booked} booked vs{' '}
                        {night.sellable} sellable ({night.shortage} short)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
