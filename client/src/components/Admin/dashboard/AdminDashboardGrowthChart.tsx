import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const growthData = [
  { month: 'Jan', users: 4200 },
  { month: 'Feb', users: 5200 },
  { month: 'Mar', users: 6100 },
  { month: 'Apr', users: 7600 },
  { month: 'May', users: 8400 },
  { month: 'Jun', users: 9800 },
  { month: 'Jul', users: 11200 },
  { month: 'Aug', users: 12400 },
];

export function AdminDashboardGrowthChart() {
  return (
    <div className="rounded-sm border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Monthly User Growth</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Active users across the last 8 months
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600">
          +18.4%
        </span>
      </div>
      <div className="mt-4 h-70 rounded-sm border bg-slate-50 p-3">
        <ResponsiveContainer height="100%" width="100%">
          <AreaChart
            data={growthData}
            margin={{ bottom: 0, left: -18, right: 8, top: 12 }}
          >
            <defs>
              <linearGradient id="userGrowthFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="month"
              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
              tickLine={false}
            />
            <YAxis
              axisLine={false}
              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
              tickFormatter={value => `${Number(value) / 1000}k`}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                boxShadow: '0 16px 40px rgba(15, 23, 42, 0.12)',
              }}
              formatter={value => [
                `${Number(value).toLocaleString()} users`,
                'Users',
              ]}
              labelStyle={{ color: '#0f172a', fontWeight: 700 }}
            />
            <Area
              activeDot={{ fill: '#2563eb', r: 5, stroke: '#ffffff', strokeWidth: 2 }}
              dataKey="users"
              fill="url(#userGrowthFill)"
              stroke="#2563eb"
              strokeWidth={3}
              type="monotone"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
