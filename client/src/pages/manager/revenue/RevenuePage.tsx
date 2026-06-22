import { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Percent,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Download,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { cn } from '@/lib/cn';

const monthlyRevenue = [
  { month: 'Jan', revenue: 2800, commission: 280, target: 3000 },
  { month: 'Feb', revenue: 3100, commission: 310, target: 3000 },
  { month: 'Mar', revenue: 2950, commission: 295, target: 3200 },
  { month: 'Apr', revenue: 3400, commission: 340, target: 3200 },
  { month: 'May', revenue: 3800, commission: 380, target: 3500 },
  { month: 'Jun', revenue: 4200, commission: 420, target: 3500 },
];

const commissionByPartner = [
  { name: 'Vinpearl Resort', commission: 89, bookings: 281 },
  { name: 'Mường Thanh', commission: 64, bookings: 204 },
  { name: 'Rex Hotel', commission: 54, bookings: 180 },
  { name: 'Novotel NT', commission: 44, bookings: 142 },
  { name: 'Gold Coast', commission: 36, bookings: 118 },
];

const kpis = [
  { label: 'Total Platform Revenue', value: '₫4.2B', change: '+12.4%', up: true, icon: TrendingUp, color: 'text-role-manager-primary', bg: 'bg-role-manager-light' },
  { label: 'Total Commission', value: '₫420M', change: '+9.8%', up: true, icon: Percent, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Avg. Commission Rate', value: '10%', change: '0%', up: true, icon: BarChart3, color: 'text-violet-600', bg: 'bg-violet-50' },
  { label: 'Avg. Revenue/Partner', value: '₫29.6M', change: '-3.2%', up: false, icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' },
];

type Period = '6M' | '3M' | '1M';

export default function RevenuePage() {
  const [period, setPeriod] = useState<Period>('6M');

  const sliced = period === '6M' ? monthlyRevenue : period === '3M' ? monthlyRevenue.slice(-3) : monthlyRevenue.slice(-1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-role-manager-light rounded-lg">
              <TrendingUp className="w-6 h-6 text-role-manager-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Platform Revenue</h1>
              <p className="text-slate-500 text-sm">Track revenue and commission reports</p>
            </div>
          </div>
          <button className="flex items-center gap-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={cn('p-2 rounded-lg', k.bg)}>
                  <Icon className={cn('w-5 h-5', k.color)} />
                </div>
                <span className={cn('flex items-center gap-0.5 text-xs font-semibold', k.up ? 'text-emerald-600' : 'text-red-500')}>
                  {k.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {k.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{k.value}</p>
              <p className="text-xs text-slate-500 mt-1">{k.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue & Commission Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-slate-900">Revenue vs Commission</h2>
            <div className="flex gap-1">
              {(['1M', '3M', '6M'] as Period[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-medium transition-all',
                    period === p
                      ? 'bg-role-manager-primary text-white'
                      : 'text-slate-500 hover:bg-slate-100'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={sliced} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="commGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `₫${v}M`} />
              <Tooltip formatter={(v: number) => [`₫${v}M`, '']} />
              <Legend />
              <Area type="monotone" dataKey="revenue" stroke="#2563EB" fill="url(#revGrad)" strokeWidth={2} name="Revenue" />
              <Area type="monotone" dataKey="commission" stroke="#10b981" fill="url(#commGrad)" strokeWidth={2} name="Commission" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Commission by Partner */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Top Commission Sources</h2>
          <div className="space-y-3">
            {commissionByPartner.map((p, i) => (
              <div key={p.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-700 truncate max-w-[140px]">{p.name}</span>
                  <span className="text-sm font-semibold text-slate-900">₫{p.commission}M</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-role-manager-primary"
                    style={{ width: `${(p.commission / commissionByPartner[0].commission) * 100}%`, opacity: 1 - i * 0.15 }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{p.bookings} bookings</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue vs Target Bar Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-6">Revenue vs Target (Monthly)</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyRevenue} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `₫${v}M`} />
            <Tooltip formatter={(v: number) => [`₫${v}M`, '']} />
            <Legend />
            <Bar dataKey="revenue" fill="#2563EB" radius={[4, 4, 0, 0]} name="Revenue" />
            <Bar dataKey="target" fill="#DBEAFE" radius={[4, 4, 0, 0]} name="Target" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
