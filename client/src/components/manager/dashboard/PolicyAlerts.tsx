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

export function PolicyAlerts({ data, isLoading, isError, onRetry }: PolicyAlertsProps) {
  if (isLoading) return <ListCardSkeleton rows={3} />;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h2 className="font-semibold text-slate-900">Policy Violation Alerts</h2>
        </div>
        <Link
          to="/manager/hotel-partners"
          className="text-xs text-role-manager-primary font-medium hover:underline"
        >
          View all →
        </Link>
      </div>

      {isError ? (
        <SectionError onRetry={onRetry} />
      ) : !data || data.length === 0 ? (
        <SectionEmpty icon={AlertTriangle} title="No policy alerts" description="Everything looks healthy right now." />
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
