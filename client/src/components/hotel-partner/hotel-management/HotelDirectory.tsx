import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import AppFilter from '@/common/filter/AppFilter';
import { EmptyState } from '@/components/hotel-partner/shared/states';
import { HotelsTable } from './HotelsTable';
import type { PartnerHotel } from '@/types/hotel.types';

type ListingFilter = 'all' | 'listed' | 'unlisted';

const LISTING_OPTIONS = [
  { label: 'All listings', value: 'all' },
  { label: 'Listed', value: 'listed' },
  { label: 'Unlisted', value: 'unlisted' },
];

interface HotelDirectoryProps {
  hotels: PartnerHotel[];
  onManage: (hotel: PartnerHotel) => void;
  actionLabel?: string;
}

/**
 * Thanh tìm kiếm + lọc trạng thái listing trên danh sách khách sạn, kèm bảng kết quả.
 * Dùng chung cho Hotels page và bước chọn khách sạn của Room Inventory.
 */
export function HotelDirectory({ hotels, onManage, actionLabel }: HotelDirectoryProps) {
  const [search, setSearch] = useState('');
  const [listing, setListing] = useState<ListingFilter>('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return hotels.filter(hotel => {
      const matchesSearch =
        !q ||
        hotel.name.toLowerCase().includes(q) ||
        hotel.city.toLowerCase().includes(q) ||
        hotel.address.toLowerCase().includes(q);
      const matchesListing =
        listing === 'all' || (listing === 'listed' ? hotel.isListed : !hotel.isListed);
      return matchesSearch && matchesListing;
    });
  }, [hotels, search, listing]);

  return (
    <div>
      <div className="mb-5">
        <AppFilter
          search={search}
          onSearchChange={setSearch}
          status={listing}
          onStatusChange={v => setListing(v as ListingFilter)}
          statusOptions={LISTING_OPTIONS}
          onReset={() => {
            setSearch('');
            setListing('all');
          }}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No hotels match your filters"
          description="Try adjusting your search keyword or listing filter."
        />
      ) : (
        <HotelsTable hotels={filtered} onManage={onManage} actionLabel={actionLabel} />
      )}
    </div>
  );
}
