import { useState } from 'react';
import { Plus, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { LoadingState, ErrorState, EmptyState } from '@/components/hotel-partner/shared/states';
import { useRoomTypes, useUpdateRoomType } from '@/hooks/hotel-management';
import type { ManagedRoomType } from '@/types/hotel-management.types';
import { RoomTypeCard } from './RoomTypeCard';
import { RoomTypeFormModal } from './RoomTypeFormModal';
import { RoomTypeImagesModal } from './RoomTypeImagesModal';
import { RoomTypeAmenitiesModal } from './RoomTypeAmenitiesModal';

interface RoomTypesTabProps {
  hotelId: string;
}

export function RoomTypesTab({ hotelId }: RoomTypesTabProps) {
  const { data: roomTypes, isLoading, isError } = useRoomTypes(hotelId);
  const updateRoomType = useUpdateRoomType(hotelId);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ManagedRoomType | null>(null);
  const [imagesTarget, setImagesTarget] = useState<ManagedRoomType | null>(null);
  const [amenitiesTarget, setAmenitiesTarget] = useState<ManagedRoomType | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (rt: ManagedRoomType) => {
    setEditing(rt);
    setFormOpen(true);
  };

  const toggleActive = async (rt: ManagedRoomType) => {
    setTogglingId(rt.id);
    try {
      await updateRoomType.mutateAsync({ roomTypeId: rt.id, dto: { isActive: !rt.isActive } });
      toast.success(rt.isActive ? 'Room type deactivated' : 'Room type activated');
    } catch {
      toast.error('Failed to update status');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Room Types</h2>
          <p className="text-sm text-slate-500">Manage room types, base prices, photos and amenities.</p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-role-partner-primary hover:bg-role-partner-secondary text-white"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add room type
        </Button>
      </div>

      {isLoading ? (
        <LoadingState label="Loading room types..." />
      ) : isError ? (
        <ErrorState label="Failed to load room types." />
      ) : !roomTypes || roomTypes.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No room types yet"
          description="Add your first room type to start configuring your inventory."
          action={
            <Button
              onClick={openCreate}
              className="bg-role-partner-primary hover:bg-role-partner-secondary text-white"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Add room type
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {roomTypes.map(rt => (
            <RoomTypeCard
              key={rt.id}
              roomType={rt}
              onEdit={openEdit}
              onImages={setImagesTarget}
              onAmenities={setAmenitiesTarget}
              onToggleActive={toggleActive}
              toggling={togglingId === rt.id}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <RoomTypeFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        hotelId={hotelId}
        roomType={editing}
      />
      {imagesTarget && (
        <RoomTypeImagesModal
          open={!!imagesTarget}
          onClose={() => setImagesTarget(null)}
          hotelId={hotelId}
          roomType={imagesTarget}
        />
      )}
      {amenitiesTarget && (
        <RoomTypeAmenitiesModal
          open={!!amenitiesTarget}
          onClose={() => setAmenitiesTarget(null)}
          hotelId={hotelId}
          roomType={amenitiesTarget}
        />
      )}
    </div>
  );
}
