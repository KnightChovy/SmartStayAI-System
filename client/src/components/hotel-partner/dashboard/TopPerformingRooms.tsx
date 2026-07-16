import { BedDouble } from 'lucide-react';

/**
 * Backend chưa có endpoint doanh thu/booking theo từng loại phòng, nên phần này
 * để trống (empty state) cho tới khi có API. Khi có, chỉ cần đổ dữ liệu vào đây.
 */
export function TopPerformingRooms() {
  return (
    <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm mb-6">
      <h3 className="text-base font-bold text-slate-900 mb-5">Top Performing Rooms</h3>
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center mb-3">
          <BedDouble className="w-5 h-5 text-slate-400" />
        </div>
        <p className="text-sm text-slate-500">No data available yet.</p>
        <p className="text-xs text-slate-400 mt-1">Per-room performance is not tracked yet.</p>
      </div>
    </div>
  );
}
