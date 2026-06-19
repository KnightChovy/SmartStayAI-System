import { useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { Hotel, ShieldCheck, Archive, Search, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/authStore';
import { usePartnerHotels } from '@/hooks/hotels';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PartnerHotelCard } from '@/components/hotel-partner/hotel-management/PartnerHotelCard';
import { HotelSwitcher } from '@/components/hotel-partner/room-inventory/HotelSwitcher';
import { RoomTypesTab } from '@/components/hotel-partner/room-inventory/room-types/RoomTypesTab';
import { RoomsTab } from '@/components/hotel-partner/room-inventory/rooms/RoomsTab';
import { PricingRulesTab } from '@/components/hotel-partner/room-inventory/pricing/PricingRulesTab';
import { LoadingState, ErrorState, EmptyState } from '@/components/hotel-partner/shared/states';
import type { PartnerHotel } from '@/types/hotel.types';

type TabId = 'room-types' | 'rooms' | 'pricing';
type ListingFilter = 'all' | 'listed' | 'unlisted';

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'room-types', label: 'Room Types', icon: Archive },
  { id: 'rooms', label: 'Rooms', icon: Hotel },
  { id: 'pricing', label: 'Pricing Rules', icon: ShieldCheck },
];

export default function HotelManagementPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const hotelId = searchParams.get('hotelId');
  const [activeTab, setActiveTab] = useState<TabId>('room-types');

  // Picker filters
  const [search, setSearch] = useState('');
  const [listing, setListing] = useState<ListingFilter>('all');

  const userId = useAuthStore(s => s.user?.id);
  const { data: hotels, isLoading, isError } = usePartnerHotels(userId);

  // Only active hotels are manageable.
  const activeHotels = useMemo(() => (hotels ?? []).filter(h => h.isActive), [hotels]);

  const currentHotel = activeHotels.find(h => h.id === hotelId) ?? null;

  const filteredHotels = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activeHotels.filter(h => {
      const matchesSearch =
        !q ||
        h.name.toLowerCase().includes(q) ||
        h.city.toLowerCase().includes(q) ||
        h.address.toLowerCase().includes(q);
      const matchesListing =
        listing === 'all' || (listing === 'listed' ? h.isListed : !h.isListed);
      return matchesSearch && matchesListing;
    });
  }, [activeHotels, search, listing]);

  const selectHotel = (hotel: PartnerHotel) => {
    setActiveTab('room-types');
    setSearchParams({ hotelId: hotel.id });
  };

  const backToList = () => setSearchParams({});

  // ─── Loading / error / empty ────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-xl border border-slate-200">
        <LoadingState label="Loading your hotels..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 bg-white rounded-xl border border-slate-200">
        <ErrorState label="Failed to load your hotels." />
      </div>
    );
  }

  if (activeHotels.length === 0) {
    return (
      <div className="p-6 bg-white rounded-xl border border-slate-200">
        <EmptyState
          icon={ShieldCheck}
          title="No active hotels yet"
          description="Complete hotel verification and get approved to start managing room types, rooms and pricing."
          action={
            <Button
              onClick={() => navigate('/partner/verify')}
              className="bg-role-partner-primary hover:bg-role-partner-secondary text-white"
            >
              <ShieldCheck className="w-4 h-4 mr-1.5" />
              Go to Hotel Verification
            </Button>
          }
        />
      </div>
    );
  }

  // ─── Management workspace (a hotel is selected) ─────────────────────────────

  if (currentHotel) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto w-full bg-white rounded-xl border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={backToList} title="Back to all hotels">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Hotel Management</h1>
              <p className="text-slate-500 text-sm mt-0.5">Room types · Rooms · Pricing rules</p>
            </div>
          </div>
          <HotelSwitcher hotels={activeHotels} current={currentHotel} onSelect={selectHotel} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-200 mb-6 overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
                  active
                    ? 'border-role-partner-primary text-role-partner-primary'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'room-types' && <RoomTypesTab hotelId={currentHotel.id} />}
        {activeTab === 'rooms' && <RoomsTab hotelId={currentHotel.id} />}
        {activeTab === 'pricing' && <PricingRulesTab hotelId={currentHotel.id} />}
      </div>
    );
  }

  // ─── Hotel list (picker) ────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-[1400px] mx-auto w-full bg-white rounded-xl border border-slate-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-role-partner-light flex items-center justify-center">
          <Hotel className="w-6 h-6 text-role-partner-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Hotel Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Select a hotel to manage its room types, rooms and pricing rules.
          </p>
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, city or address..."
            className="pl-8 h-10"
          />
        </div>
        <Select value={listing} onValueChange={v => setListing(v as ListingFilter)}>
          <SelectTrigger className="w-full sm:w-48 h-10">
            <SelectValue placeholder="Listing status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All listings</SelectItem>
            <SelectItem value="listed">Listed</SelectItem>
            <SelectItem value="unlisted">Unlisted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredHotels.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No hotels match your filters"
          description="Try adjusting your search keyword or listing filter."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredHotels.map(hotel => (
            <PartnerHotelCard
              key={hotel.id}
              hotel={hotel}
              actionLabel="Manage"
              onManage={selectHotel}
            />
          ))}
        </div>
      )}
    </div>
  );
}
