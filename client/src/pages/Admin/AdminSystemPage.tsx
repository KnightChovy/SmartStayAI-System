import { AlertTriangle, FileClock, ShieldAlert, ShieldCheck } from 'lucide-react';
import { AdminPageHeader } from '@/components/Admin/shared/AdminPageHeader';
import { AdminTable } from '@/components/Admin/shared/AdminTable';

const logs = [
  ['LOG-8021', 'Auth', 'Admin session refreshed', 'Low', '2 min ago'],
  ['LOG-8022', 'Payments', 'Gateway verification retry', 'Medium', '8 min ago'],
  ['LOG-8023', 'AI', 'Prompt template edited', 'Low', '14 min ago'],
  ['LOG-8024', 'Security', 'Suspicious login blocked', 'High', '26 min ago'],
];

const auditTrails = [
  ['AUD-441', 'Admin', 'Activated manager account', 'Users', 'Today'],
  ['AUD-442', 'System', 'Updated notification template', 'Settings', 'Today'],
  ['AUD-443', 'Finance', 'Verified pending payout', 'Payments', 'Yesterday'],
];

export function AdminSystemPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="System Monitor"
        description="Monitor system logs, audit trails, and security events across SmartStay AI."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5">
          <ShieldCheck className="size-5 text-emerald-600" />
          <p className="mt-4 text-sm text-muted-foreground">Security posture</p>
          <p className="text-2xl font-bold">Healthy</p>
        </div>
        <div className="rounded-2xl border bg-white p-5">
          <AlertTriangle className="size-5 text-amber-600" />
          <p className="mt-4 text-sm text-muted-foreground">Open alerts</p>
          <p className="text-2xl font-bold">7</p>
        </div>
        <div className="rounded-2xl border bg-white p-5">
          <FileClock className="size-5 text-blue-600" />
          <p className="mt-4 text-sm text-muted-foreground">Audit events</p>
          <p className="text-2xl font-bold">1,284</p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-rows-[1.2fr_0.8fr]">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-5 text-red-600" />
            <h2 className="text-lg font-bold">System Logs & Security Events</h2>
          </div>
          <AdminTable
            headers={['ID', 'Source', 'Event', 'Severity', 'Time']}
            rows={logs}
            renderLastColumn={row => (
              <span className="text-sm font-semibold text-slate-700">{row[4]}</span>
            )}
          />
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-bold">Audit Trail</h2>
          <AdminTable
            headers={['ID', 'Actor', 'Action', 'Module', 'Date']}
            rows={auditTrails}
          />
        </div>
      </section>
    </div>
  );
}
