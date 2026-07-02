import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { PlatformAnalytics } from '@/types/analytics.types';
import { PIE_COLORS, formatNumber, type ChartTooltipProps } from './helpers';
import { EmptyBlock } from './states';

interface AnalyticsTopCitiesProps {
  topCities: PlatformAnalytics['topCities'];
}

export function AnalyticsTopCities({ topCities }: AnalyticsTopCitiesProps) {
  const cityTotal = topCities.reduce((sum, c) => sum + c.bookings, 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="font-semibold text-slate-900 mb-4">Bookings by City</h2>
      {topCities.length === 0 ? (
        <EmptyBlock label="No bookings yet" />
      ) : (
        <>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={topCities}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                dataKey="bookings"
                nameKey="city"
                paddingAngle={3}
              >
                {topCities.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CityTooltip total={cityTotal} />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-3">
            {topCities.map((c, i) => {
              const share = cityTotal > 0 ? (c.bookings / cityTotal) * 100 : 0;
              return (
                <div key={c.city} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <span className="text-slate-700 text-xs truncate">{c.city}</span>
                  </div>
                  <span className="text-slate-500 text-xs font-medium shrink-0">
                    {share.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/** A4: donut hover → city + số booking + %. */
function CityTooltip({ active, payload, total }: ChartTooltipProps & { total: number }) {
  if (!active || !payload || payload.length === 0) return null;
  const datum = payload[0]?.payload as { city?: string; bookings?: number } | undefined;
  if (!datum) return null;
  const bookings = datum.bookings ?? 0;
  const share = total > 0 ? ((bookings / total) * 100).toFixed(1) : '0';
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-slate-800">{datum.city}</p>
      <p className="text-slate-600">{formatNumber(bookings)} bookings</p>
      <p className="text-slate-400">{share}%</p>
    </div>
  );
}
