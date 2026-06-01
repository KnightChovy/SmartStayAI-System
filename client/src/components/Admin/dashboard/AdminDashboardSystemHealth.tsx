const health = [
  ['Database', '99%'],
  ['Server', '98%'],
  ['API', '100%'],
  ['Network', '95%'],
];

export function AdminDashboardSystemHealth() {
  return (
    <div className="rounded-sm border bg-white p-4">
      <h3 className="text-base font-semibold">System Health</h3>
      <p className="mt-2 text-lg font-bold text-green-600">Excellent</p>
      <div className="mt-4 space-y-2">
        {health.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between text-xs"
          >
            <span>{label}</span>
            <span className="font-semibold text-green-600">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
