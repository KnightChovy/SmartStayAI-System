import { Percent } from 'lucide-react';
import { BaseRateCard } from '@/components/manager/commission/BaseRateCard';
import { CommissionRequestsQueue } from '@/components/manager/commission/CommissionRequestsQueue';

/**
 * Commission (`/manager/commission`) — hai việc của Platform Manager:
 * đặt mức hoa hồng NỀN toàn sàn, và duyệt đơn xin ƯU ĐÃI RIÊNG của từng khách sạn.
 *
 * Tách thành trang riêng (không nhét thêm tab vào `HotelPartnersPage` vốn đã 4 tab)
 * theo §5.2 của tài liệu bàn giao.
 */
export default function ManagerCommissionPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-role-manager-light p-2">
            <Percent className="h-6 w-6 text-role-manager-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Commission</h1>
            <p className="text-sm text-slate-500">
              Set the platform base rate and review partners&apos; requests for
              a special rate
            </p>
          </div>
        </div>
        <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-xs text-slate-500">
          A special rate belongs to <strong>one hotel</strong> (not the partner)
          and runs for exactly 12 months, then falls back to the base rate on
          its own. Commission is locked in{' '}
          <strong>when the money arrives</strong>, so changing a rate later
          never alters amounts already recorded.
        </p>
      </div>

      <BaseRateCard />

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Request queue
        </h2>
        <CommissionRequestsQueue />
      </div>
    </div>
  );
}
