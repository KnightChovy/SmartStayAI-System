import { useState } from 'react';
import { Plus, BedDouble, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingState, ErrorState, EmptyState } from '@/components/hotel-partner/shared/states';
import { ROOM_STATUS_CONFIG, ROOM_STATUS_OPTIONS } from '@/components/hotel-partner/shared/labels';
import { useRooms, useRoomTypes } from '@/hooks/hotel-management';
import type { PhysicalRoom, RoomStatus, RoomListParams } from '@/types/hotel-management.types';
import { RoomFormModal } from './RoomFormModal';

interface RoomsTabProps {
  hotelId: string;
}

const PAGE_SIZE = 20;
const ALL = 'all';

export function RoomsTab({ hotelId }: RoomsTabProps) {
  const [statusFilter, setStatusFilter] = useState<RoomStatus | typeof ALL>(ALL);
  const [roomTypeFilter, setRoomTypeFilter] = useState<string>(ALL);
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PhysicalRoom | null>(null);

  const { data: roomTypes } = useRoomTypes(hotelId);

  const params: RoomListParams = {
    page,
    limit: PAGE_SIZE,
    status: statusFilter === ALL ? undefined : statusFilter,
    roomTypeId: roomTypeFilter === ALL ? undefined : roomTypeFilter,
  };
  const { data, isLoading, isError } = useRooms(hotelId, params);

  const rooms = data?.results ?? [];
  const totalPages = data?.totalPages ?? 1;
  const hasRoomTypes = (roomTypes?.length ?? 0) > 0;

  const resetPageThen = (fn: () => void) => {
    setPage(1);
    fn();
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
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
          className="bg-role-partner-primary hover:bg-role-partner-secondary text-white"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add room
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Select
          value={statusFilter}
          onValueChange={v => resetPageThen(() => setStatusFilter(v as RoomStatus | typeof ALL))}
        >
          <SelectTrigger className="w-44 h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {ROOM_STATUS_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={roomTypeFilter} onValueChange={v => resetPageThen(() => setRoomTypeFilter(v))}>
          <SelectTrigger className="w-56 h-9">
            <SelectValue placeholder="Room type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All room types</SelectItem>
            {(roomTypes ?? []).map(rt => (
              <SelectItem key={rt.id} value={rt.id}>
                {rt.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingState label="Loading rooms..." />
      ) : isError ? (
        <ErrorState label="Failed to load the room list." />
      ) : rooms.length === 0 ? (
        <EmptyState
          icon={BedDouble}
          title="No rooms yet"
          description={
            hasRoomTypes
              ? 'Add physical rooms for your room types.'
              : 'Create at least one room type before adding rooms.'
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-3">Room number</th>
                  <th className="px-4 py-3">Room type</th>
                  <th className="px-4 py-3">Floor</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rooms.map(room => {
                  const cfg = ROOM_STATUS_CONFIG[room.status];
                  return (
                    <tr key={room.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-semibold text-slate-900">{room.roomNumber}</td>
                      <td className="px-4 py-3 text-slate-600">{room.roomType.name}</td>
                      <td className="px-4 py-3 text-slate-600">{room.floor ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'text-[11px] font-semibold px-2 py-0.5 rounded-full',
                            cfg.class
                          )}
                        >
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">
                        {room.notes || '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditing(room);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-slate-400">
                Page {data?.page ?? page} / {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <RoomFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        hotelId={hotelId}
        roomTypes={roomTypes ?? []}
        room={editing}
      />
    </div>
  );
}
