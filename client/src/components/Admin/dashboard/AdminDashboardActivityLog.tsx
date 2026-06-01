const rows = [
  ['Devoryn', 'Updated system settings', 'Oct 26, 10:15 AM', 'Completed'],
  ['Alex M.', 'Generated monthly report', 'Oct 25, 05:00 PM', 'In Review'],
];

export function AdminDashboardActivityLog() {
  return (
    <div className="overflow-x-auto rounded-sm border bg-white">
      <div className="flex items-center justify-between border-b p-4">
        <h3 className="text-base font-semibold">Recent Activity Log</h3>
        <button className="text-xs font-semibold text-blue-600" type="button">
          View All
        </button>
      </div>
      <table className="min-w-[640px] w-full">
        <thead className="bg-surface-container-low text-left text-[11px] uppercase tracking-wide">
          <tr>
            <th className="p-3">User</th>
            <th className="p-3">Action</th>
            <th className="p-3">Date</th>
            <th className="p-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row[0]} className="border-t">
              <td className="p-3 text-xs font-semibold">{row[0]}</td>
              <td className="p-3 text-xs">{row[1]}</td>
              <td className="p-3 text-xs">{row[2]}</td>
              <td className="p-3 text-xs">{row[3]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
