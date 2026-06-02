import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const deviceData = [
  { color: '#2f7df6', label: 'Mobile', value: 45 },
  { color: '#020617', label: 'Desktop', value: 35 },
  { color: '#cbd5e1', label: 'Tablet', value: 20 },
];

export function AdminDashboardDeviceChart() {
  return (
    <div className="rounded-sm border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Device Distribution</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Sessions by device type
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600">
          8,750
        </span>
      </div>

      <div className="mx-auto mt-4 h-40 max-w-52">
        <ResponsiveContainer height="100%" width="100%">
          <PieChart>
            <Pie
              cx="50%"
              cy="50%"
              data={deviceData}
              dataKey="value"
              innerRadius="58%"
              outerRadius="82%"
              paddingAngle={2}
            >
              {deviceData.map(item => (
                <Cell fill={item.color} key={item.label} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                boxShadow: '0 16px 40px rgba(15, 23, 42, 0.12)',
              }}
              formatter={value => [`${value}%`, 'Share']}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="mt-4 space-y-1.5 text-xs">
        {deviceData.map(item => (
          <li className="flex items-center justify-between gap-3" key={item.label}>
            <span className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.label}
            </span>
            <span className="font-bold text-slate-950">{item.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
