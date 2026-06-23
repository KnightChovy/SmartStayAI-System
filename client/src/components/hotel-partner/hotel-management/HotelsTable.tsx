import { Hotel, MapPin, Star, Layers, BedDouble, ArrowRight, CheckCircle2, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/hotel-partner/shared/DataTable';
import { Pill } from '@/components/hotel-partner/shared/Pill';
import { PublishToggle } from './PublishToggle';
import type { PartnerHotel } from '@/types/hotel.types';

interface HotelsTableProps {
  hotels: PartnerHotel[];
  onManage: (hotel: PartnerHotel) => void;
  actionLabel?: string;
  /** Hiện công tắc mở bán ở cột Status (chỉ dùng ở trang Hotels, không dùng ở picker). */
  showPublishToggle?: boolean;
}

function HotelNameCell({ hotel }: { hotel: PartnerHotel }) {
  const cover = hotel.images[0]?.url ?? null;
  return (
    <div className="flex items-center gap-3">
      <div className="h-11 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
        {cover ? (
          <img
            src={cover}
            alt={hotel.name}
            className="h-full w-full object-cover"
            onError={e => {
              (e.target as HTMLImageElement).style.visibility = 'hidden';
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300">
            <Hotel className="h-5 w-5" />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate font-semibold text-slate-900">{hotel.name}</p>
        <p className="truncate text-xs text-slate-400">{hotel.address}</p>
      </div>
    </div>
  );
}

/** Bảng tổng quan các khách sạn của partner — dùng ở Hotels page và picker của Room Inventory. */
export function HotelsTable({
  hotels,
  onManage,
  actionLabel = 'Manage inventory',
  showPublishToggle = false,
}: HotelsTableProps) {
  const columns: Column<PartnerHotel>[] = [
    {
      id: 'hotel',
      header: 'Hotel',
      cell: hotel => <HotelNameCell hotel={hotel} />,
    },
    {
      id: 'location',
      header: 'Location',
      className: 'hidden md:table-cell',
      cell: hotel => (
        <span className="flex items-center gap-1 text-slate-600">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          {[hotel.district, hotel.city].filter(Boolean).join(', ') || '—'}
        </span>
      ),
    },
    {
      id: 'star',
      header: 'Rating',
      cell: hotel =>
        hotel.starRating != null ? (
          <span className="inline-flex items-center gap-0.5 font-semibold text-amber-600">
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            {hotel.starRating}
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: hotel => (
        <div className="flex flex-wrap items-center gap-1.5">
          {showPublishToggle ? (
            <PublishToggle hotel={hotel} />
          ) : (
            <Pill tone={hotel.isListed ? 'emerald' : 'slate'}>
              {hotel.isListed ? <CheckCircle2 className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              {hotel.isListed ? 'Listed' : 'Unlisted'}
            </Pill>
          )}
          {!hotel.isActive && <Pill tone="red">Inactive</Pill>}
        </div>
      ),
    },
    {
      id: 'roomTypes',
      header: 'Room types',
      align: 'center',
      className: 'hidden sm:table-cell',
      cell: hotel => (
        <span className="inline-flex items-center gap-1.5 text-slate-600">
          <Layers className="h-3.5 w-3.5 text-role-partner-primary" />
          {hotel._count.roomTypes}
        </span>
      ),
    },
    {
      id: 'rooms',
      header: 'Rooms',
      align: 'center',
      className: 'hidden sm:table-cell',
      cell: hotel => (
        <span className="inline-flex items-center gap-1.5 text-slate-600">
          <BedDouble className="h-3.5 w-3.5 text-role-partner-primary" />
          {hotel._count.rooms}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      cell: hotel => (
        <Button
          size="sm"
          onClick={e => {
            e.stopPropagation();
            onManage(hotel);
          }}
          className="bg-role-partner-primary text-white hover:bg-role-partner-secondary"
        >
          {actionLabel}
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={hotels}
      rowKey={hotel => hotel.id}
      minWidthClass="min-w-[720px]"
      onRowClick={onManage}
    />
  );
}
