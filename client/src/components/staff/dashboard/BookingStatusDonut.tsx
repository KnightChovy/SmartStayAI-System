import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { StatusSlice } from './helpers';

interface Props {
  data: StatusSlice[];
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload?: StatusSlice }>;
}

function DonutTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const slice = payload[0].payload;
  if (!slice) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <div className="flex items-center gap-2">
        <span className="inline-block h-2 w-2 rounded-full" style={{ background: slice.color }} />
        <span className="text-slate-500">{slice.label}:</span>
        <span className="font-medium text-slate-800">{slice.value}</span>
      </div>
    </div>
  );
}

/** Donut cơ cấu trạng thái booking. Tổng ở giữa (overlay). */
export function BookingStatusDonut({ data }: Props) {
  const total = data.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={58}
            outerRadius={82}
            paddingAngle={2}
            stroke="none"
          >
            {data.map(s => (
              <Cell key={s.key} fill={s.color} />
            ))}
          </Pie>
          <Tooltip content={<DonutTooltip />} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
      {/* Tổng ở giữa donut — legend chiếm ~44px dưới nên nhích tâm lên chút */}
      <div className="pointer-events-none absolute inset-x-0 top-23 flex flex-col items-center">
        <span className="text-2xl font-bold text-slate-900">{total}</span>
        <span className="text-[11px] text-slate-400">bookings</span>
      </div>
    </div>
  );
}
