import { useState } from 'react';
import { Plus, Layers, Pencil, ImageIcon, Tags, Power, PowerOff, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { LoadingState, ErrorState, EmptyState } from '@/components/hotel-partner/shared/states';
import { DataTable, type Column } from '@/components/hotel-partner/shared/DataTable';
import { ActionMenu } from '@/components/hotel-partner/shared/ActionMenu';
import { Pill } from '@/components/hotel-partner/shared/Pill';
import { useRoomTypes, useUpdateRoomType } from '@/hooks/hotel-management';
import { formatCurrency } from '@/utils/formatCurrency';
import type { ManagedRoomType } from '@/types/hotel-management.types';
import { RoomTypeFormModal } from './RoomTypeFormModal';
import { RoomTypeImagesModal } from './RoomTypeImagesModal';
import { RoomTypeAmenitiesModal } from './RoomTypeAmenitiesModal';

interface RoomTypesTabProps {
  hotelId: string;
}

function NameCell({ roomType }: { roomType: ManagedRoomType }) {
  const cover = roomType.images.find(img => img.isPrimary)?.url ?? roomType.images[0]?.url ?? null;
  return (
    <div className="flex items-center gap-3">
      <div className="h-11 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
        {cover ? (
          <img
            src={cover}
            alt={roomType.name}
            className="h-full w-full object-cover"
            onError={e => {
              (e.target as HTMLImageElement).style.visibility = 'hidden';
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300">
            <Layers className="h-5 w-5" />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate font-semibold text-slate-900">{roomType.name}</p>
        {roomType.bedType && <p className="truncate text-xs text-slate-400">{roomType.bedType}</p>}
      </div>
    </div>
  );
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

  const columns: Column<ManagedRoomType>[] = [
    { id: 'name', header: 'Room type', cell: rt => <NameCell roomType={rt} /> },
    {
      id: 'occupancy',
      header: 'Max guests',
      align: 'center',
      className: 'hidden sm:table-cell',
      cell: rt => (
        <span className="inline-flex items-center gap-1.5 text-slate-600">
          <Users className="h-3.5 w-3.5 text-slate-400" />
          {rt.maxOccupancy}
        </span>
      ),
    },
    {
      id: 'price',
      header: 'Base price',
      cell: rt => <span className="font-semibold text-slate-900">{formatCurrency(rt.basePrice)}</span>,
    },
    {
      id: 'rooms',
      header: 'Rooms',
      align: 'center',
      className: 'hidden md:table-cell',
      cell: rt => <span className="text-slate-600">{rt._count.rooms}</span>,
    },
    {
      id: 'amenities',
      header: 'Amenities',
      align: 'center',
      className: 'hidden lg:table-cell',
      cell: rt => <span className="text-slate-600">{rt.amenities.length}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      cell: rt => (
        <Pill tone={rt.isActive ? 'emerald' : 'slate'}>{rt.isActive ? 'Active' : 'Inactive'}</Pill>
      ),
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      cell: rt => (
        <ActionMenu
          items={[
            { label: 'Edit', icon: Pencil, onClick: () => { setEditing(rt); setFormOpen(true); } },
            { label: 'Manage images', icon: ImageIcon, onClick: () => setImagesTarget(rt) },
            { label: 'Manage amenities', icon: Tags, onClick: () => setAmenitiesTarget(rt) },
            {
              label: rt.isActive ? 'Deactivate' : 'Activate',
              icon: rt.isActive ? PowerOff : Power,
              onClick: () => toggleActive(rt),
              disabled: togglingId === rt.id,
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Room Types</h2>
          <p className="text-sm text-slate-500">Manage room types, base prices, photos and amenities.</p>
        </div>
        <Button onClick={openCreate} className="bg-role-partner-primary text-white hover:bg-role-partner-secondary">
          <Plus className="mr-1.5 h-4 w-4" /> Add room type
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
            <Button onClick={openCreate} className="bg-role-partner-primary text-white hover:bg-role-partner-secondary">
              <Plus className="mr-1.5 h-4 w-4" /> Add room type
            </Button>
          }
        />
      ) : (
        <DataTable columns={columns} rows={roomTypes} rowKey={rt => rt.id} minWidthClass="min-w-[640px]" />
      )}

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
