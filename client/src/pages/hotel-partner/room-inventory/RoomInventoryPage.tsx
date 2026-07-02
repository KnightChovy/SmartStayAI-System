import { useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { Archive, ShieldCheck, ArrowLeft } from 'lucide-react';
import { usePartnerHotels } from '@/hooks/hotels';
import { Button } from '@/components/ui/button';
import { HotelDirectory } from '@/components/hotel-partner/hotel-management/HotelDirectory';
import { HotelSwitcher } from '@/components/hotel-partner/room-inventory/HotelSwitcher';
import {
  InventoryTabs,
  isInventoryTab,
  type InventoryTabId,
} from '@/components/hotel-partner/room-inventory/InventoryTabs';
import { RoomTypesTab } from '@/components/hotel-partner/room-inventory/room-types/RoomTypesTab';
import { RoomsTab } from '@/components/hotel-partner/room-inventory/rooms/RoomsTab';
import { PricingRulesTab } from '@/components/hotel-partner/room-inventory/pricing/PricingRulesTab';
import { ErrorState, EmptyState } from '@/components/hotel-partner/shared/states';
import { DirectorySkeleton } from '@/components/shared/skeletons';
import type { PartnerHotel } from '@/types/hotel.types';

/**
 * Room Inventory (`/partner/room-inventory`) — quản trị loại phòng, phòng vật lý
 * và pricing rules cho MỘT khách sạn. Khách sạn + tab hiện hành lưu trên query
 * string (`?hotelId=...&tab=...`) để refresh / share link giữ nguyên trạng thái.
 */
export default function RoomInventoryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const hotelId = searchParams.get('hotelId');
  const tabParam = searchParams.get('tab');
  const activeTab: InventoryTabId = isInventoryTab(tabParam) ? tabParam : 'room-types';

  const { data: hotels, isLoading, isError } = usePartnerHotels();

  // Chỉ khách sạn đang active mới quản trị được tồn kho.
  const activeHotels = useMemo(() => (hotels ?? []).filter(h => h.isActive), [hotels]);
  const currentHotel = activeHotels.find(h => h.id === hotelId) ?? null;

  const selectHotel = (hotel: PartnerHotel) => {
    setSearchParams({ hotelId: hotel.id, tab: activeTab });
  };

  const changeTab = (tab: InventoryTabId) => {
    if (!currentHotel) return;
    setSearchParams({ hotelId: currentHotel.id, tab });
  };

  // ─── Loading / error / empty ────────────────────────────────────────────────

  if (isLoading) {
    return <Shell><DirectorySkeleton columns={4} /></Shell>;
  }
  if (isError) {
    return <Shell><ErrorState label="Failed to load your hotels." /></Shell>;
  }
  if (activeHotels.length === 0) {
    return (
      <Shell>
        <EmptyState
          icon={ShieldCheck}
          title="No active hotels yet"
          description="Complete hotel verification and get approved to start managing room types, rooms and pricing."
          action={
            <Button
              onClick={() => navigate('/partner/verify')}
              className="bg-role-partner-primary text-white hover:bg-role-partner-secondary"
            >
              <ShieldCheck className="mr-1.5 h-4 w-4" />
              Go to Hotel Verification
            </Button>
          }
        />
      </Shell>
    );
  }

  // ─── Hotel picker (chưa chọn khách sạn) ─────────────────────────────────────

  if (!currentHotel) {
    return (
      <Shell>
        <Header
          title="Room Inventory"
          subtitle="Select a hotel to manage its room types, rooms and pricing rules."
        />
        <HotelDirectory hotels={activeHotels} onManage={selectHotel} actionLabel="Manage inventory" />
      </Shell>
    );
  }

  // ─── Workspace (đã chọn khách sạn) ──────────────────────────────────────────

  return (
    <Shell>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/partner/hotel-management')}
            title="Back to all hotels"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Room Inventory</h1>
            <p className="mt-0.5 text-sm text-slate-500">Room types · Rooms · Pricing rules</p>
          </div>
        </div>
        <HotelSwitcher hotels={activeHotels} current={currentHotel} onSelect={selectHotel} />
      </div>

      <InventoryTabs active={activeTab} onChange={changeTab} />

      {activeTab === 'room-types' && <RoomTypesTab hotelId={currentHotel.id} />}
      {activeTab === 'rooms' && <RoomsTab hotelId={currentHotel.id} />}
      {activeTab === 'pricing' && <PricingRulesTab hotelId={currentHotel.id} />}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[1400px] rounded-xl border border-slate-200 bg-white p-6">
      {children}
    </div>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-role-partner-light">
        <Archive className="h-6 w-6 text-role-partner-primary" />
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}
