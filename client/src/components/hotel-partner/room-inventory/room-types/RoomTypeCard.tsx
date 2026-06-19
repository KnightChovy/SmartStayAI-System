import {
  Pencil,
  ImageIcon,
  Sparkles,
  Users,
  Ruler,
  BedDouble,
  Eye,
  Hotel,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/formatCurrency';
import type { ManagedRoomType } from '@/types/hotel-management.types';

interface RoomTypeCardProps {
  roomType: ManagedRoomType;
  onEdit: (rt: ManagedRoomType) => void;
  onImages: (rt: ManagedRoomType) => void;
  onAmenities: (rt: ManagedRoomType) => void;
  onToggleActive: (rt: ManagedRoomType) => void;
  toggling?: boolean;
}

function MetaItem({
  icon: Icon,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-600">
      <Icon className="w-3.5 h-3.5 text-slate-400" />
      {value}
    </span>
  );
}

export function RoomTypeCard({
  roomType,
  onEdit,
  onImages,
  onAmenities,
  onToggleActive,
  toggling,
}: RoomTypeCardProps) {
  const cover = roomType.images.find(i => i.isPrimary)?.url ?? roomType.images[0]?.url ?? null;

  return (
    <div className="flex flex-col sm:flex-row gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* Cover */}
      <div className="relative w-full sm:w-40 h-32 sm:h-auto shrink-0 rounded-lg overflow-hidden bg-slate-100">
        {cover ? (
          <img src={cover} alt={roomType.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <Hotel className="w-8 h-8" />
          </div>
        )}
        <span className="absolute bottom-1.5 left-1.5 text-[10px] font-semibold bg-black/60 text-white px-1.5 py-0.5 rounded-full">
          {roomType.images.length} photos
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-slate-900 truncate">{roomType.name}</h3>
              <span
                className={cn(
                  'text-[11px] font-semibold px-2 py-0.5 rounded-full',
                  roomType.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                )}
              >
                {roomType.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-lg font-bold text-role-partner-primary mt-0.5">
              {formatCurrency(roomType.basePrice)}
              <span className="text-xs font-normal text-slate-400"> / night</span>
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1 shrink-0">
            {roomType._count.rooms} rooms
          </span>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2.5">
          <MetaItem icon={Users} value={`Up to ${roomType.maxOccupancy} guests`} />
          {roomType.areaSqm && <MetaItem icon={Ruler} value={`${Number(roomType.areaSqm)} m²`} />}
          {roomType.bedType && <MetaItem icon={BedDouble} value={roomType.bedType} />}
          {roomType.viewType && <MetaItem icon={Eye} value={roomType.viewType} />}
        </div>

        {/* Amenities */}
        {roomType.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {roomType.amenities.slice(0, 5).map(a => (
              <span
                key={a.amenityId}
                className="text-[11px] text-slate-600 bg-slate-50 border border-slate-100 rounded-full px-2 py-0.5"
              >
                {a.amenity.name}
              </span>
            ))}
            {roomType.amenities.length > 5 && (
              <span className="text-[11px] text-slate-400 px-1">
                +{roomType.amenities.length - 5}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mt-3.5">
          <Button size="sm" variant="outline" onClick={() => onEdit(roomType)}>
            <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
          </Button>
          <Button size="sm" variant="outline" onClick={() => onImages(roomType)}>
            <ImageIcon className="w-3.5 h-3.5 mr-1" /> Photos
          </Button>
          <Button size="sm" variant="outline" onClick={() => onAmenities(roomType)}>
            <Sparkles className="w-3.5 h-3.5 mr-1" /> Amenities
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onToggleActive(roomType)}
            disabled={toggling}
            className="text-slate-500"
          >
            {toggling && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
            {roomType.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      </div>
    </div>
  );
}
