import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/hotel-partner/shared/states';
import { DetailSkeleton } from '@/components/shared/skeletons';
import { useHotelCommissionRate } from '@/hooks/commission-rate';
import { CurrentRateCard } from './CurrentRateCard';
import { CommissionRequestForm } from './CommissionRequestForm';
import { CommissionRequestsTable } from './CommissionRequestsTable';

interface CommissionTabProps {
  hotelId: string;
}

/** Ba khối của màn hoa hồng: mức hiện tại → nộp đơn → lịch sử đơn. */
export function CommissionTab({ hotelId }: CommissionTabProps) {
  const formRef = useRef<HTMLDivElement>(null);
  const { data, isLoading, isError, refetch } = useHotelCommissionRate(hotelId);

  if (isLoading && !data) {
    return <DetailSkeleton sections={2} />;
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center gap-3">
        <ErrorState
          label="Failed to load the commission details for this hotel."
          className="pb-4"
        />
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CurrentRateCard
        summary={data}
        onRequestRenewal={() =>
          formRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          })
        }
      />
      <div ref={formRef}>
        <CommissionRequestForm hotelId={hotelId} summary={data} />
      </div>
      <CommissionRequestsTable hotelId={hotelId} />
    </div>
  );
}
