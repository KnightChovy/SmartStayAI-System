import { Target } from 'lucide-react';

/**
 * Backend chưa có endpoint mục tiêu doanh thu (revenue target) cho partner,
 * nên để trống theo yêu cầu. Khi có API targets, đổ dữ liệu vào đây.
 */
export function RevenueTarget() {
  return (
    <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col">
      <h3 className="text-base font-bold text-slate-900 mb-6 w-full text-left">Revenue Target</h3>
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center mb-3">
          <Target className="w-6 h-6 text-slate-400" />
        </div>
        <p className="text-sm text-slate-500">No target set.</p>
        <p className="text-xs text-slate-400 mt-1">Revenue goals are not available yet.</p>
      </div>
    </div>
  );
}
