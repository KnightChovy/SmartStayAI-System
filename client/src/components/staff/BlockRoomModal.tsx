import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, CalendarOff, Loader2, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Modal } from '@/components/hotel-partner/shared/Modal';
import { cn } from '@/lib/cn';
import { useCreateRoomBlock, useUpdateRoomBlock } from '@/hooks/staff';
import type {
  CreateRoomBlockPayload,
  HotelBooking,
  RoomBlockListItem,
  RoomBlockType,
  StaffRoom,
  UpdateRoomBlockPayload,
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

/** Số ngày giữa hai khoá ngày UTC (dựng ở UTC nên không lệch múi giờ). */
function daysBetween(fromKey: string, toKey: string): number {
  const from = new Date(`${fromKey}T00:00:00Z`).getTime();
  const to = new Date(`${toKey}T00:00:00Z`).getTime();
  if (Number.isNaN(from) || Number.isNaN(to)) return 0;
  return Math.round((to - from) / 86_400_000);
}

/** Câu mô tả việc dời ngày kết thúc — staff nghĩ theo "sớm/muộn mấy ngày", không theo hai mốc ngày. */
function describeShift(oldEndIso: string, newEndKey: string): string {
  const oldEnd = oldEndIso.slice(0, 10);
  const shift = daysBetween(oldEnd, newEndKey);
  if (shift === 0) return 'Same end day as before — only the reason or cost changes.';
  const nights = Math.abs(shift);
  const word = nights === 1 ? 'day' : 'days';
  return shift > 0
    ? `Blocked ${nights} more ${word} — the room now comes back on ${dayMonth(newEndKey)} instead of ${dayMonth(oldEnd)}.`
    : `Back on sale ${nights} ${word} earlier — from ${dayMonth(newEndKey)} instead of ${dayMonth(oldEnd)}.`;
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
  /**
   * Đợt chặn đang mở cần SỬA (gia hạn / rút ngắn / đổi lý do). Có giá trị ⇒ modal chuyển sang chế
   * độ sửa: `PATCH .../blocks/:blockId` thay vì tạo mới.
   */
  block?: RoomBlockListItem | null;
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
 *
 * Truyền `block` thì modal chuyển sang **sửa đợt đang mở**: gia hạn / rút ngắn ngày dự kiến xong,
 * sửa lý do, sửa chi phí. Cách này giữ nguyên lịch sử chi phí sự cố, khác hẳn "gỡ rồi tạo lại"
 * (và `createBlock` cũng từ chối hai đợt `ooo` chồng nhau nên cách kia còn vòng vèo).
 */
export function BlockRoomModal({
  open,
  onClose,
  hotelId,
  room,
  date,
  initialBlockType = 'ooo',
  block = null,
  rooms,
  blocks,
  bookings,
  dataTo,
}: BlockRoomModalProps) {
  const isEdit = Boolean(block);
  // Ngày bắt đầu và loại chặn của một đợt đang mở là BẤT BIẾN — BE không nhận hai field này
  // (ngày đã trôi qua thì không viết lại được, đổi loại là đổi luôn ý nghĩa tồn kho).
  const lockedStart = block ? block.startDate.slice(0, 10) : null;

  const [blockType, setBlockType] = useState<RoomBlockType>(initialBlockType);
  const [startDate, setStartDate] = useState(date);
  const [endDate, setEndDate] = useState(date);
  const [reason, setReason] = useState('');
  const [cost, setCost] = useState('');
  const [showErrors, setShowErrors] = useState(false);

  // Mở lại modal ở một ô khác thì form phải nói về đúng ô đó. Khoá theo mục tiêu để việc reset chỉ
  // chạy khi thực sự đổi mục tiêu, không phải mỗi lần re-render.
  const target = `${room?.id ?? ''}:${date}:${initialBlockType}:${block?.id ?? ''}`;
  const [syncedTarget, setSyncedTarget] = useState(target);
  if (open && syncedTarget !== target) {
    setSyncedTarget(target);
    setBlockType(block ? block.blockType : initialBlockType);
    setStartDate(lockedStart ?? date);
    setEndDate(block ? block.endDate.slice(0, 10) : date);
    setReason(block ? block.reason : '');
    setCost(block?.estimatedCost != null ? String(Number(block.estimatedCost)) : '');
    setShowErrors(false);
  }

  const rangeInvalid = Boolean(startDate && endDate && endDate < startDate);
  const reasonMissing = reason.trim().length === 0;

  const estimatedCost =
    cost.trim() !== '' && !Number.isNaN(Number(cost)) ? Number(cost) : undefined;

  const payload: CreateRoomBlockPayload = {
    blockType,
    startDate,
    endDate,
    reason: reason.trim(),
    ...(estimatedCost !== undefined ? { estimatedCost } : {}),
  };

  // Xem trước tính tại client trên đúng dữ liệu của lịch (xem `previewRoomBlockLocally` để biết vì
  // sao không gọi `?dryRun=true` của BE). Không tốn request nên cập nhật ngay khi đổi ngày.
  const preview = useMemo(() => {
    if (!open || !room || rangeInvalid) return null;
    // Khi SỬA, đợt chặn có thể đã bắt đầu từ trước — bỏ qua các đêm đã trôi qua: không xếp lại
    // phòng cho quá khứ được, mà liệt kê ra chỉ làm nhiễu đúng phần staff cần đọc.
    const today = todayUtcKey();
    const previewFrom = isEdit && startDate < today ? today : startDate;
    if (previewFrom > endDate) return null;
    return previewRoomBlockLocally({
      rooms,
      blocks,
      bookings,
      roomId: room.id,
      blockType,
      startDate: previewFrom,
      endDate,
      dataTo,
    });
  }, [
    open,
    room,
    rangeInvalid,
    isEdit,
    rooms,
    blocks,
    bookings,
    blockType,
    startDate,
    endDate,
    dataTo,
  ]);

  const createBlock = useCreateRoomBlock(hotelId);
  const updateBlock = useUpdateRoomBlock(hotelId);
  const isPending = createBlock.isPending || updateBlock.isPending;

  if (!room) return null;

  const submit = async () => {
    if (reasonMissing || rangeInvalid) {
      setShowErrors(true);
      return;
    }
    try {
      if (block) {
        const patch: UpdateRoomBlockPayload = {
          endDate,
          reason: reason.trim(),
          ...(estimatedCost !== undefined ? { estimatedCost } : {}),
        };
        const result = await updateBlock.mutateAsync({
          roomId: room.id,
          blockId: block.id,
          payload: patch,
        });
        const affected = result.affectedBookings.length;
        const oldEnd = block.endDate.slice(0, 10);
        const verb = endDate > oldEnd ? 'extended' : endDate < oldEnd ? 'shortened' : 'updated';
        toast.success(
          affected > 0
            ? `Block ${verb} to ${dayMonth(endDate)} — ${affected} booking${affected === 1 ? '' : 's'} need a new room.`
            : `Block on room ${room.roomNumber} ${verb} to ${dayMonth(endDate)}.`
        );
        onClose();
        return;
      }

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
      toast.error(
        errorMessage(err, block ? 'Could not update this block.' : 'Could not block this room.')
      );
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
      title={isEdit ? `Update block on room ${room.roomNumber}` : `Block room ${room.roomNumber}`}
      description={
        isEdit
          ? `${room.roomType.name} · move the day this room comes back`
          : `${room.roomType.name} · applies only to the dates you pick`
      }
      icon={Wrench}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => void submit()}
            disabled={isPending}
            className="bg-slate-900 text-white hover:bg-slate-800"
          >
            {isPending && <Loader2 className="mr-1.5 size-4 animate-spin" />}
            {isEdit ? 'Save changes' : 'Block room'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {isEdit ? (
          // Loại chặn cố định khi sửa: đổi nó là đổi luôn ý nghĩa tồn kho (`ooo` trừ kho, `oos`
          // thì không), nên BE bắt phải gỡ đợt cũ rồi tạo đợt mới. Hiện read-only kèm lý do.
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <span className="flex items-center gap-2 text-sm font-medium text-slate-900">
              {(() => {
                const meta = BLOCK_TYPES.find(m => m.value === blockType) ?? BLOCK_TYPES[0];
                const Icon = meta.icon;
                return (
                  <>
                    <Icon className="size-4 text-slate-500" />
                    {meta.label}
                  </>
                );
              })()}
            </span>
            <span className="mt-1 block text-xs leading-snug text-slate-500">
              The block type cannot change — end this block and start a new one instead.
            </span>
          </div>
        ) : (
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
                  <span className="mt-1 block text-xs leading-snug text-slate-500">
                    {meta.hint}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="block-start"
              className="mb-1 block text-xs font-medium text-slate-600"
            >
              First blocked day
            </label>
            {isEdit ? (
              <>
                <div className="flex h-9 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
                  {dayMonth(startDate)}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Already started — only the end day can move.
                </p>
              </>
            ) : (
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
            )}
          </div>
          <div>
            <label htmlFor="block-end" className="mb-1 block text-xs font-medium text-slate-600">
              Last blocked day
            </label>
            <DatePicker
              id="block-end"
              value={endDate}
              onChange={setEndDate}
              // Khi sửa, ngày kết thúc được phép lùi tới tận ngày bắt đầu (rút ngắn), kể cả về quá
              // khứ — BE chỉ đòi `endDate >= startDate`.
              min={isEdit ? startDate : startDate || todayUtcKey()}
              clearable={false}
              placeholder="Pick a date"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              {isEdit
                ? `Was ${dayMonth(block?.endDate.slice(0, 10) ?? endDate)} — move it later to extend, earlier to bring the room back sooner.`
                : 'This day is still blocked — same day in both fields blocks a single night.'}
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
          {/* Xoá trắng ô này KHÔNG xoá được số đã lưu — BE không nhận `null` cho chi phí. */}
          {isEdit && block?.estimatedCost != null && cost.trim() === '' && (
            <p className="mt-1 text-[11px] text-amber-600">
              Clearing this box keeps the saved cost — enter 0 to zero it out.
            </p>
          )}
        </div>

        {/* Xem trước tính tại client trên đúng dữ liệu của lịch — không gọi BE, không ghi gì. */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-600">
            {isEdit ? 'Impact of the new dates' : 'Impact of this block'}
          </p>

          {/* Nói thẳng "sớm/muộn mấy ngày" — staff nghĩ theo số ngày, không theo hai mốc ngày. */}
          {isEdit && block && !rangeInvalid && (
            <p className="mt-2 text-xs text-slate-600">{describeShift(block.endDate, endDate)}</p>
          )}

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
