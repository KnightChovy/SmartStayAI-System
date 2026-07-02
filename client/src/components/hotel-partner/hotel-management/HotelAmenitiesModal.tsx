import { useMemo, useState } from 'react';
import { Loader2, Check, Sparkles, Search, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/hotel-partner/shared/Modal';
import { ErrorState } from '@/components/hotel-partner/shared/states';
import { ListSkeleton } from '@/components/shared/skeletons';
import { useAmenities } from '@/hooks/hotel-management';
import { useHotelAmenities, useSetHotelAmenities } from '@/hooks/hotels';
import { errorMessage } from '@/utils/errorMessage';
import type { Amenity } from '@/types/hotel.types';
import type { ManagedHotel } from '@/types/hotel-management.types';
import { AmenityFormModal } from './AmenityFormModal';

interface HotelAmenitiesModalProps {
  open: boolean;
  onClose: () => void;
  hotel: ManagedHotel;
}

/** Lựa chọn hiện tại: amenityId -> { isFree }. */
type Selection = Map<string, { isFree: boolean }>;

export function HotelAmenitiesModal({ open, onClose, hotel }: HotelAmenitiesModalProps) {
  const hotelId = hotel.id;
  const hotelName = hotel.name;
  const { data: catalog, isLoading, isError } = useAmenities();
  const { data: current } = useHotelAmenities(hotelId);
  const setAmenities = useSetHotelAmenities(hotelId);

  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  // Khởi tạo lựa chọn từ tiện nghi hiện có của khách sạn (kèm isFree).
  const initial = useMemo<Selection>(() => {
    const map: Selection = new Map();
    (current ?? []).forEach(a => map.set(a.amenityId, { isFree: a.isFree }));
    return map;
  }, [current]);

  const [selected, setSelected] = useState<Selection | null>(null);
  // Đồng bộ khi dữ liệu hiện có tải xong (chỉ set lần đầu, tránh đè thao tác của user).
  const selection = selected ?? initial;

  const setSelection = (updater: (prev: Selection) => Selection) => {
    setSelected(prev => updater(prev ?? initial));
  };

  const toggle = (id: string) => {
    setSelection(prev => {
      const next = new Map(prev);
      if (next.has(id)) next.delete(id);
      else next.set(id, { isFree: true });
      return next;
    });
  };

  const setFree = (id: string, isFree: boolean) => {
    setSelection(prev => {
      const next = new Map(prev);
      if (next.has(id)) next.set(id, { isFree });
      return next;
    });
  };

  const handleSubmit = async () => {
    try {
      await setAmenities.mutateAsync({
        amenities: Array.from(selection.entries()).map(([amenityId, v]) => ({
          amenityId,
          isFree: v.isFree,
        })),
      });
      toast.success('Amenities updated');
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to update amenities'));
    }
  };

  const filtered = (catalog ?? []).filter(a =>
    a.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  const onCreated = (amenity: Amenity) => {
    // Tự chọn tiện nghi vừa tạo (mặc định miễn phí).
    setSelection(prev => new Map(prev).set(amenity.id, { isFree: true }));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Hotel amenities"
      description={`${hotelName} · ${selection.size} selected`}
      icon={Sparkles}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={setAmenities.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={setAmenities.isPending}
            className="bg-role-partner-primary hover:bg-role-partner-secondary text-white"
          >
            {setAmenities.isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
            Save amenities
          </Button>
        </>
      }
    >
      {isLoading ? (
        <ListSkeleton rows={6} />
      ) : isError ? (
        <ErrorState label="Failed to load the amenity catalog." />
      ) : (
        <div className="space-y-4">
          {/* Search + New amenity */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search amenities..."
                className="pl-8 h-9"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(true)}
              className="h-9 shrink-0"
            >
              <Plus className="w-4 h-4 mr-1.5" /> New amenity
            </Button>
          </div>

          {filtered.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-400 italic">No matching amenities.</p>
              <Button variant="outline" className="mt-3" onClick={() => setCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-1.5" /> Create "{search.trim() || 'new amenity'}"
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[48vh] overflow-y-auto pr-1">
              {filtered.map(a => {
                const picked = selection.get(a.id);
                const active = !!picked;
                return (
                  <div
                    key={a.id}
                    className={cn(
                      'rounded-lg border transition-colors',
                      active
                        ? 'border-role-partner-primary bg-role-partner-light'
                        : 'border-slate-200 hover:bg-slate-50'
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => toggle(a.id)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm"
                    >
                      <span
                        className={cn(
                          'truncate',
                          active ? 'font-medium text-role-partner-primary' : 'text-slate-600'
                        )}
                      >
                        {a.name}
                      </span>
                      {active ? (
                        <Check className="w-4 h-4 shrink-0 text-role-partner-primary" />
                      ) : (
                        <span className="text-[10px] uppercase tracking-wide text-slate-300">
                          {a.category}
                        </span>
                      )}
                    </button>

                    {/* Free / Paid — chỉ hiện khi đã chọn */}
                    {active && (
                      <div className="flex items-center gap-1.5 border-t border-role-partner-primary/15 px-3 py-1.5">
                        <PriceChip
                          label="Free"
                          active={picked.isFree}
                          onClick={() => setFree(a.id, true)}
                        />
                        <PriceChip
                          label="Paid"
                          active={!picked.isFree}
                          onClick={() => setFree(a.id, false)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {selection.size > 0 && (
            <button
              type="button"
              onClick={() => setSelection(() => new Map())}
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-red-500"
            >
              <X className="w-3.5 h-3.5" /> Clear all
            </button>
          )}
        </div>
      )}

      <AmenityFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        defaultCategory="hotel"
        onCreated={onCreated}
      />
    </Modal>
  );
}

function PriceChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
        active ? 'bg-role-partner-primary text-white' : 'bg-white text-slate-500 hover:bg-slate-100'
      )}
    >
      {label}
    </button>
  );
}
