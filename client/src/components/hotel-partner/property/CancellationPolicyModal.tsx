import { useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, CalendarX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/hotel-partner/shared/Modal';
import { ListSkeleton } from '@/components/shared/skeletons';
import { cn } from '@/lib/cn';
import { useCancellationPresets, useUpdateHotel } from '@/hooks/hotels';
import type { ManagedHotel } from '@/types/hotel-management.types';
import type { CancellationPreset } from '@/types/hotel.types';
import type { CancellationTier } from '@/types/booking.types';
import { errorMessage } from '@/utils/errorMessage';

/**
 * Bóc thang chính sách huỷ từ `settings` thô của endpoint quản trị.
 *
 * Cần hàm này vì `GET /hotels/:id/manage` trả JSON **chưa parse** (khác endpoint công khai đã có
 * sẵn `cancellationRule`). Phòng thủ từng bước: `settings` là JSON tự do, một khoá gõ sai từ trước
 * là cả khối trở thành rác — trả `null` để UI nói "chưa đặt" thay vì vẽ một thang bịa.
 */
function readCancellationTiers(
  settings: Record<string, unknown> | null | undefined
): CancellationTier[] | null {
  const cancellation = settings?.cancellation;
  if (!cancellation || typeof cancellation !== 'object') return null;
  const tiers = (cancellation as Record<string, unknown>).tiers;
  if (!Array.isArray(tiers) || tiers.length === 0) return null;
  const parsed = tiers.filter(
    (tier): tier is CancellationTier =>
      typeof tier === 'object' &&
      tier !== null &&
      typeof (tier as CancellationTier).minHoursBefore === 'number' &&
      typeof (tier as CancellationTier).refundPercent === 'number'
  );
  return parsed.length === tiers.length ? parsed : null;
}

interface CancellationPolicyModalProps {
  open: boolean;
  onClose: () => void;
  hotel: ManagedHotel;
}

/** "Trước 30 ngày" / "Trước 48 giờ" / "Tới sát giờ nhận phòng". */
function tierLabel(tier: CancellationTier): string {
  if (tier.minHoursBefore === 0) return 'Up to check-in';
  if (tier.minHoursBefore % 24 === 0) {
    const days = tier.minHoursBefore / 24;
    return `${days} day${days === 1 ? '' : 's'} before`;
  }
  return `${tier.minHoursBefore}h before`;
}

/** Hai thang giống nhau ⇒ preset nào đang được áp (so cả thứ tự vì BE luôn trả giảm dần). */
function sameTiers(a: CancellationTier[], b: CancellationTier[]): boolean {
  return (
    a.length === b.length &&
    a.every(
      (tier, i) =>
        tier.minHoursBefore === b[i].minHoursBefore && tier.refundPercent === b[i].refundPercent
    )
  );
}

function TierLadder({ tiers }: { tiers: CancellationTier[] }) {
  return (
    <ul className="space-y-0.5">
      {tiers.map(tier => (
        <li key={tier.minHoursBefore} className="flex justify-between gap-3 text-xs">
          <span className="text-slate-500">{tierLabel(tier)}</span>
          <span className="font-medium text-slate-700">{tier.refundPercent}% refunded</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Chọn chính sách huỷ cho khách sạn — **con số quyết định tiền hoàn cho khách**.
 *
 * Khác hẳn ô "Cancellation policy" trong hồ sơ khách sạn: ô đó chỉ là đoạn văn cho khách đọc,
 * không ảnh hưởng một đồng nào. Cái ở đây ghi vào `settings.cancellation.tiers` và chính là thứ
 * `refund-preview` / `cancelBooking` dùng để tính tiền.
 *
 * ⚠️ Chỉ cho chọn trong **preset của BE**, không cho tự soạn bậc: BE ràng buộc thang phải phủ kín
 * (có bậc 0) và giảm dần, sai một chỗ là 400 — và quan trọng hơn, một thang tự chế sai luật sẽ âm
 * thầm rơi về mặc định, tức KS tưởng mình đang áp "Rất chặt" mà khách lại được hoàn theo "Vừa phải".
 */
export function CancellationPolicyModal({ open, onClose, hotel }: CancellationPolicyModalProps) {
  const presetsQuery = useCancellationPresets();
  const updateHotel = useUpdateHotel(hotel.id);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const presets = presetsQuery.data ?? [];
  const current = readCancellationTiers(hotel.settings);
  const currentPreset = current
    ? (presets.find(preset => sameTiers(preset.tiers, current)) ?? null)
    : null;

  // Mở lại modal thì bỏ lựa chọn dở dang của lần trước.
  const [syncedOpen, setSyncedOpen] = useState(open);
  if (open !== syncedOpen) {
    setSyncedOpen(open);
    if (open) setSelectedKey(null);
  }

  const chosen: CancellationPreset | null =
    presets.find(preset => preset.key === selectedKey) ?? null;

  const save = async () => {
    if (!chosen) return;
    try {
      await updateHotel.mutateAsync({
        settings: {
          cancellation: {
            tiers: chosen.tiers,
            noShowRefundPercent: chosen.noShowRefundPercent,
          },
        },
      });
      toast.success(`Cancellation policy set to "${chosen.name}".`);
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not save the cancellation policy.'));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cancellation policy"
      description="Decides how much a guest gets back when they cancel"
      icon={CalendarX}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={updateHotel.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => void save()}
            disabled={!chosen || updateHotel.isPending}
            className="bg-role-partner-primary hover:bg-role-partner-secondary text-white"
          >
            {updateHotel.isPending && <Loader2 className="mr-1.5 size-4 animate-spin" />}
            Save policy
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Chính sách đang áp — kể cả khi nó không khớp preset nào (đặt qua API). */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-600">
            Currently applied
            {currentPreset ? ` · ${currentPreset.name}` : current ? ' · Custom' : ''}
          </p>
          {current ? (
            <div className="mt-2">
              <TierLadder tiers={current} />
            </div>
          ) : (
            <p className="mt-1 text-xs text-slate-500">
              Not set — guests are refunded under the platform default (Moderate) until you pick
              one.
            </p>
          )}
        </div>

        {/* Đổi chính sách KHÔNG áp ngược cho đơn cũ — nói ra để partner khỏi tưởng mình vừa
            đổi điều khoản của khách đã đặt (BE snapshot policy vào booking lúc đặt). */}
        <p className="flex gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          Only applies to new bookings. Guests who already booked keep the policy that was in force
          when they booked.
        </p>

        {presetsQuery.isLoading && <ListSkeleton rows={3} />}
        {presetsQuery.isError && (
          <p className="text-sm text-rose-600">Could not load the policy presets.</p>
        )}

        <div className="space-y-2">
          {presets.map(preset => {
            const active = selectedKey === preset.key;
            const isCurrent = currentPreset?.key === preset.key;
            return (
              <button
                key={preset.key}
                type="button"
                onClick={() => setSelectedKey(preset.key)}
                aria-pressed={active}
                className={cn(
                  'w-full rounded-xl border p-3 text-left transition-colors',
                  active
                    ? 'border-role-partner-primary bg-role-partner-light'
                    : 'border-slate-200 hover:border-slate-300'
                )}
              >
                <span className="flex items-center gap-2 text-sm font-medium text-slate-900">
                  {preset.name}
                  {isCurrent && (
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                      in use
                    </span>
                  )}
                </span>
                <div className="mt-1.5">
                  <TierLadder tiers={preset.tiers} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
