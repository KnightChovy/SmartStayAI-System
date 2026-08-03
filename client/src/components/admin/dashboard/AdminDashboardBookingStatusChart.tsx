import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface AdminDashboardBookingStatusChartProps {
  byStatus: Record<string, number>;
  isLoading?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: '#2f7df6',
  checked_in: '#10b981',
  checked_out: '#020617',
  pending: '#f59e0b',
  cancelled: '#cbd5e1',
  no_show: '#ef4444',
};

function formatStatusLabel(status: string): string {
  return status
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function AdminDashboardBookingStatusChart({
  byStatus,
  isLoading,
}: AdminDashboardBookingStatusChartProps) {
  const total = Object.values(byStatus).reduce((sum, value) => sum + value, 0);
  const data = Object.entries(byStatus)
    .filter(([, value]) => value > 0)
    .map(([status, value]) => ({
      label: formatStatusLabel(status),
      value,
      color: STATUS_COLORS[status] ?? '#94a3b8',
    }));

  return (
    <div className="rounded-sm border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Bookings by Status</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Distribution across all bookings
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600">
          {total.toLocaleString('en-US')}
        </span>
      </div>

      {isLoading ? (
        <div className="mt-4 flex h-40 items-center justify-center text-sm text-muted-foreground">
          Loading...
        </div>
      ) : data.length === 0 ? (
        <div className="mt-4 flex h-40 items-center justify-center text-sm text-muted-foreground">
          No bookings yet
        </div>
      ) : (
        <>
          <div className="mx-auto mt-4 h-40 max-w-52">
            <ResponsiveContainer height="100%" width="100%">
              <PieChart>
                <Pie
                  cx="50%"
                  cy="50%"
                  data={data}
                  dataKey="value"
                  innerRadius="58%"
                  outerRadius="82%"
                  paddingAngle={2}
                >
                  {data.map(item => (
                    <Cell fill={item.color} key={item.label} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    boxShadow: '0 16px 40px rgba(15, 23, 42, 0.12)',
                  }}
                  formatter={(value, _name, item) => [
                    `${value} (${((Number(value) / total) * 100).toFixed(1)}%)`,
                    item?.payload?.label ?? 'Bookings',
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="mt-4 space-y-1.5 text-xs">
            {data.map(item => (
              <li
                className="flex items-center justify-between gap-3"
                key={item.label}
              >
                <span className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.label}
                </span>
                <span className="font-bold text-slate-950">{item.value}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
