import { useState } from 'react';
import { Link } from 'react-router';
import { Search, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';
import { useHotelBookings } from '@/hooks/staff';
import { useStaffHotelStore } from '@/stores/staffHotelStore';
import { BookingStatusBadge } from '@/components/staff/StatusBadge';
import type { BookingStatus } from '@/types/staff.types';
import { ROUTES } from '@/constants/routes';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDateShort } from '@/utils/formatDate';

const STATUS_FILTERS: { value: BookingStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ thanh toán' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'checked_in', label: 'Đang ở' },
  { value: 'checked_out', label: 'Đã trả phòng' },
  { value: 'no_show', label: 'Không đến' },
  { value: 'cancelled', label: 'Đã huỷ' },
];

export default function FrontDeskPage() {
  const hotel = useStaffHotelStore(state => state.hotel);
  const [status, setStatus] = useState<BookingStatus | 'all'>('all');
  const [query, setQuery] = useState('');

  const { data, isLoading, isError } = useHotelBookings(hotel?.id, {
    limit: 100,
    ...(status !== 'all' ? { status } : {}),
  });

  const bookings = (data?.results ?? []).filter(b => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      b.bookingCode.toLowerCase().includes(q) ||
      b.customer.fullName.toLowerCase().includes(q) ||
      b.customer.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Quầy lễ tân</h1>
        <p className="text-sm text-slate-500">Danh sách đặt phòng của {hotel?.name}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setStatus(f.value)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              status === f.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Tìm mã đặt phòng, tên hoặc email khách…"
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {isError && (
          <p className="px-4 py-10 text-center text-sm text-rose-600">
            Không tải được booking. Có thể bạn chưa được phân công vào khách sạn này.
          </p>
        )}
        {isLoading && <p className="px-4 py-10 text-center text-sm text-slate-500">Đang tải…</p>}
        {!isLoading && !isError && bookings.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-slate-400">Không có booking phù hợp.</p>
        )}

        {!isLoading && !isError && bookings.length > 0 && (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Mã / Khách</th>
                <th className="hidden px-4 py-2.5 font-medium md:table-cell">Loại phòng</th>
                <th className="hidden px-4 py-2.5 font-medium sm:table-cell">Nhận → Trả</th>
                <th className="px-4 py-2.5 font-medium">Tổng tiền</th>
                <th className="px-4 py-2.5 font-medium">Trạng thái</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.map(b => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{b.customer.fullName}</p>
                    <p className="font-mono text-xs text-slate-400">{b.bookingCode}</p>
                  </td>
                  <td className="hidden px-4 py-3 text-slate-600 md:table-cell">{b.roomType.name}</td>
                  <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">
                    {formatDateShort(b.checkInDate)} → {formatDateShort(b.checkOutDate)}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {formatCurrency(b.totalAmount)}
                  </td>
                  <td className="px-4 py-3">
                    <BookingStatusBadge status={b.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={ROUTES.staffBookingDetail(b.id)}
                      className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
                    >
                      Chi tiết <ChevronRight className="size-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
