import { useState } from 'react';
import { Loader2, ScrollText, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/hotel-partner/shared/Modal';
import { ErrorState } from '@/components/hotel-partner/shared/states';
import { ListSkeleton } from '@/components/shared/skeletons';
import { useHotelPolicies, useSetHotelPolicies } from '@/hooks/hotel-property';
import { errorMessage } from '@/utils/errorMessage';
import type { ChargeFrequency, PolicyType } from '@/types/hotel-property.types';
import { SelectField, TextField } from './fields';
import { CHARGE_FREQUENCY_OPTIONS, POLICY_TYPE_OPTIONS } from './labels';

interface PolicyRow {
  policyType: PolicyType;
  code: string;
  description: string;
  amount: string;
  isPercentage: boolean;
  chargeFrequency: ChargeFrequency | '';
  minAge: string;
  maxAge: string;
}

const emptyRow: PolicyRow = {
  policyType: 'fee',
  code: '',
  description: '',
  amount: '',
  isPercentage: false,
  chargeFrequency: '',
  minAge: '',
  maxAge: '',
};

/** '' -> null, số hợp lệ -> number. */
function toNum(v: string): number | null {
  const t = v.trim();
  if (t === '') return null;
  const n = Number(t);
  return Number.isNaN(n) ? null : n;
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
  const [rows, setRows] = useState<PolicyRow[] | null>(null);

  const current: PolicyRow[] =
    rows ??
    (data ?? []).map(p => ({
      policyType: p.policyType,
      code: p.code ?? '',
      description: p.description ?? '',
      amount: p.amount ?? '',
      isPercentage: p.isPercentage,
      chargeFrequency: p.chargeFrequency ?? '',
      minAge: p.minAge != null ? String(p.minAge) : '',
      maxAge: p.maxAge != null ? String(p.maxAge) : '',
    }));

  const update = (i: number, patch: Partial<PolicyRow>) =>
    setRows(current.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const add = () => setRows([...current, { ...emptyRow }]);
  const remove = (i: number) => setRows(current.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    try {
      await setPolicies.mutateAsync({
        policies: current.map(r => ({
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
      description={`${hotelName} · ${current.length} item(s)`}
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
          {current.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-400">
              No policies yet. Add one below.
            </p>
          )}
          {current.map((row, i) => (
            <div key={i} className="rounded-xl border border-slate-200 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Policy {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                  aria-label="Remove policy"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <SelectField
                  label="Type"
                  value={row.policyType}
                  onChange={v => update(i, { policyType: (v || 'fee') as PolicyType })}
                  options={POLICY_TYPE_OPTIONS}
                />
                <TextField
                  label="Code"
                  value={row.code}
                  onChange={v => update(i, { code: v })}
                  placeholder="Optional code"
                />
                <TextField
                  label="Amount"
                  type="number"
                  value={row.amount}
                  onChange={v => update(i, { amount: v })}
                  placeholder="e.g. 8"
                />
                <SelectField
                  label="Charge frequency"
                  value={row.chargeFrequency}
                  onChange={v => update(i, { chargeFrequency: v as ChargeFrequency | '' })}
                  options={CHARGE_FREQUENCY_OPTIONS}
                  emptyLabel="—"
                />
                <TextField
                  label="Min age"
                  type="number"
                  value={row.minAge}
                  onChange={v => update(i, { minAge: v })}
                  placeholder="0–120"
                />
                <TextField
                  label="Max age"
                  type="number"
                  value={row.maxAge}
                  onChange={v => update(i, { maxAge: v })}
                  placeholder="0–120"
                />
                <TextField
                  label="Description"
                  value={row.description}
                  onChange={v => update(i, { description: v })}
                  placeholder="Describe the policy / fee"
                  className="sm:col-span-2"
                />
                <label className="flex items-center gap-2 text-sm text-slate-600 sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={row.isPercentage}
                    onChange={e => update(i, { isPercentage: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-role-partner-primary"
                  />
                  Amount is a percentage (%)
                </label>
              </div>
            </div>
          ))}
          <Button variant="outline" onClick={add} className="w-full">
            <Plus className="mr-1.5 h-4 w-4" /> Add policy
          </Button>
        </div>
      )}
    </Modal>
  );
}
