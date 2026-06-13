import { Check } from 'lucide-react';
import type { Amenity } from '@/types/hotel.types';
import { cn } from '@/lib/cn';

/** Danh sách tiện nghi dạng lưới có icon tick. */
export default function AmenityList({
  amenities,
  className,
}: {
  amenities: Amenity[];
  className?: string;
}) {
  if (!amenities.length) return null;
  return (
    <ul className={cn('grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3', className)}>
      {amenities.map(a => (
        <li key={a.id} className="flex items-center gap-2 text-sm text-on-surface-variant">
          <Check className="size-4 shrink-0 text-primary" />
          <span>{a.name}</span>
        </li>
      ))}
    </ul>
  );
}
