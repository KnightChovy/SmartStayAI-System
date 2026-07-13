import { useState } from 'react';
import { Loader2, MapPinned, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/hotel-partner/shared/Modal';
import { ErrorState } from '@/components/hotel-partner/shared/states';
import { ListSkeleton } from '@/components/shared/skeletons';
import { useHotelNearbyPlaces, useSetHotelNearbyPlaces } from '@/hooks/hotel-property';
import { errorMessage } from '@/utils/errorMessage';
import type {
  DistanceUnit,
  NearbyCategory,
  TransportType,
} from '@/types/hotel-property.types';
import { SelectField, TextField } from './fields';
import {
  DISTANCE_UNIT_OPTIONS,
  NEARBY_CATEGORY_OPTIONS,
  TRANSPORT_TYPE_OPTIONS,
} from './labels';

interface NearbyRow {
  name: string;
  category: NearbyCategory;
  distance: string;
  distanceUnit: DistanceUnit;
  transportType: TransportType | '';
  journeyMinutes: string;
}

const emptyRow: NearbyRow = {
  name: '',
  category: 'attraction',
  distance: '',
  distanceUnit: 'km',
  transportType: '',
  journeyMinutes: '',
};

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

/** Editor replace-all cho địa điểm lân cận (`GET/PUT /hotels/:id/nearby-places`). */
export function HotelNearbyPlacesModal({ open, onClose, hotelId, hotelName }: Props) {
  const { data, isLoading, isError } = useHotelNearbyPlaces(hotelId);
  const setNearby = useSetHotelNearbyPlaces(hotelId);
  const [rows, setRows] = useState<NearbyRow[] | null>(null);

  const current: NearbyRow[] =
    rows ??
    (data ?? []).map(p => ({
      name: p.name,
      category: p.category,
      distance: p.distance ?? '',
      distanceUnit: p.distanceUnit,
      transportType: p.transportType ?? '',
      journeyMinutes: p.journeyMinutes != null ? String(p.journeyMinutes) : '',
    }));

  const update = (i: number, patch: Partial<NearbyRow>) =>
    setRows(current.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const add = () => setRows([...current, { ...emptyRow }]);
  const remove = (i: number) => setRows(current.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    // Bỏ qua dòng chưa nhập tên (BE bắt buộc name).
    const valid = current.filter(r => r.name.trim() !== '');
    try {
      await setNearby.mutateAsync({
        nearbyPlaces: valid.map(r => ({
          name: r.name.trim(),
          category: r.category,
          distance: toNum(r.distance) ?? 0,
          distanceUnit: r.distanceUnit,
          transportType: r.transportType || null,
          journeyMinutes: toNum(r.journeyMinutes),
        })),
      });
      toast.success('Nearby places updated');
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to update nearby places'));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nearby places"
      description={`${hotelName} · ${current.length} place(s)`}
      icon={MapPinned}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={setNearby.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={setNearby.isPending || isLoading}
            className="bg-role-partner-primary text-white hover:bg-role-partner-secondary"
          >
            {setNearby.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Save places
          </Button>
        </>
      }
    >
      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : isError ? (
        <ErrorState label="Failed to load nearby places." />
      ) : (
        <div className="space-y-3">
          {current.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-400">
              No nearby places yet. Add one below.
            </p>
          )}
          {current.map((row, i) => (
            <div key={i} className="rounded-xl border border-slate-200 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Place {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                  aria-label="Remove place"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <TextField
                  label="Name"
                  value={row.name}
                  onChange={v => update(i, { name: v })}
                  placeholder="e.g. Ben Thanh Market"
                />
                <SelectField
                  label="Category"
                  value={row.category}
                  onChange={v => update(i, { category: (v || 'attraction') as NearbyCategory })}
                  options={NEARBY_CATEGORY_OPTIONS}
                />
                <TextField
                  label="Distance"
                  type="number"
                  value={row.distance}
                  onChange={v => update(i, { distance: v })}
                  placeholder="e.g. 1.2"
                />
                <SelectField
                  label="Distance unit"
                  value={row.distanceUnit}
                  onChange={v => update(i, { distanceUnit: (v || 'km') as DistanceUnit })}
                  options={DISTANCE_UNIT_OPTIONS}
                />
                <SelectField
                  label="Transport"
                  value={row.transportType}
                  onChange={v => update(i, { transportType: v as TransportType | '' })}
                  options={TRANSPORT_TYPE_OPTIONS}
                  emptyLabel="—"
                />
                <TextField
                  label="Journey (minutes)"
                  type="number"
                  value={row.journeyMinutes}
                  onChange={v => update(i, { journeyMinutes: v })}
                  placeholder="e.g. 15"
                />
              </div>
            </div>
          ))}
          <Button variant="outline" onClick={add} className="w-full">
            <Plus className="mr-1.5 h-4 w-4" /> Add place
          </Button>
        </div>
      )}
    </Modal>
  );
}
