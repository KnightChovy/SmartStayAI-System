import { useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { MessageSquareShare, ShieldCheck, ArrowLeft } from 'lucide-react';
import { usePartnerHotels } from '@/hooks/hotels';
import { Button } from '@/components/ui/button';
import { HotelDirectory } from '@/components/hotel-partner/hotel-management/HotelDirectory';
import { HotelSwitcher } from '@/components/hotel-partner/room-inventory/HotelSwitcher';
import { ReviewsTab } from '@/components/hotel-partner/reviews/ReviewsTab';
import { ErrorState, EmptyState } from '@/components/hotel-partner/shared/states';
import { DirectorySkeleton } from '@/components/shared/skeletons';
import type { PartnerHotel } from '@/types/hotel.types';

/**
 * Reviews (`/partner/reviews`) — xem review + thống kê cho MỘT khách sạn (read-only).
 * Khách sạn đang chọn lưu trên query string (`?hotelId=...`).
 * Nối `GET /hotels/:id/reviews` + `GET /hotels/:id/reviews/stats`.
 */
export default function ReviewsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const hotelId = searchParams.get('hotelId');

  const { data: hotels, isLoading, isError } = usePartnerHotels();

  const activeHotels = useMemo(() => (hotels ?? []).filter(h => h.isActive), [hotels]);
  const currentHotel = activeHotels.find(h => h.id === hotelId) ?? null;

  const selectHotel = (hotel: PartnerHotel) => {
    setSearchParams({ hotelId: hotel.id });
  };

  if (isLoading) {
    return (
      <Shell>
        <DirectorySkeleton columns={4} />
      </Shell>
    );
  }
  if (isError) {
    return (
      <Shell>
        <ErrorState label="Failed to load your hotels." />
      </Shell>
    );
  }
  if (activeHotels.length === 0) {
    return (
      <Shell>
        <EmptyState
          icon={ShieldCheck}
          title="No active hotels yet"
          description="Complete hotel verification and get approved before viewing reviews."
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

  if (!currentHotel) {
    return (
      <Shell>
        <Header
          title="Reviews"
          subtitle="Select a hotel to view its guest reviews and rating stats."
        />
        <HotelDirectory hotels={activeHotels} onManage={selectHotel} actionLabel="View reviews" />
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSearchParams({})}
            title="Back to all hotels"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reviews</h1>
            <p className="mt-0.5 text-sm text-slate-500">{currentHotel.name}</p>
          </div>
        </div>
        <HotelSwitcher hotels={activeHotels} current={currentHotel} onSelect={selectHotel} />
      </div>

      <ReviewsTab hotelId={currentHotel.id} />
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
        <MessageSquareShare className="h-6 w-6 text-role-partner-primary" />
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}
