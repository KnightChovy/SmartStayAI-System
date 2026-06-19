import type { ComponentType } from 'react';
import { Link } from 'react-router';
import { LogIn, LogOut, BedDouble, Clock, ArrowRight } from 'lucide-react';
import { useHotelBookings } from '@/hooks/staff';
import { useStaffHotelStore } from '@/stores/staffHotelStore';
import { BookingStatusBadge } from '@/components/staff/StatusBadge';
import type { HotelBooking } from '@/types/staff.types';
import { ROUTES } from '@/constants/routes';
import { formatDateShort } from '@/utils/formatDate';

/** Cùng ngày (so theo phần ngày, bỏ giờ). */
function isSameDay(iso: string, ref: Date): boolean {
  const d = new Date(iso);
  return (
    d.getUTCFullYear() === ref.getUTCFullYear() &&
    d.getUTCMonth() === ref.getUTCMonth() &&
    d.getUTCDate() === ref.getUTCDate()
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
  tone: string;
}

function StatCard({ label, value, icon: Icon, tone }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className={`mb-2 flex size-9 items-center justify-center rounded-lg ${tone}`}>
        <Icon className="size-5" />
      </div>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

export default function StaffDashboardPage() {
  const hotel = useStaffHotelStore(state => state.hotel);
  const { data, isLoading, isError } = useHotelBookings(hotel?.id, { limit: 100 });

  const bookings: HotelBooking[] = data?.results ?? [];
  const today = new Date();

  const arrivals = bookings.filter(
    b => b.status === 'confirmed' && isSameDay(b.checkInDate, today)
  );
  const departures = bookings.filter(
    b => b.status === 'checked_in' && isSameDay(b.checkOutDate, today)
  );
  const inHouse = bookings.filter(b => b.status === 'checked_in');
  const pendingPayment = bookings.filter(b => b.status === 'pending');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Tổng quan hôm nay</h1>
        <p className="text-sm text-slate-500">{hotel?.name}</p>
      </div>

      {isError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Không tải được dữ liệu booking. Có thể bạn chưa được phân công vào khách sạn này — hãy
          bấm “Đổi” ở thanh trên để chọn lại.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Khách đến hôm nay" value={arrivals.length} icon={LogIn} tone="bg-blue-100 text-blue-700" />
        <StatCard label="Khách trả phòng" value={departures.length} icon={LogOut} tone="bg-amber-100 text-amber-700" />
        <StatCard label="Đang lưu trú" value={inHouse.length} icon={BedDouble} tone="bg-emerald-100 text-emerald-700" />
        <StatCard label="Chờ thanh toán" value={pendingPayment.length} icon={Clock} tone="bg-rose-100 text-rose-700" />
      </div>

      {isLoading && <p className="text-sm text-slate-500">Đang tải…</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <ArrivalsCard title="Khách đến hôm nay" items={arrivals} empty="Không có khách đến hôm nay." />
        <ArrivalsCard title="Khách trả phòng hôm nay" items={departures} empty="Không có khách trả phòng hôm nay." />
      </div>
    </div>
  );
}

function ArrivalsCard({
  title,
  items,
  empty,
}: {
  title: string;
  items: HotelBooking[];
  empty: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <Link
          to={ROUTES.staffFrontDesk}
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Quầy lễ tân <ArrowRight className="size-3" />
        </Link>
      </div>
      <div className="divide-y divide-slate-100">
        {items.length === 0 && <p className="px-4 py-6 text-center text-sm text-slate-400">{empty}</p>}
        {items.map(b => (
          <Link
            key={b.id}
            to={ROUTES.staffBookingDetail(b.id)}
            className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
          >
            <div>
              <p className="text-sm font-medium text-slate-900">{b.customer.fullName}</p>
              <p className="text-xs text-slate-500">
                {b.roomType.name} · {formatDateShort(b.checkInDate)} → {formatDateShort(b.checkOutDate)}
              </p>
            </div>
            <BookingStatusBadge status={b.status} />
          </Link>
        ))}
      </div>
    </div>
  );
}
