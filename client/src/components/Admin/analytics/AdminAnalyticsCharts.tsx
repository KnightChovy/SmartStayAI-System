import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const revenueData = [
  { month: 'Jan', revenue: 180000, target: 170000 },
  { month: 'Feb', revenue: 210000, target: 190000 },
  { month: 'Mar', revenue: 245000, target: 220000 },
  { month: 'Apr', revenue: 230000, target: 235000 },
  { month: 'May', revenue: 285000, target: 260000 },
  { month: 'Jun', revenue: 320000, target: 290000 },
  { month: 'Jul', revenue: 365000, target: 330000 },
  { month: 'Aug', revenue: 410000, target: 360000 },
];

const demographicsData = [
  { color: '#2f7df6', name: 'Leisure Guests', value: 52 },
  { color: '#047857', name: 'Business Travelers', value: 26 },
  { color: '#020617', name: 'Long-stay Guests', value: 22 },
];

const totalRevenue = revenueData.reduce((total, item) => total + item.revenue, 0);
const latestRevenue = revenueData[revenueData.length - 1].revenue;

export function AdminAnalyticsCharts() {
  const [activeRevenueIndex, setActiveRevenueIndex] = useState<number | null>(
    null
  );
  const [activeDemographicIndex, setActiveDemographicIndex] = useState<
    number | null
  >(null);
  const activeRevenue =
    activeRevenueIndex === null ? null : revenueData[activeRevenueIndex];
  const activeDemographic =
    activeDemographicIndex === null
      ? null
      : demographicsData[activeDemographicIndex];

  return (
    <section className="grid gap-5 lg:gap-6 xl:grid-cols-[1.6fr_1fr]">
      <div className="rounded-2xl border bg-white p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold sm:text-2xl">Revenue Growth</h2>
            <p className="text-sm text-muted-foreground sm:text-base">
              Monthly income trajectory vs target
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-right">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Total
              </p>
              <p className="text-lg font-bold text-slate-950">
                ${(totalRevenue / 1000000).toFixed(1)}M
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Latest
              </p>
              <p className="text-lg font-bold text-blue-600">
                ${(latestRevenue / 1000).toFixed(0)}k
              </p>
            </div>
          </div>
        </div>
        <div className="mt-5 h-64 rounded-xl bg-linear-to-b from-blue-50 to-white p-3 sm:mt-6 sm:h-80">
          {activeRevenue ? (
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-blue-100 bg-white px-3 py-2 shadow-sm">
              <p className="text-xs font-bold text-slate-950">
                {activeRevenue.month} revenue
              </p>
              <div className="flex gap-4 text-xs">
                <span className="font-bold text-blue-600">
                  ${activeRevenue.revenue.toLocaleString()}
                </span>
                <span className="font-semibold text-muted-foreground">
                  Target ${activeRevenue.target.toLocaleString()}
                </span>
              </div>
            </div>
          ) : null}
          <ResponsiveContainer height="100%" width="100%">
            <BarChart
              data={revenueData}
              margin={{ bottom: 0, left: -10, right: 8, top: 16 }}
              onMouseMove={state => {
                if (typeof state.activeTooltipIndex === 'number') {
                  setActiveRevenueIndex(state.activeTooltipIndex);
                }
              }}
              onMouseLeave={() => setActiveRevenueIndex(null)}
            >
              <CartesianGrid
                stroke="#dbeafe"
                strokeDasharray="4 4"
                vertical={false}
              />
              <XAxis
                axisLine={false}
                dataKey="month"
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                tickLine={false}
              />
              <YAxis
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                tickFormatter={value => `$${Number(value) / 1000}k`}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  border: '1px solid #dbeafe',
                  borderRadius: '14px',
                  boxShadow: '0 16px 40px rgba(15, 23, 42, 0.12)',
                }}
                formatter={(value, name) => [
                  `$${Number(value).toLocaleString()}`,
                  name === 'target' ? 'Target' : 'Revenue',
                ]}
                labelStyle={{ color: '#0f172a', fontWeight: 700 }}
              />
              <Bar
                dataKey="revenue"
                name="revenue"
                radius={[8, 8, 0, 0]}
              >
                {revenueData.map((item, index) => (
                  <Cell
                    fill={activeRevenueIndex === index ? '#0f172a' : '#2f7df6'}
                    key={`revenue-${item.month}`}
                  />
                ))}
              </Bar>
              <Line
                dataKey="target"
                dot={false}
                name="target"
                stroke="#94a3b8"
                strokeDasharray="5 5"
                strokeWidth={2}
                type="monotone"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-2xl border bg-white p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold sm:text-2xl">
              User Demographics
            </h2>
            <p className="text-sm text-muted-foreground">Segment share</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Users
            </p>
            <p className="text-lg font-bold text-slate-950">14.8k</p>
          </div>
        </div>
        <div className="mx-auto mt-5 h-52 max-w-72 sm:h-64">
          <ResponsiveContainer height="100%" width="100%">
            <PieChart>
              {activeDemographic ? (
                <>
                  <text
                    dominantBaseline="middle"
                    fill="#0f172a"
                    fontSize="24"
                    fontWeight="800"
                    textAnchor="middle"
                    x="50%"
                    y="47%"
                  >
                    {activeDemographic.value}%
                  </text>
                  <text
                    dominantBaseline="middle"
                    fill="#64748b"
                    fontSize="11"
                    fontWeight="700"
                    textAnchor="middle"
                    x="50%"
                    y="57%"
                  >
                    {activeDemographic.name}
                  </text>
                </>
              ) : null}
              <Pie
                cx="50%"
                cy="50%"
                data={demographicsData}
                dataKey="value"
                innerRadius="58%"
                onMouseEnter={(_, index: number) =>
                  setActiveDemographicIndex(index)
                }
                onMouseLeave={() => setActiveDemographicIndex(null)}
                outerRadius="82%"
                paddingAngle={2}
              >
                {demographicsData.map(item => (
                  <Cell fill={item.color} key={item.name} />
                ))}
              </Pie>
              <Tooltip
                formatter={value => [`${value}%`, 'Share']}
                contentStyle={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  boxShadow: '0 16px 40px rgba(15, 23, 42, 0.12)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 space-y-2">
          {demographicsData.map(item => (
            <div className="flex items-center justify-between gap-3" key={item.name}>
              <div className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-semibold text-slate-700">
                  {item.name}
                </span>
              </div>
              <span className="text-sm font-bold text-slate-950">
                {item.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
