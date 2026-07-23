import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft,
  Hotel,
  MapPin,
  Star,
  Layers,
  BedDouble,
  Clock,
  CheckCircle2,
  EyeOff,
  Archive,
  Sparkles,
  Pencil,
  ImageIcon,
  Plus,
  Contact,
  ScrollText,
  Receipt,
  MapPinned,
  Settings2,
} from 'lucide-react';
import { useManagedHotel } from '@/hooks/hotels';
import { HotelProfileFormModal } from '@/components/hotel-partner/hotel-management/HotelProfileFormModal';
import { HotelImagesModal } from '@/components/hotel-partner/hotel-management/HotelImagesModal';
import { HotelAmenitiesModal } from '@/components/hotel-partner/hotel-management/HotelAmenitiesModal';
import { HotelContactsModal } from '@/components/hotel-partner/property/HotelContactsModal';
import { HotelPoliciesModal } from '@/components/hotel-partner/property/HotelPoliciesModal';
import { HotelChargesModal } from '@/components/hotel-partner/property/HotelChargesModal';
import { HotelNearbyPlacesModal } from '@/components/hotel-partner/property/HotelNearbyPlacesModal';
import { Button } from '@/components/ui/button';
import {
  ErrorState,
  EmptyState,
} from '@/components/hotel-partner/shared/states';
import { DetailSkeleton } from '@/components/shared/skeletons';
import {
  DataTable,
  type Column,
} from '@/components/hotel-partner/shared/DataTable';
import { Pill } from '@/components/hotel-partner/shared/Pill';
import { formatCurrency } from '@/utils/formatCurrency';
import type { ManagedRoomType } from '@/types/hotel-management.types';

export default function HotelDetailPage() {
  const { hotelId = '' } = useParams();
  const navigate = useNavigate();
  const { data: hotel, isLoading, isError } = useManagedHotel(hotelId);
  const [editOpen, setEditOpen] = useState(false);
  const [photosOpen, setPhotosOpen] = useState(false);
  const [amenitiesOpen, setAmenitiesOpen] = useState(false);
  const [contactsOpen, setContactsOpen] = useState(false);
  const [policiesOpen, setPoliciesOpen] = useState(false);
  const [chargesOpen, setChargesOpen] = useState(false);
  const [nearbyOpen, setNearbyOpen] = useState(false);

  if (isLoading) {
    return (
      <Shell onBack={() => navigate('/partner/hotel-management')}>
        <DetailSkeleton />
      </Shell>
    );
  }
  if (isError || !hotel) {
    return (
      <Shell onBack={() => navigate('/partner/hotel-management')}>
        <ErrorState label="Failed to load this hotel." />
      </Shell>
    );
  }

  const cover =
    hotel.images.find(img => img.isPrimary)?.url ??
    hotel.images[0]?.url ??
    null;
  const location = [hotel.ward, hotel.district, hotel.city, hotel.country]
    .filter(Boolean)
    .join(', ');
  const roomsCount = hotel.roomTypes.reduce(
    (sum, rt) => sum + rt._count.rooms,
    0
  );
  // Tiện nghi 'room'/'service' thuộc loại phòng (quản lý ở Room Inventory), không phải của khách sạn.
  const hotelAmenities = hotel.amenities.filter(
    link => link.amenity.category === 'hotel'
  );

  const roomTypeColumns: Column<ManagedRoomType>[] = [
    {
      id: 'name',
      header: 'Room type',
      cell: rt => (
        <span className="font-semibold text-slate-900">{rt.name}</span>
      ),
    },
    {
      id: 'occupancy',
      header: 'Max guests',
      align: 'center',
      className: 'hidden sm:table-cell',
      cell: rt => <span className="text-slate-600">{rt.maxOccupancy}</span>,
    },
    {
      id: 'price',
      header: 'Base price',
      cell: rt => (
        <span className="font-semibold text-slate-900">
          {formatCurrency(rt.basePrice)}
        </span>
      ),
    },
    {
      id: 'rooms',
      header: 'Rooms',
      align: 'center',
      cell: rt => <span className="text-slate-600">{rt._count.rooms}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      cell: rt => (
        <Pill tone={rt.isActive ? 'emerald' : 'slate'}>
          {rt.isActive ? 'Active' : 'Inactive'}
        </Pill>
      ),
    },
  ];

  return (
    <Shell onBack={() => navigate('/partner/hotel-management')}>
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div className="flex gap-4">
          <div className="h-24 w-32 shrink-0 overflow-hidden rounded-xl bg-slate-100">
            {cover ? (
              <img
                src={cover}
                alt={hotel.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-300">
                <Hotel className="h-8 w-8" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {hotel.name}
            </h1>
            <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
              <MapPin className="h-4 w-4 shrink-0" />
              {location || '—'}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {hotel.starRating != null && (
                <Pill tone="amber">
                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                  {hotel.starRating}-star
                </Pill>
              )}
              <Pill tone={hotel.isListed ? 'emerald' : 'slate'}>
                {hotel.isListed ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <EyeOff className="h-3 w-3" />
                )}
                {hotel.isListed ? 'Listed' : 'Unlisted'}
              </Pill>
              {!hotel.isActive && <Pill tone="red">Inactive</Pill>}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <Button
            onClick={() => setEditOpen(true)}
            className="shrink-0 bg-role-partner-primary text-white hover:bg-role-partner-secondary"
          >
            <Pencil className="mr-1.5 h-4 w-4" />
            Edit Hotel
          </Button>
          <Button
            onClick={() => setPhotosOpen(true)}
            className="shrink-0 bg-role-partner-primary text-white hover:bg-role-partner-secondary"
          >
            <ImageIcon className="mr-1.5 h-4 w-4" />
            Photos
          </Button>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          icon={Layers}
          label="Room types"
          value={hotel.roomTypes.length}
        />
        <StatTile icon={BedDouble} label="Rooms" value={roomsCount} />
        <StatTile
          icon={Sparkles}
          label="Amenities"
          value={hotelAmenities.length}
        />
        <StatTile
          icon={Clock}
          label="Check-in / out"
          value={`${hotel.checkInTime ?? '—'} / ${hotel.checkOutTime ?? '—'}`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* About + amenities */}
        <div className="space-y-6 lg:col-span-2">
          <Section title="About">
            <p className="text-sm leading-relaxed text-slate-600">
              {hotel.description?.trim() || 'No description provided yet.'}
            </p>
          </Section>

          <Section
            title="Amenities"
            action={
              <Button
                size="sm"
                onClick={() => setAmenitiesOpen(true)}
                className="h-7 bg-role-partner-primary px-2.5 text-xs text-white hover:bg-role-partner-secondary"
              >
                <Plus className="mr-1 h-3 w-3" /> Add
              </Button>
            }
          >
            {hotelAmenities.length === 0 ? (
              <p className="text-sm text-slate-400">No amenities listed.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {hotelAmenities.map(link => (
                  <Pill key={link.amenityId} tone="slate">
                    {link.amenity.name}
                  </Pill>
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* Meta */}
        <Section title="Details">
          <dl className="space-y-3 text-sm">
            <InfoRow label="Business type" value={hotel.businessType ?? '—'} />
            <InfoRow label="City" value={hotel.city} />
            <InfoRow label="Country" value={hotel.country} />
            <InfoRow label="Address" value={hotel.address} />
          </dl>
        </Section>
      </div>

      {/* Property information (contacts / policies / charges / nearby) */}
      <div className="mt-6">
        <Section title="Property information">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <PropertyCard
              icon={Contact}
              label="Contacts"
              description="Phone, email & departments"
              onClick={() => setContactsOpen(true)}
            />
            <PropertyCard
              icon={ScrollText}
              label="Policies"
              description="Written terms guests read"
              onClick={() => setPoliciesOpen(true)}
            />
            <PropertyCard
              icon={Receipt}
              label="Taxes & fees"
              description="Added on top of the room price"
              onClick={() => setChargesOpen(true)}
            />
            <PropertyCard
              icon={MapPinned}
              label="Nearby places"
              description="Attractions, airport, transport"
              onClick={() => setNearbyOpen(true)}
            />
          </div>
        </Section>
      </div>

      {/* Room types summary */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Room types</h2>
          {/* Quản lý phòng — đặt dưới phần room type */}
          <div className="mt-4 flex justify-end">
            <Button
              onClick={() =>
                navigate(`/partner/room-inventory?hotelId=${hotel.id}`)
              }
              disabled={!hotel.isActive}
              title={
                hotel.isActive
                  ? undefined
                  : 'Hotel must be active to manage rooms'
              }
              className="bg-role-partner-primary text-white hover:bg-role-partner-secondary"
            >
              <Archive className="mr-1.5 h-4 w-4" />
              Manage room
            </Button>
          </div>
        </div>
        {hotel.roomTypes.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No room types yet"
            description="Open Room Inventory to add your first room type."
          />
        ) : (
          <DataTable
            columns={roomTypeColumns}
            rows={hotel.roomTypes}
            rowKey={rt => rt.id}
            minWidthClass="min-w-[560px]"
          />
        )}
      </div>

      {/* Management modals */}
      <HotelProfileFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        hotel={hotel}
      />
      <HotelImagesModal
        open={photosOpen}
        onClose={() => setPhotosOpen(false)}
        hotel={hotel}
      />
      <HotelAmenitiesModal
        open={amenitiesOpen}
        onClose={() => setAmenitiesOpen(false)}
        hotel={hotel}
      />
      <HotelContactsModal
        open={contactsOpen}
        onClose={() => setContactsOpen(false)}
        hotelId={hotel.id}
        hotelName={hotel.name}
      />
      <HotelPoliciesModal
        open={policiesOpen}
        onClose={() => setPoliciesOpen(false)}
        hotelId={hotel.id}
        hotelName={hotel.name}
      />
      <HotelChargesModal
        open={chargesOpen}
        onClose={() => setChargesOpen(false)}
        hotelId={hotel.id}
        hotelName={hotel.name}
      />
      <HotelNearbyPlacesModal
        open={nearbyOpen}
        onClose={() => setNearbyOpen(false)}
        hotelId={hotel.id}
        hotelName={hotel.name}
      />
    </Shell>
  );
}

function PropertyCard({
  icon: Icon,
  label,
  description,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition-colors hover:border-role-partner-primary hover:bg-role-partner-light/50"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-role-partner-light">
        <Icon className="h-5 w-5 text-role-partner-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="truncate text-xs text-slate-400">{description}</p>
      </div>
      <Settings2 className="ml-auto h-4 w-4 shrink-0 text-slate-300" />
    </button>
  );
}

function Shell({
  children,
  onBack,
}: {
  children: React.ReactNode;
  onBack: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-[1400px] rounded-xl border border-slate-200 bg-white p-6">
      <Button variant="outline" size="sm" onClick={onBack} className="mb-5">
        <ArrowLeft className="mr-1.5 h-4 w-4" /> All hotels
      </Button>
      {children}
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <Icon className="h-3.5 w-3.5 text-role-partner-primary" />
        {label}
      </p>
      <p className="mt-1 truncate text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-slate-400">{label}</dt>
      <dd className="text-right font-medium text-slate-700">{value}</dd>
    </div>
  );
}
