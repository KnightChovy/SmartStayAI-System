import { cn } from '@/lib/cn';
import { useAdminModal } from '@/components/admin/models/AdminModalContext';
import { useAdminAuditLogs } from '@/hooks/admin';
import { errorMessage } from '@/utils/errorMessage';
import { formatDateShort, formatTime } from '@/utils/formatDate';

const ACTIVITY_LIMIT = 6;

function formatAction(action: string): string {
  return action
    .split(/[._]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function AdminDashboardActivityLog() {
  const { openMessages } = useAdminModal();
  const { data, isLoading, isError, error } = useAdminAuditLogs({
    limit: ACTIVITY_LIMIT,
  });
  const logs = data?.results ?? [];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white ">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <h3 className="text-base font-semibold text-slate-950">
          Recent Activity Log
        </h3>
        <button
          className="rounded-lg px-2 py-1 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
          onClick={openMessages}
          type="button"
        >
          View All
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-140 w-full text-left">
          <thead className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            <tr>
              <th className="px-5 py-3.5">User</th>
              <th className="px-4 py-3.5">Action</th>
              <th className="px-4 py-3.5">Date</th>
              <th className="px-5 py-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td className="px-5 py-8 text-center text-sm text-slate-500" colSpan={4}>
                  Loading activity log...
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td className="px-5 py-8 text-center text-sm font-medium text-destructive" colSpan={4}>
                  {errorMessage(error, 'Could not load activity log.')}
                </td>
              </tr>
            )}
            {!isLoading && !isError && logs.length === 0 && (
              <tr>
                <td className="px-5 py-8 text-center text-sm text-slate-500" colSpan={4}>
                  No activity recorded yet.
                </td>
              </tr>
            )}
            {!isLoading && !isError && logs.map(log => (
              <tr
                key={log.id}
                className="transition-colors duration-200 hover:bg-indigo-50/35"
              >
                <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-950">
                  {log.user?.fullName ?? log.user?.email ?? 'System'}
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">
                  {formatAction(log.action)} · {log.entityType}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-xs font-medium text-slate-500">
                  {formatDateShort(log.createdAt)}, {formatTime(new Date(log.createdAt))}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={cn(
                      'inline-flex rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700'
                    )}
                  >
                    Recorded
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
