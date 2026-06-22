import { ChevronDown, Hotel, Check, MapPin } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/cn';
import type { PartnerHotel } from '@/types/hotel.types';

interface HotelSwitcherProps {
  hotels: PartnerHotel[];
  current: PartnerHotel;
  onSelect: (hotel: PartnerHotel) => void;
}

/** Dropdown to quickly switch the hotel being managed in Room Inventory. */
export function HotelSwitcher({ hotels, current, onSelect }: HotelSwitcherProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-left hover:bg-slate-50 transition-colors">
          <div className="w-9 h-9 rounded-lg bg-role-partner-light flex items-center justify-center shrink-0">
            <Hotel className="w-5 h-5 text-role-partner-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 leading-tight truncate max-w-[200px]">
              {current.name}
            </p>
            <p className="text-xs text-slate-400 truncate max-w-[200px]">
              {[current.district, current.city].filter(Boolean).join(', ') || 'Hotel'}
            </p>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        {hotels.map(hotel => {
          const active = hotel.id === current.id;
          return (
            <DropdownMenuItem
              key={hotel.id}
              onSelect={() => onSelect(hotel)}
              className={cn('gap-2.5 py-2', active && 'bg-role-partner-light')}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800 truncate">{hotel.name}</p>
                <p className="flex items-center gap-1 text-xs text-slate-400 truncate">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {[hotel.district, hotel.city].filter(Boolean).join(', ') || '—'}
                </p>
              </div>
              {active && <Check className="w-4 h-4 text-role-partner-primary shrink-0" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
