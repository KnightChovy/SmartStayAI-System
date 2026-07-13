import { useState } from 'react';
import { Plus, BedDouble, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import AppFilter from '@/common/filter/AppFilter';
import AppPagination from '@/common/pagination/AppPagination';
import { ErrorState, EmptyState } from '@/components/hotel-partner/shared/states';
import { TableSkeleton } from '@/components/shared/skeletons';
import { DataTable, type Column } from '@/components/hotel-partner/shared/DataTable';
import { ActionMenu } from '@/components/hotel-partner/shared/ActionMenu';
import { ConfirmDialog } from '@/components/hotel-partner/shared/ConfirmDialog';
import { Pill } from '@/components/hotel-partner/shared/Pill';
import { ROOM_STATUS_CONFIG, ROOM_STATUS_OPTIONS } from '@/components/hotel-partner/shared/labels';
import { useRooms, useRoomTypes, useDeleteRoom } from '@/hooks/hotel-management';
import { errorMessage } from '@/utils/errorMessage';
import type { PhysicalRoom, RoomStatus, RoomListParams } from '@/types/hotel-management.types';
import { RoomFormModal } from './RoomFormModal';

interface RoomsTabProps {
  hotelId: string;
}

const PAGE_SIZE = 20;
const ALL = 'all';
const DEFAULT_SORT = 'roomNumber:asc';

/** Sắp xếp server-side theo số phòng hoặc tầng (BE nhận "field:asc|desc"). */
const SORT_OPTIONS = [
  { label: 'Room number (A–Z)', value: 'roomNumber:asc' },
  { label: 'Room number (Z–A)', value: 'roomNumber:desc' },
  { label: 'Floor (low → high)', value: 'floor:asc' },
  { label: 'Floor (high → low)', value: 'floor:desc' },
];

export function RoomsTab({ hotelId }: RoomsTabProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RoomStatus | typeof ALL>(ALL);
  const [roomTypeFilter, setRoomTypeFilter] = useState<string>(ALL);
  const [sortBy, setSortBy] = useState<string>(DEFAULT_SORT);
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PhysicalRoom | null>(null);
  const [deleting, setDeleting] = useState<PhysicalRoom | null>(null);

  const { data: roomTypes } = useRoomTypes(hotelId);
  const deleteRoom = useDeleteRoom(hotelId);

  const params: RoomListParams = {
    page,
    limit: PAGE_SIZE,
    status: statusFilter === ALL ? undefined : statusFilter,
    roomTypeId: roomTypeFilter === ALL ? undefined : roomTypeFilter,
    sortBy,
  };
  const { data, isLoading, isError } = useRooms(hotelId, params);

  const rooms = data?.results ?? [];
  const totalPages = data?.totalPages ?? 1;
  const hasRoomTypes = (roomTypes?.length ?? 0) > 0;

  // Tìm theo số phòng được áp client-side trên trang hiện tại (BE chưa hỗ trợ search).
  const q = search.trim().toLowerCase();
  const visibleRooms = q ? rooms.filter(r => r.roomNumber.toLowerCase().includes(q)) : rooms;
  const hasServerFilter = statusFilter !== ALL || roomTypeFilter !== ALL;

  const resetPageThen = (fn: () => void) => {
    setPage(1);
    fn();
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter(ALL);
    setRoomTypeFilter(ALL);
    setSortBy(DEFAULT_SORT);
    setPage(1);
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteRoom.mutateAsync(deleting.id);
      toast.success('Room deleted');
      setDeleting(null);
    } catch (err) {
      // BE trả 400 khi phòng đã từng được đặt — hiển thị đúng lý do
      toast.error(errorMessage(err, 'Failed to delete room'));
    }
  };

  const statusOptions = [
    { label: 'All statuses', value: ALL },
    ...ROOM_STATUS_OPTIONS.map(o => ({ label: o.label, value: o.value })),
  ];
  const roomTypeOptions = [
    { label: 'All room types', value: ALL },
    ...(roomTypes ?? []).map(rt => ({ label: rt.name, value: rt.id })),
  ];

  const columns: Column<PhysicalRoom>[] = [
    {
      id: 'roomNumber',
      header: 'Room number',
      cell: room => <span className="font-semibold text-slate-900">{room.roomNumber}</span>,
    },
    { id: 'roomType', header: 'Room type', cell: room => <span className="text-slate-600">{room.roomType.name}</span> },
    {
      id: 'floor',
      header: 'Floor',
      align: 'center',
      className: 'hidden sm:table-cell',
      cell: room => <span className="text-slate-600">{room.floor ?? '—'}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      cell: room => {
        const cfg = ROOM_STATUS_CONFIG[room.status];
        return <Pill className={cfg.class}>{cfg.label}</Pill>;
      },
    },
    {
      id: 'notes',
      header: 'Notes',
      className: 'hidden md:table-cell max-w-[200px]',
      cell: room => <span className="block truncate text-slate-500">{room.notes || '—'}</span>,
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      cell: room => (
        <ActionMenu
          items={[
            { label: 'Edit', icon: Pencil, onClick: () => { setEditing(room); setFormOpen(true); } },
            { label: 'Delete', icon: Trash2, onClick: () => setDeleting(room), destructive: true },
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Rooms</h2>
          <p className="text-sm text-slate-500">
            {data ? `${data.totalResults} rooms` : 'Manage individual rooms and their status.'}
          </p>
        </div>
        <Button
          onClick={openCreate}
          disabled={!hasRoomTypes}
          title={hasRoomTypes ? undefined : 'Create a room type first'}
          className="bg-role-partner-primary text-white hover:bg-role-partner-secondary"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Add room
        </Button>
      </div>

      <div className="mb-4">
        <AppFilter
          search={search}
          onSearchChange={setSearch}
          status={statusFilter}
          onStatusChange={v => resetPageThen(() => setStatusFilter(v as RoomStatus | typeof ALL))}
          statusOptions={statusOptions}
          category={roomTypeFilter}
          onCategoryChange={v => resetPageThen(() => setRoomTypeFilter(v))}
          categoryOptions={roomTypeOptions}
          sort={sortBy}
          onSortChange={v => resetPageThen(() => setSortBy(v))}
          sortOptions={SORT_OPTIONS}
          onReset={resetFilters}
        />
      </div>

      {isLoading ? (
        <TableSkeleton columns={5} />
      ) : isError ? (
        <ErrorState label="Failed to load the room list." />
      ) : rooms.length === 0 ? (
        <EmptyState
          icon={BedDouble}
          title={hasServerFilter ? 'No rooms match your filters' : 'No rooms yet'}
          description={
            hasServerFilter
              ? 'Try adjusting the status or room type filter.'
              : hasRoomTypes
                ? 'Add physical rooms for your room types.'
                : 'Create at least one room type before adding rooms.'
          }
        />
      ) : visibleRooms.length === 0 ? (
        <EmptyState
          icon={BedDouble}
          title="No rooms match your search"
          description={`No room number on this page matches "${search}".`}
        />
      ) : (
        <>
          <DataTable columns={columns} rows={visibleRooms} rowKey={room => room.id} />
          <div className="mt-4">
            <AppPagination currentPage={data?.page ?? page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </>
      )}

      <RoomFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        hotelId={hotelId}
        roomTypes={roomTypes ?? []}
        room={editing}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete room"
        message={`Delete room "${deleting?.roomNumber}"? This only works if the room has never been booked — otherwise set it to maintenance instead. This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        loading={deleteRoom.isPending}
      />
    </div>
  );
}
