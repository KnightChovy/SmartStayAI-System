import { useNavigate } from 'react-router';
import { Hotel, ShieldCheck } from 'lucide-react';
import { usePartnerHotels } from '@/hooks/hotels';
import { Button } from '@/components/ui/button';
import { HotelDirectory } from '@/components/hotel-partner/hotel-management/HotelDirectory';
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from '@/components/hotel-partner/shared/states';
import type { PartnerHotel } from '@/types/hotel.types';

/**
 * Tổng quan khách sạn của partner (`/partner/hotel-management`).
 * Chỉ liệt kê các property; nghiệp vụ loại phòng/phòng/giá nằm ở Room Inventory.
 */
export default function HotelsPage() {
  const navigate = useNavigate();
  const { data: hotels, isLoading, isError } = usePartnerHotels();

  const goToDetail = (hotel: PartnerHotel) => {
    navigate(`/partner/hotel-management/${hotel.id}`);
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] rounded-xl border border-slate-200 bg-white p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-role-partner-light">
          <Hotel className="h-6 w-6 text-role-partner-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Hotels Management
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Your properties at a glance. Open a hotel to manage its room
            inventory and pricing.
          </p>
        </div>
      </div>

      {isLoading ? (
        <LoadingState label="Loading your hotels..." />
      ) : isError ? (
        <ErrorState label="Failed to load your hotels." />
      ) : !hotels || hotels.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No hotels yet"
          description="Complete hotel verification and get approved to start managing your properties."
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
      ) : (
        <HotelDirectory
          hotels={hotels}
          onManage={goToDetail}
          actionLabel="View details"
          showPublishToggle
        />
      )}
    </div>
  );
}
