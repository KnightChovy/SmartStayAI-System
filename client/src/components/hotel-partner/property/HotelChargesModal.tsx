import { Loader2, Percent, Plus, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/hotel-partner/shared/Modal';
import { Pill } from '@/components/hotel-partner/shared/Pill';
import { ErrorState } from '@/components/hotel-partner/shared/states';
import { ListSkeleton } from '@/components/shared/skeletons';
import { useHotelCharges, useSetHotelCharges } from '@/hooks/hotel-property';
import { errorMessage } from '@/utils/errorMessage';
import { formatCurrency } from '@/utils/formatCurrency';
import type { ChargeFrequency, ChargeType } from '@/types/hotel-property.types';
import { EditableRow, RowSummary } from './EditableRow';
import { CheckboxField, SelectField, TextField } from './fields';
import { useRowEditor, type RowWithId } from './use-row-editor';
import {
  CHARGE_FREQUENCY_OPTIONS,
  CHARGE_TYPE_OPTIONS,
  CHARGE_TYPE_TONE,
  optionLabel,
} from './labels';

/** Giới hạn tên của BE (Joi `setHotelCharges`). */
const NAME_MAX = 200;

interface ChargeRow extends RowWithId {
  chargeType: ChargeType;
  name: string;
  amount: string;
  isPercentage: boolean;
  chargeFrequency: ChargeFrequency;
}

const emptyRow = (id: string): ChargeRow => ({
  id,
  chargeType: 'tax',
  name: '',
  amount: '',
  isPercentage: false,
  chargeFrequency: 'per_stay',
});

/** Số hợp lệ ≥ 0, ngược lại `null`. */
function toAmount(v: string): number | null {
  const t = v.trim();
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Dòng chỉ được gửi lên khi BE chấp nhận: có tên + có số tiền hợp lệ. */
function isSavable(row: ChargeRow): boolean {
  return row.name.trim() !== '' && toAmount(row.amount) != null;
}

/** Thông tin phụ của một khoản thu, chỉ gồm field đã nhập. */
function summaryBits(row: ChargeRow): string[] {
  const amount = toAmount(row.amount);
  // Thiếu số tiền là dòng BE sẽ từ chối ⇒ nói thẳng thay vì im lặng bỏ qua lúc lưu.
  if (amount == null) return ['Missing amount — won’t be saved'];
  const bits = [row.isPercentage ? `${amount}% of room subtotal` : formatCurrency(row.amount)];
  // Tần suất chỉ có ý nghĩa với số tiền tuyệt đối — % luôn tính trên tiền phòng cả kỳ.
  if (!row.isPercentage) {
    bits.push(optionLabel(CHARGE_FREQUENCY_OPTIONS, row.chargeFrequency));
  }
  return bits;
}

interface Props {
  open: boolean;
  onClose: () => void;
  hotelId: string;
  hotelName: string;
}

/**
 * Editor replace-all cho **thuế/phí** của khách sạn (`GET/PUT /hotels/:id/charges`).
 *
 * Đây là bảng engine đọc để tính tiền (`computeTaxAndFees`): đổi số ở đây là đổi số tiền
 * khách trả cho các ĐƠN MỚI. Đơn đã đặt giữ nguyên vì thuế/phí đã đóng băng vào Booking.
 *
 * ⚠️ Hợp đồng BE: `chargeFrequency` bị **cấm** khi `isPercentage = true` và **bắt buộc** khi
 * `false` — nên form ẩn hẳn ô tần suất ở chế độ %, và payload cũng không gửi field đó.
 */
export function HotelChargesModal({ open, onClose, hotelId, hotelName }: Props) {
  const { data, isLoading, isError } = useHotelCharges(hotelId);
  const setCharges = useSetHotelCharges(hotelId);

  const seed: ChargeRow[] = (data ?? []).map(c => ({
    id: c.id,
    chargeType: c.chargeType,
    name: c.name,
    amount: c.amount ?? '',
    isPercentage: c.isPercentage,
    chargeFrequency: c.chargeFrequency ?? 'per_stay',
  }));

  const { rows, add, update, remove, isNew, isEditing, startEdit, stopEdit } = useRowEditor(
    seed,
    emptyRow
  );

  const handleSave = async () => {
    const valid = rows.filter(isSavable);
    try {
      await setCharges.mutateAsync({
        charges: valid.map(r => ({
          chargeType: r.chargeType,
          name: r.name.trim().slice(0, NAME_MAX),
          amount: toAmount(r.amount) as number,
          isPercentage: r.isPercentage,
          // BE `forbidden` khi tính theo % ⇒ tuyệt đối không gửi field này ở chế độ đó.
          ...(r.isPercentage ? {} : { chargeFrequency: r.chargeFrequency }),
        })),
      });
      toast.success('Taxes & fees updated');
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to update taxes & fees'));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Taxes & fees"
      description={`${hotelName} · ${rows.length} charge(s)`}
      icon={Receipt}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={setCharges.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={setCharges.isPending || isLoading}
            className="bg-role-partner-primary text-white hover:bg-role-partner-secondary"
          >
            {setCharges.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Save charges
          </Button>
        </>
      }
    >
      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : isError ? (
        <ErrorState label="Failed to load taxes & fees." />
      ) : (
        <div className="space-y-3">
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            These amounts are added on top of the room price. Changes apply to{' '}
            <span className="font-semibold">new bookings only</span> — existing bookings keep
            the taxes and fees frozen at the time they were made.
          </p>
          {rows.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-400">
              No taxes or fees yet. Guests pay the room price only.
            </p>
          )}
          {rows.map(row => (
            <EditableRow
              key={row.id}
              editing={isEditing(row.id)}
              entity="charge"
              editingLabel={isNew(row.id) ? 'New charge' : 'Editing charge'}
              onEdit={() => startEdit(row.id)}
              onDone={() => stopEdit(row.id)}
              onRemove={() => remove(row.id)}
              summary={
                <RowSummary
                  badge={
                    <Pill tone={CHARGE_TYPE_TONE[row.chargeType]}>
                      {optionLabel(CHARGE_TYPE_OPTIONS, row.chargeType)}
                    </Pill>
                  }
                  meta={summaryBits(row)}
                  primary={row.name}
                  emptyPrimary="Unnamed — won’t be saved"
                />
              }
            >
              <SelectField
                label="Type"
                value={row.chargeType}
                onChange={v => update(row.id, { chargeType: (v || 'tax') as ChargeType })}
                options={CHARGE_TYPE_OPTIONS}
              />
              <TextField
                label="Name"
                value={row.name}
                onChange={v => update(row.id, { name: v.slice(0, NAME_MAX) })}
                placeholder="e.g. VAT 8%"
              />
              <TextField
                label={row.isPercentage ? 'Amount (%)' : 'Amount (VND)'}
                type="number"
                value={row.amount}
                onChange={v => update(row.id, { amount: v })}
                placeholder={row.isPercentage ? 'e.g. 8' : 'e.g. 50000'}
              />
              {row.isPercentage ? (
                <p className="flex items-center gap-1.5 self-end pb-2 text-xs text-slate-400">
                  <Percent className="h-3.5 w-3.5 shrink-0" />
                  Percentages always apply to the whole room subtotal.
                </p>
              ) : (
                <SelectField
                  label="Charge frequency"
                  value={row.chargeFrequency}
                  onChange={v =>
                    update(row.id, { chargeFrequency: (v || 'per_stay') as ChargeFrequency })
                  }
                  options={CHARGE_FREQUENCY_OPTIONS}
                />
              )}
              <CheckboxField
                label="Amount is a percentage (%)"
                hint="Calculated on the room subtotal; frequency does not apply."
                checked={row.isPercentage}
                onChange={v => update(row.id, { isPercentage: v })}
                className="sm:col-span-2"
              />
            </EditableRow>
          ))}
          <Button variant="outline" onClick={add} className="w-full">
            <Plus className="mr-1.5 h-4 w-4" /> Add charge
          </Button>
        </div>
      )}
    </Modal>
  );
}
