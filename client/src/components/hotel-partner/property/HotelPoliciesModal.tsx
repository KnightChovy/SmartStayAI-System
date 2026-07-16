import { Loader2, Plus, ScrollText } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/hotel-partner/shared/Modal';
import { Pill } from '@/components/hotel-partner/shared/Pill';
import { ErrorState } from '@/components/hotel-partner/shared/states';
import { ListSkeleton } from '@/components/shared/skeletons';
import { useHotelPolicies, useSetHotelPolicies } from '@/hooks/hotel-property';
import { errorMessage } from '@/utils/errorMessage';
import { formatCurrency } from '@/utils/formatCurrency';
import type { ChargeFrequency, PolicyType } from '@/types/hotel-property.types';
import { EditableRow, RowSummary } from './EditableRow';
import { SelectField, TextField } from './fields';
import { useRowEditor, type RowWithId } from './use-row-editor';
import {
  CHARGE_FREQUENCY_OPTIONS,
  POLICY_TYPE_OPTIONS,
  POLICY_TYPE_TONE,
  optionLabel,
} from './labels';

interface PolicyRow extends RowWithId {
  policyType: PolicyType;
  code: string;
  description: string;
  amount: string;
  isPercentage: boolean;
  chargeFrequency: ChargeFrequency | '';
  minAge: string;
  maxAge: string;
}

const emptyRow = (id: string): PolicyRow => ({
  id,
  policyType: 'fee',
  code: '',
  description: '',
  amount: '',
  isPercentage: false,
  chargeFrequency: '',
  minAge: '',
  maxAge: '',
});

/** '' -> null, số hợp lệ -> number. */
function toNum(v: string): number | null {
  const t = v.trim();
  if (t === '') return null;
  const n = Number(t);
  return Number.isNaN(n) ? null : n;
}

/** Khoảng tuổi ở dạng đọc được: "Age 0–12" / "Age 18+" / "Age up to 12". */
function ageSummary(minAge: string, maxAge: string): string | null {
  const min = minAge.trim();
  const max = maxAge.trim();
  if (min && max) return `Age ${min}–${max}`;
  if (min) return `Age ${min}+`;
  if (max) return `Age up to ${max}`;
  return null;
}

/** Thông tin phụ của một policy, chỉ gồm field đã nhập. */
function summaryBits(row: PolicyRow): string[] {
  const bits: string[] = [];
  const amount = row.amount.trim();
  if (amount) bits.push(row.isPercentage ? `${amount}%` : formatCurrency(amount));
  if (row.chargeFrequency)
    bits.push(optionLabel(CHARGE_FREQUENCY_OPTIONS, row.chargeFrequency));
  const age = ageSummary(row.minAge, row.maxAge);
  if (age) bits.push(age);
  if (row.code.trim()) bits.push(`Code ${row.code.trim()}`);
  return bits;
}

interface Props {
  open: boolean;
  onClose: () => void;
  hotelId: string;
  hotelName: string;
}

/** Editor replace-all cho policies/fees của khách sạn (`GET/PUT /hotels/:id/policies`). */
export function HotelPoliciesModal({ open, onClose, hotelId, hotelName }: Props) {
  const { data, isLoading, isError } = useHotelPolicies(hotelId);
  const setPolicies = useSetHotelPolicies(hotelId);

  const seed: PolicyRow[] = (data ?? []).map(p => ({
    id: p.id,
    policyType: p.policyType,
    code: p.code ?? '',
    description: p.description ?? '',
    amount: p.amount ?? '',
    isPercentage: p.isPercentage,
    chargeFrequency: p.chargeFrequency ?? '',
    minAge: p.minAge != null ? String(p.minAge) : '',
    maxAge: p.maxAge != null ? String(p.maxAge) : '',
  }));

  const { rows, add, update, remove, isNew, isEditing, startEdit, stopEdit } = useRowEditor(
    seed,
    emptyRow
  );

  const handleSave = async () => {
    try {
      await setPolicies.mutateAsync({
        policies: rows.map(r => ({
          policyType: r.policyType,
          code: r.code.trim() || null,
          description: r.description.trim() || null,
          amount: toNum(r.amount),
          isPercentage: r.isPercentage,
          chargeFrequency: r.chargeFrequency || null,
          minAge: toNum(r.minAge),
          maxAge: toNum(r.maxAge),
        })),
      });
      toast.success('Policies updated');
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to update policies'));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Hotel policies & fees"
      description={`${hotelName} · ${rows.length} item(s)`}
      icon={ScrollText}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={setPolicies.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={setPolicies.isPending || isLoading}
            className="bg-role-partner-primary text-white hover:bg-role-partner-secondary"
          >
            {setPolicies.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Save policies
          </Button>
        </>
      }
    >
      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : isError ? (
        <ErrorState label="Failed to load policies." />
      ) : (
        <div className="space-y-3">
          {rows.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-400">
              No policies yet. Add one below.
            </p>
          )}
          {rows.map(row => (
            <EditableRow
              key={row.id}
              editing={isEditing(row.id)}
              entity="policy"
              editingLabel={isNew(row.id) ? 'New policy' : 'Editing policy'}
              onEdit={() => startEdit(row.id)}
              onDone={() => stopEdit(row.id)}
              onRemove={() => remove(row.id)}
              summary={
                <RowSummary
                  badge={
                    <Pill tone={POLICY_TYPE_TONE[row.policyType]}>
                      {optionLabel(POLICY_TYPE_OPTIONS, row.policyType)}
                    </Pill>
                  }
                  meta={summaryBits(row)}
                  primary={row.description}
                  emptyPrimary="No description"
                />
              }
            >
              <SelectField
                label="Type"
                value={row.policyType}
                onChange={v => update(row.id, { policyType: (v || 'fee') as PolicyType })}
                options={POLICY_TYPE_OPTIONS}
              />
              <TextField
                label="Code"
                value={row.code}
                onChange={v => update(row.id, { code: v })}
                placeholder="Optional code"
              />
              <TextField
                label="Amount"
                type="number"
                value={row.amount}
                onChange={v => update(row.id, { amount: v })}
                placeholder="e.g. 8"
              />
              <SelectField
                label="Charge frequency"
                value={row.chargeFrequency}
                onChange={v => update(row.id, { chargeFrequency: v as ChargeFrequency | '' })}
                options={CHARGE_FREQUENCY_OPTIONS}
                emptyLabel="—"
              />
              <TextField
                label="Min age"
                type="number"
                value={row.minAge}
                onChange={v => update(row.id, { minAge: v })}
                placeholder="0–120"
              />
              <TextField
                label="Max age"
                type="number"
                value={row.maxAge}
                onChange={v => update(row.id, { maxAge: v })}
                placeholder="0–120"
              />
              <TextField
                label="Description"
                value={row.description}
                onChange={v => update(row.id, { description: v })}
                placeholder="Describe the policy / fee"
                className="sm:col-span-2"
              />
              <label className="flex items-center gap-2 text-sm text-slate-600 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={row.isPercentage}
                  onChange={e => update(row.id, { isPercentage: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-role-partner-primary"
                />
                Amount is a percentage (%)
              </label>
            </EditableRow>
          ))}
          <Button variant="outline" onClick={add} className="w-full">
            <Plus className="mr-1.5 h-4 w-4" /> Add policy
          </Button>
        </div>
      )}
    </Modal>
  );
}
