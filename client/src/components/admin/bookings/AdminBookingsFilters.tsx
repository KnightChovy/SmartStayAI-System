import { Input } from '@/components/ui/input';
import type { AdminBookingsFiltersProps } from '@/types/admin.types';

export function AdminBookingsFilters({
  searchPlaceholder,
}: AdminBookingsFiltersProps) {
  return (
    <div className="rounded-[28px] border bg-white p-4">
      <Input className="h-12 rounded-full" placeholder={searchPlaceholder} />
    </div>
  );
}
