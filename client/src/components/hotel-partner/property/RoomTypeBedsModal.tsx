import { useState } from 'react';
import { Loader2, BedDouble, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/hotel-partner/shared/Modal';
import { ErrorState } from '@/components/hotel-partner/shared/states';
import { ListSkeleton } from '@/components/shared/skeletons';
import { useRoomBeds, useSetRoomBeds } from '@/hooks/hotel-property';
import { errorMessage } from '@/utils/errorMessage';
import type { BedType } from '@/types/hotel-management.types';
import { SelectField, TextField } from './fields';
import { BED_TYPE_OPTIONS } from './labels';

interface BedRow {
  bedType: BedType;
  quantity: string;
}

const emptyRow: BedRow = { bedType: 'double', quantity: '1' };

interface Props {
  open: boolean;
  onClose: () => void;
  hotelId: string;
  roomTypeId: string;
  roomTypeName: string;
}

/** Editor replace-all cho cấu hình giường của một loại phòng (`GET/PUT .../beds`). */
export function RoomTypeBedsModal({
  open,
  onClose,
  hotelId,
  roomTypeId,
  roomTypeName,
}: Props) {
  const { data, isLoading, isError } = useRoomBeds(hotelId, roomTypeId);
  const setBeds = useSetRoomBeds(hotelId, roomTypeId);
  const [rows, setRows] = useState<BedRow[] | null>(null);

  const current: BedRow[] =
    rows ??
    (data ?? []).map(b => ({ bedType: b.bedType, quantity: String(b.quantity) }));

  const update = (i: number, patch: Partial<BedRow>) =>
    setRows(current.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const add = () => setRows([...current, { ...emptyRow }]);
  const remove = (i: number) => setRows(current.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    try {
      await setBeds.mutateAsync({
        beds: current.map(r => {
          const q = Number(r.quantity);
          return {
            bedType: r.bedType,
            quantity: Number.isFinite(q) && q >= 1 ? Math.floor(q) : 1,
          };
        }),
      });
      toast.success('Bed configuration updated');
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to update beds'));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Bed configuration"
      description={`${roomTypeName} · ${current.length} bed type(s)`}
      icon={BedDouble}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={setBeds.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={setBeds.isPending || isLoading}
            className="bg-role-partner-primary text-white hover:bg-role-partner-secondary"
          >
            {setBeds.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Save beds
          </Button>
        </>
      }
    >
      {isLoading ? (
        <ListSkeleton rows={2} />
      ) : isError ? (
        <ErrorState label="Failed to load bed configuration." />
      ) : (
        <div className="space-y-3">
          {current.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-400">
              No beds configured yet. Add one below.
            </p>
          )}
          {current.map((row, i) => (
            <div key={i} className="flex items-end gap-3 rounded-xl border border-slate-200 p-3">
              <SelectField
                label="Bed type"
                value={row.bedType}
                onChange={v => update(i, { bedType: (v || 'double') as BedType })}
                options={BED_TYPE_OPTIONS}
                className="flex-1"
              />
              <TextField
                label="Quantity"
                type="number"
                value={row.quantity}
                onChange={v => update(i, { quantity: v })}
                className="w-24"
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="mb-1 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500"
                aria-label="Remove bed"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <Button variant="outline" onClick={add} className="w-full">
            <Plus className="mr-1.5 h-4 w-4" /> Add bed type
          </Button>
        </div>
      )}
    </Modal>
  );
}
