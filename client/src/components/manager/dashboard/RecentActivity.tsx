import { Activity } from 'lucide-react';
import type { ActivityLog } from '@/types/dashboard.types';
import { ListCardSkeleton, SectionEmpty, SectionError } from './states';

interface RecentActivityProps {
  data: ActivityLog[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

/** Thời gian tương đối gọn: "3h ago" / "2d ago". */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

/** AC-8: Recent activity / audit log (ai làm gì lúc nào). */
export function RecentActivity({ data, isLoading, isError, onRetry }: RecentActivityProps) {
  if (isLoading) return <ListCardSkeleton rows={5} />;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-5">
        <Activity className="w-5 h-5 text-role-manager-primary" />
        <h2 className="font-semibold text-slate-900">Recent Activity</h2>
      </div>

      {isError ? (
        <SectionError onRetry={onRetry} />
      ) : !data || data.length === 0 ? (
        <SectionEmpty icon={Activity} title="No recent activity" />
      ) : (
        <div className="space-y-3">
          {data.map(a => (
            <div key={a.id} className="flex items-start gap-3">
              <span className="mt-1.5 size-2 rounded-full bg-role-manager-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-700">
                  <span className="font-medium text-slate-800">{a.actor}</span> {a.action}{' '}
                  <span className="font-medium text-slate-800">{a.target}</span>
                </p>
                <p className="text-xs text-slate-500">{timeAgo(a.at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
