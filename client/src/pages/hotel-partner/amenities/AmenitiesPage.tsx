import { useMemo, useState } from 'react';
import { Plus, Sparkles, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';
import {
  ErrorState,
  EmptyState,
} from '@/components/hotel-partner/shared/states';
import { TableSkeleton } from '@/components/shared/skeletons';
import { DataTable, type Column } from '@/components/hotel-partner/shared/DataTable';
import { Pill } from '@/components/hotel-partner/shared/Pill';
import { AmenityFormModal } from '@/components/hotel-partner/hotel-management/AmenityFormModal';
import { useAmenities } from '@/hooks/hotel-management';
import type { Amenity } from '@/types/hotel.types';

type CategoryFilter = 'all' | Amenity['category'];

const CATEGORY_TABS: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'room', label: 'Room' },
  { value: 'service', label: 'Service' },
];

const CATEGORY_CLASS: Record<Amenity['category'], string> = {
  hotel: 'bg-indigo-50 text-indigo-700',
  room: 'bg-emerald-50 text-emerald-700',
  service: 'bg-amber-50 text-amber-700',
};

/**
 * Quản lý danh mục tiện nghi dùng chung (`/partner/amenities`).
 * BE hiện chỉ hỗ trợ liệt kê + tạo mới (`GET`/`POST /amenities`) nên trang này
 * gồm danh sách + tạo mới; chưa có sửa/xoá cho tới khi có endpoint tương ứng.
 */
export default function AmenitiesPage() {
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const { data: amenities, isLoading, isError } = useAmenities(
    category === 'all' ? undefined : category
  );

  const q = search.trim().toLowerCase();
  const visible = useMemo(
    () => (q ? (amenities ?? []).filter(a => a.name.toLowerCase().includes(q)) : amenities ?? []),
    [amenities, q]
  );

  const columns: Column<Amenity>[] = [
    {
      id: 'name',
      header: 'Amenity',
      cell: a => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-role-partner-light">
            <Sparkles className="h-4 w-4 text-role-partner-primary" />
          </div>
          <span className="font-semibold text-slate-900">{a.name}</span>
        </div>
      ),
    },
    {
      id: 'category',
      header: 'Category',
      cell: a => <Pill className={cn('capitalize', CATEGORY_CLASS[a.category])}>{a.category}</Pill>,
    },
    {
      id: 'icon',
      header: 'Icon key',
      className: 'hidden sm:table-cell',
      cell: a => <span className="text-slate-500">{a.icon || '—'}</span>,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1400px] rounded-xl border border-slate-200 bg-white p-6">
      {/* Header */}
      <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Amenities</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Shared amenity catalog used across your hotels and room types.
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="shrink-0 bg-role-partner-primary text-white hover:bg-role-partner-secondary"
        >
          <Plus className="mr-1.5 h-4 w-4" /> New amenity
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_TABS.map(tab => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setCategory(tab.value)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
                category === tab.value
                  ? 'border-role-partner-primary bg-role-partner-light text-role-partner-primary'
                  : 'border-slate-200 text-slate-500 hover:bg-slate-50'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search amenities..."
            className="h-9 pl-8"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton columns={3} />
      ) : isError ? (
        <ErrorState label="Failed to load the amenity catalog." />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title={q || category !== 'all' ? 'No matching amenities' : 'No amenities yet'}
          description={
            q || category !== 'all'
              ? 'Try a different category or search term.'
              : 'Create your first amenity to start building the catalog.'
          }
        />
      ) : (
        <DataTable columns={columns} rows={visible} rowKey={a => a.id} minWidthClass="min-w-[420px]" />
      )}

      <AmenityFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        defaultCategory={category === 'all' ? 'hotel' : category}
      />
    </div>
  );
}
