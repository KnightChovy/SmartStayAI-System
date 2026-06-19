import { Hotel, MapPin, Star, BedDouble, Layers, ArrowRight, CheckCircle2, EyeOff } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import type { PartnerHotel } from '@/types/hotel.types';

interface PartnerHotelCardProps {
  hotel: PartnerHotel;
  /** Primary action (e.g. "Manage Rooms & Pricing"). */
  onManage?: (hotel: PartnerHotel) => void;
  actionLabel?: string;
  /** Highlight border when this card is the selected one. */
  selected?: boolean;
  className?: string;
}

function StatusPill({ ok, labelOn, labelOff, IconOn, IconOff }: {
  ok: boolean;
  labelOn: string;
  labelOff: string;
  IconOn: React.ComponentType<{ className?: string }>;
  IconOff: React.ComponentType<{ className?: string }>;
}) {
  const Icon = ok ? IconOn : IconOff;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full',
        ok ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
      )}
    >
      <Icon className="w-3 h-3" />
      {ok ? labelOn : labelOff}
    </span>
  );
}

export function PartnerHotelCard({
  hotel,
  onManage,
  actionLabel = 'Manage Rooms & Pricing',
  selected = false,
  className,
}: PartnerHotelCardProps) {
  const cover = hotel.images[0]?.url ?? null;
  const location = [hotel.district, hotel.city].filter(Boolean).join(', ');

  return (
    <div
      className={cn(
        'group flex flex-col rounded-xl border bg-white shadow-sm overflow-hidden transition-all',
        selected
          ? 'border-role-partner-primary ring-2 ring-role-partner-primary/30'
          : 'border-slate-200 hover:shadow-md',
        className
      )}
    >
      {/* Cover */}
      <div className="relative h-40 bg-slate-100 shrink-0">
        {cover ? (
          <img
            src={cover}
            alt={hotel.name}
            className="w-full h-full object-cover"
            onError={e => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <Hotel className="w-10 h-10" />
          </div>
        )}
        <div className="absolute top-2.5 right-2.5 flex gap-1.5">
          <StatusPill ok={hotel.isListed} labelOn="Listed" labelOff="Unlisted" IconOn={CheckCircle2} IconOff={EyeOff} />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-slate-900 leading-tight line-clamp-1">{hotel.name}</h3>
          {hotel.starRating != null && (
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-amber-600 shrink-0">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              {hotel.starRating}
            </span>
          )}
        </div>

        {location && (
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 line-clamp-1">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            {location}
          </p>
        )}

        {/* Counts */}
        <div className="mt-3 flex gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1">
            <Layers className="w-3.5 h-3.5 text-role-partner-primary" />
            {hotel._count.roomTypes} room types
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1">
            <BedDouble className="w-3.5 h-3.5 text-role-partner-primary" />
            {hotel._count.rooms} rooms
          </span>
        </div>

        {onManage && (
          <Button
            onClick={() => onManage(hotel)}
            className="mt-4 w-full bg-role-partner-primary hover:bg-role-partner-secondary text-white"
          >
            {actionLabel}
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
