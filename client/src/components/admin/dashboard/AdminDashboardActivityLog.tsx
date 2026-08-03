import { cn } from '@/lib/cn';

const rows = [
  ['Devoryn', 'Updated system settings', 'Oct 26, 10:15 AM', 'Completed'],
  ['Alex M.', 'Generated monthly report', 'Oct 25, 05:00 PM', 'In Review'],
];

export function AdminDashboardActivityLog() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white ">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <h3 className="text-base font-semibold text-slate-950">
          Recent Activity Log
        </h3>
        <button
          className="rounded-lg px-2 py-1 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
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
            {rows.map(row => (
              <tr
                key={row[0]}
                className="transition-colors duration-200 hover:bg-indigo-50/35"
              >
                <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-950">
                  {row[0]}
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">{row[1]}</td>
                <td className="whitespace-nowrap px-4 py-4 text-xs font-medium text-slate-500">
                  {row[2]}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={cn(
                      'inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold',
                      row[3] === 'Completed'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-amber-200 bg-amber-50 text-amber-700'
                    )}
                  >
                    {row[3]}
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
