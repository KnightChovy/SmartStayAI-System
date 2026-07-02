import { useState } from 'react';
import { Loader2, Check, Sparkles, Search } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/hotel-partner/shared/Modal';
import { ErrorState } from '@/components/hotel-partner/shared/states';
import { ListSkeleton } from '@/components/shared/skeletons';
import { useAmenities, useReplaceAmenities } from '@/hooks/hotel-management';
import type { ManagedRoomType } from '@/types/hotel-management.types';

interface RoomTypeAmenitiesModalProps {
  open: boolean;
  onClose: () => void;
  hotelId: string;
  roomType: ManagedRoomType;
}

export function RoomTypeAmenitiesModal({
  open,
  onClose,
  hotelId,
  roomType,
}: RoomTypeAmenitiesModalProps) {
  const { data: amenities, isLoading, isError } = useAmenities();
  const replaceAmenities = useReplaceAmenities(hotelId);
  const [search, setSearch] = useState('');

  // Initial selection = amenities currently assigned to this room type.
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(roomType.amenities.map(a => a.amenityId))
  );

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    try {
      await replaceAmenities.mutateAsync({
        roomTypeId: roomType.id,
        dto: { amenities: Array.from(selected).map(amenityId => ({ amenityId })) },
      });
      toast.success('Amenities updated');
      onClose();
    } catch {
      toast.error('Failed to update amenities');
    }
  };

  const filtered = (amenities ?? []).filter(a =>
    a.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Room type amenities"
      description={`${roomType.name} · ${selected.size} selected`}
      icon={Sparkles}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={replaceAmenities.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={replaceAmenities.isPending}
            className="bg-role-partner-primary hover:bg-role-partner-secondary text-white"
          >
            {replaceAmenities.isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
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
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search amenities..."
              className="pl-8 h-9"
            />
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-slate-400 italic py-6 text-center">No matching amenities.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[45vh] overflow-y-auto pr-1">
              {filtered.map(a => {
                const active = selected.has(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggle(a.id)}
                    className={cn(
                      'flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm text-left transition-colors',
                      active
                        ? 'border-role-partner-primary bg-role-partner-light text-role-partner-primary font-medium'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    <span className="truncate">{a.name}</span>
                    {active && <Check className="w-4 h-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
