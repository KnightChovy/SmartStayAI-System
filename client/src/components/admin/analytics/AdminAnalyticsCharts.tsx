import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type {
  PlatformAnalyticsTimePoint,
  PlatformAnalyticsTopCity,
} from '@/types/analytics.types';

interface AdminAnalyticsChartsProps {
  timeSeries: PlatformAnalyticsTimePoint[];
  topCities: PlatformAnalyticsTopCity[];
  isLoading?: boolean;
}

const CITY_COLORS = ['#2f7df6', '#047857', '#020617', '#f59e0b', '#a855f7'];

function formatPeriodLabel(period: string): string {
  const [year, month] = period.split('-');
  if (!month) return period;
  return `${month}/${year.slice(2)}`;
}

export function AdminAnalyticsCharts({
  timeSeries,
  topCities,
  isLoading,
}: AdminAnalyticsChartsProps) {
  const [activeBookingIndex, setActiveBookingIndex] = useState<number | null>(
    null
  );
  const [activeCityIndex, setActiveCityIndex] = useState<number | null>(null);

  const bookingData = timeSeries.map(point => ({
    month: formatPeriodLabel(point.period),
    bookings: point.bookings,
    confirmed: point.confirmedBookings,
  }));
  const activeBooking =
    activeBookingIndex === null ? null : bookingData[activeBookingIndex];

  const totalBookings = bookingData.reduce(
    (sum, item) => sum + item.bookings,
    0
  );
  const latestBookings = bookingData[bookingData.length - 1]?.bookings ?? 0;

  const totalCityBookings = topCities.reduce(
    (sum, item) => sum + item.bookings,
    0
  );
  const cityData = topCities.map((item, index) => ({
    name: item.city,
    value: item.bookings,
    color: CITY_COLORS[index % CITY_COLORS.length],
    share:
      totalCityBookings > 0 ? (item.bookings / totalCityBookings) * 100 : 0,
  }));
  const activeCity =
    activeCityIndex === null ? null : cityData[activeCityIndex];

  return (
    <section className="grid gap-5 lg:gap-6 xl:grid-cols-[1.6fr_1fr]">
      <div className="rounded-xl border bg-white p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold sm:text-2xl">Bookings Growth</h2>
            <p className="text-sm text-muted-foreground sm:text-base">
              Monthly bookings vs confirmed
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-right">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Total
              </p>
              <p className="text-lg font-bold text-slate-950">
                {totalBookings.toLocaleString('en-US')}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Latest
              </p>
              <p className="text-lg font-bold text-blue-600">
                {latestBookings.toLocaleString('en-US')}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-5 h-64 rounded-xl bg-linear-to-b from-blue-50 to-white p-3 sm:mt-6 sm:h-80">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : bookingData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No data yet
            </div>
          ) : (
            <>
              {activeBooking ? (
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-100 bg-white px-3 py-2 shadow-sm">
                  <p className="text-xs font-bold text-slate-950">
                    {activeBooking.month} bookings
                  </p>
                  <div className="flex gap-4 text-xs">
                    <span className="font-bold text-blue-600">
                      {activeBooking.bookings.toLocaleString()} total
                    </span>
                    <span className="font-semibold text-muted-foreground">
                      {activeBooking.confirmed.toLocaleString()} confirmed
                    </span>
                  </div>
                </div>
              ) : null}
              <ResponsiveContainer height="100%" width="100%">
                <BarChart
                  data={bookingData}
                  margin={{ bottom: 0, left: -10, right: 8, top: 16 }}
                  onMouseMove={state => {
                    if (typeof state.activeTooltipIndex === 'number') {
                      setActiveBookingIndex(state.activeTooltipIndex);
                    }
                  }}
                  onMouseLeave={() => setActiveBookingIndex(null)}
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
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      border: '1px solid #dbeafe',
                      borderRadius: '14px',
                      boxShadow: '0 16px 40px rgba(15, 23, 42, 0.12)',
                    }}
                    formatter={(value, name) => [
                      Number(value).toLocaleString(),
                      name === 'confirmed' ? 'Confirmed' : 'Bookings',
                    ]}
                    labelStyle={{ color: '#0f172a', fontWeight: 700 }}
                  />
                  <Bar
                    dataKey="bookings"
                    fill="#2f7df6"
                    name="bookings"
                    radius={[8, 8, 0, 0]}
                    barSize={18}
                  />
                  <Bar
                    dataKey="confirmed"
                    fill="#94a3b8"
                    name="confirmed"
                    radius={[8, 8, 0, 0]}
                    barSize={18}
                  />
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
        </div>
      </div>
      <div className="rounded-xl border bg-white p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold sm:text-2xl">Top Cities</h2>
            <p className="text-sm text-muted-foreground">
              Booking share by city
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Bookings
            </p>
            <p className="text-lg font-bold text-slate-950">
              {totalCityBookings.toLocaleString('en-US')}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-5 flex h-52 items-center justify-center text-sm text-muted-foreground sm:h-64">
            Loading...
          </div>
        ) : cityData.length === 0 ? (
          <div className="mt-5 flex h-52 items-center justify-center text-sm text-muted-foreground sm:h-64">
            No data yet
          </div>
        ) : (
          <>
            <div className="mx-auto mt-5 h-52 max-w-72 sm:h-64">
              <ResponsiveContainer height="100%" width="100%">
                <PieChart>
                  {activeCity ? (
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
                        {activeCity.share.toFixed(0)}%
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
                        {activeCity.name}
                      </text>
                    </>
                  ) : null}
                  <Pie
                    cx="50%"
                    cy="50%"
                    data={cityData}
                    dataKey="value"
                    innerRadius="58%"
                    onMouseEnter={(_, index: number) =>
                      setActiveCityIndex(index)
                    }
                    onMouseLeave={() => setActiveCityIndex(null)}
                    outerRadius="82%"
                    paddingAngle={2}
                  >
                    {cityData.map(item => (
                      <Cell fill={item.color} key={item.name} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, _name, item) => [
                      `${value} (${(item?.payload?.share ?? 0).toFixed(1)}%)`,
                      item?.payload?.name ?? 'Bookings',
                    ]}
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
              {cityData.map(item => (
                <div
                  className="flex items-center justify-between gap-3"
                  key={item.name}
                >
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
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
