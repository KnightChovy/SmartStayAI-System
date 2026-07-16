import { Link } from 'react-router';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { DashboardAlert } from '@/types/dashboard.types';
import { ALERT_SEVERITY_CONFIG } from './labels';
import { ListCardSkeleton, SectionEmpty, SectionError } from './states';

interface PolicyAlertsProps {
  data: DashboardAlert[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

/**
 * "Khách sạn cần chú ý" — suy ra từ `GET /platform-manager/performance` (xem `use-dashboard-alerts`).
 *
 * Không phải "policy violation" theo nghĩa BE có luật riêng: BE KHÔNG có API cảnh báo nào.
 * Đây là các ngưỡng do FE quy ước áp lên số liệu hiệu suất thật (90 ngày gần nhất),
 * nên tiêu đề tránh hàm ý đây là vi phạm chính sách đã được hệ thống phán quyết.
 */
export function PolicyAlerts({ data, isLoading, isError, onRetry }: PolicyAlertsProps) {
  if (isLoading) return <ListCardSkeleton rows={3} />;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-start justify-between mb-4 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="font-semibold text-slate-900">Hotels Needing Attention</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Based on performance over the last 90 days
          </p>
        </div>
        <Link
          to="/manager/hotel-partners"
          className="text-xs text-role-manager-primary font-medium hover:underline shrink-0"
        >
          View all →
        </Link>
      </div>

      {isError ? (
        <SectionError onRetry={onRetry} />
      ) : !data || data.length === 0 ? (
        <SectionEmpty
          icon={AlertTriangle}
          title="No hotels need attention"
          description="Cancellation rates, ratings and response times all look healthy."
        />
      ) : (
        <div className="space-y-2.5">
          {data.map(a => {
            const cfg = ALERT_SEVERITY_CONFIG[a.severity];
            const AlertIcon = cfg.icon;
            return (
              <div key={a.id} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
                <div className={cn('p-1.5 rounded-lg mt-0.5 shrink-0', cfg.class)}>
                  <AlertIcon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 truncate">{a.hotelName}</p>
                  <p className="text-xs text-slate-500">{a.issue}</p>
                </div>
                <Link
                  to={`/manager/hotel-partners?hotelId=${a.hotelId}`}
                  className="text-xs text-role-manager-primary font-medium hover:underline shrink-0 self-center"
                >
                  View detail
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
