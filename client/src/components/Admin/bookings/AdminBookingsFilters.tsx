import { Input } from '@/components/ui/input';

interface AdminBookingsFiltersProps {
  searchPlaceholder: string;
}

export function AdminBookingsFilters({
  searchPlaceholder,
}: AdminBookingsFiltersProps) {
  return (
    <div className="rounded-[28px] border bg-white p-4">
      <Input className="h-12 rounded-full" placeholder={searchPlaceholder} />
    </div>
  );
}
