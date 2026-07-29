import {
  AlertTriangle,
  FileClock,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/shared/AdminPageHeader';
import { AdminTable } from '@/components/admin/shared/AdminTable';
import { useAdminAuditLogs } from '@/hooks/admin';
import { errorMessage } from '@/utils/errorMessage';
import { formatDateShort } from '@/utils/formatDate';

export function AdminSystemPage() {
  const { data, isLoading, isError, error } = useAdminAuditLogs({ limit: 20 });

  const auditRows =
    data?.results.map(log => [
      log.id,
      log.user?.fullName || log.user?.email || log.userId,
      log.action,
      log.entityType,
      formatDateShort(log.createdAt),
    ]) ?? [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="System Monitor"
        description="Monitor system logs, audit trails, and security events across StayHub."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5">
          <ShieldCheck className="size-5 text-emerald-600" />
          <p className="mt-4 text-sm text-muted-foreground">Security posture</p>
          <p className="text-2xl font-bold">Healthy</p>
        </div>
        <div className="rounded-2xl border bg-white p-5">
          <AlertTriangle className="size-5 text-amber-600" />
          <p className="mt-4 text-sm text-muted-foreground">Tracked modules</p>
          <p className="text-2xl font-bold">
            {new Set(data?.results.map(log => log.entityType)).size}
          </p>
        </div>
        <div className="rounded-2xl border bg-white p-5">
          <FileClock className="size-5 text-blue-600" />
          <p className="mt-4 text-sm text-muted-foreground">Audit events</p>
          <p className="text-2xl font-bold">
            {data?.totalResults.toLocaleString('en-US') ?? '—'}
          </p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-rows-[1.2fr_0.8fr]">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-5 text-red-600" />
            <h2 className="text-lg font-bold">Recent Audit Events</h2>
          </div>
          {isLoading && (
            <p className="text-sm text-muted-foreground">
              Loading audit logs...
            </p>
          )}
          {isError && (
            <p className="text-sm font-medium text-destructive">
              {errorMessage(error, 'Could not load audit logs.')}
            </p>
          )}
          <AdminTable
            headers={['ID', 'Actor', 'Action', 'Entity', 'Date']}
            rows={auditRows}
            renderLastColumn={row => (
              <span className="text-sm font-semibold text-slate-700">
                {row[4]}
              </span>
            )}
          />
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-bold">Entity Trail</h2>
          <AdminTable
            headers={['Entity ID', 'Actor', 'Action', 'Entity', 'Date']}
            rows={
              data?.results.map(log => [
                log.entityId,
                log.user?.fullName || log.user?.email || log.userId,
                log.action,
                log.entityType,
                formatDateShort(log.createdAt),
              ]) ?? []
            }
          />
        </div>
      </section>
    </div>
  );
}
