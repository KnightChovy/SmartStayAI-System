import { Loader2, MapPinned, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/hotel-partner/shared/Modal';
import { Pill } from '@/components/hotel-partner/shared/Pill';
import { ErrorState } from '@/components/hotel-partner/shared/states';
import { ListSkeleton } from '@/components/shared/skeletons';
import { useHotelNearbyPlaces, useSetHotelNearbyPlaces } from '@/hooks/hotel-property';
import { errorMessage } from '@/utils/errorMessage';
import type {
  DistanceUnit,
  NearbyCategory,
  TransportType,
} from '@/types/hotel-property.types';
import { EditableRow, RowSummary } from './EditableRow';
import { SelectField, TextField } from './fields';
import { useRowEditor, type RowWithId } from './use-row-editor';
import {
  DISTANCE_UNIT_OPTIONS,
  NEARBY_CATEGORY_OPTIONS,
  NEARBY_CATEGORY_TONE,
  TRANSPORT_TYPE_OPTIONS,
  optionLabel,
} from './labels';

interface NearbyRow extends RowWithId {
  name: string;
  category: NearbyCategory;
  distance: string;
  distanceUnit: DistanceUnit;
  transportType: TransportType | '';
  journeyMinutes: string;
}

const emptyRow = (id: string): NearbyRow => ({
  id,
  name: '',
  category: 'attraction',
  distance: '',
  distanceUnit: 'km',
  transportType: '',
  journeyMinutes: '',
});

function toNum(v: string): number | null {
  const t = v.trim();
  if (t === '') return null;
  const n = Number(t);
  return Number.isNaN(n) ? null : n;
}

/** Thông tin phụ của một địa điểm, chỉ gồm field đã nhập. */
function summaryBits(row: NearbyRow): string[] {
  const bits: string[] = [];
  const distance = row.distance.trim();
  if (distance) bits.push(`${distance} ${row.distanceUnit}`);
  if (row.transportType) bits.push(optionLabel(TRANSPORT_TYPE_OPTIONS, row.transportType));
  const minutes = row.journeyMinutes.trim();
  if (minutes) bits.push(`${minutes} min`);
  return bits;
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

  const seed: NearbyRow[] = (data ?? []).map(p => ({
    id: p.id,
    name: p.name,
    category: p.category,
    distance: p.distance ?? '',
    distanceUnit: p.distanceUnit,
    transportType: p.transportType ?? '',
    journeyMinutes: p.journeyMinutes != null ? String(p.journeyMinutes) : '',
  }));

  const { rows, add, update, remove, isNew, isEditing, startEdit, stopEdit } = useRowEditor(
    seed,
    emptyRow
  );

  const handleSave = async () => {
    // Bỏ qua dòng chưa nhập tên (BE bắt buộc name).
    const valid = rows.filter(r => r.name.trim() !== '');
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
      description={`${hotelName} · ${rows.length} place(s)`}
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
          {rows.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-400">
              No nearby places yet. Add one below.
            </p>
          )}
          {rows.map(row => (
            <EditableRow
              key={row.id}
              editing={isEditing(row.id)}
              entity="place"
              editingLabel={isNew(row.id) ? 'New place' : 'Editing place'}
              onEdit={() => startEdit(row.id)}
              onDone={() => stopEdit(row.id)}
              onRemove={() => remove(row.id)}
              summary={
                <RowSummary
                  badge={
                    <Pill tone={NEARBY_CATEGORY_TONE[row.category]}>
                      {optionLabel(NEARBY_CATEGORY_OPTIONS, row.category)}
                    </Pill>
                  }
                  meta={summaryBits(row)}
                  primary={row.name}
                  emptyPrimary="Unnamed place — won't be saved"
                />
              }
            >
              <TextField
                label="Name"
                value={row.name}
                onChange={v => update(row.id, { name: v })}
                placeholder="e.g. Ben Thanh Market"
              />
              <SelectField
                label="Category"
                value={row.category}
                onChange={v => update(row.id, { category: (v || 'attraction') as NearbyCategory })}
                options={NEARBY_CATEGORY_OPTIONS}
              />
              <TextField
                label="Distance"
                type="number"
                value={row.distance}
                onChange={v => update(row.id, { distance: v })}
                placeholder="e.g. 1.2"
              />
              <SelectField
                label="Distance unit"
                value={row.distanceUnit}
                onChange={v => update(row.id, { distanceUnit: (v || 'km') as DistanceUnit })}
                options={DISTANCE_UNIT_OPTIONS}
              />
              <SelectField
                label="Transport"
                value={row.transportType}
                onChange={v => update(row.id, { transportType: v as TransportType | '' })}
                options={TRANSPORT_TYPE_OPTIONS}
                emptyLabel="—"
              />
              <TextField
                label="Journey (minutes)"
                type="number"
                value={row.journeyMinutes}
                onChange={v => update(row.id, { journeyMinutes: v })}
                placeholder="e.g. 15"
              />
            </EditableRow>
          ))}
          <Button variant="outline" onClick={add} className="w-full">
            <Plus className="mr-1.5 h-4 w-4" /> Add place
          </Button>
        </div>
      )}
    </Modal>
  );
}
