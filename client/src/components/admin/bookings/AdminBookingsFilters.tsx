import { Input } from '@/components/ui/input';
import type { AdminBookingsFiltersProps } from '@/types/admin.types';

export function AdminBookingsFilters({
  searchPlaceholder,
}: AdminBookingsFiltersProps) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <Input className="h-9" placeholder={searchPlaceholder} />
    </div>
  );
}
