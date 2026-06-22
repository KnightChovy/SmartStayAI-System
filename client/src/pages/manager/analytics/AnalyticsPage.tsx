import {
  BarChart2,
  Users,
  Hotel,
  CalendarCheck,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  MousePointerClick,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { cn } from '@/lib/cn';

const growthData = [
  { month: 'Jan', users: 12400, hotels: 98, bookings: 2800 },
  { month: 'Feb', users: 13100, hotels: 105, bookings: 3100 },
  { month: 'Mar', users: 14200, hotels: 112, bookings: 2950 },
  { month: 'Apr', users: 15800, hotels: 120, bookings: 3400 },
  { month: 'May', users: 17100, hotels: 133, bookings: 3800 },
  { month: 'Jun', users: 18450, hotels: 142, bookings: 4200 },
];

const conversionData = [
  { month: 'Jan', views: 48000, searches: 22000, bookings: 2800 },
  { month: 'Feb', views: 51000, searches: 24500, bookings: 3100 },
  { month: 'Mar', views: 54000, searches: 26000, bookings: 2950 },
  { month: 'Apr', views: 58000, searches: 28500, bookings: 3400 },
  { month: 'May', views: 64000, searches: 31000, bookings: 3800 },
  { month: 'Jun', views: 71000, searches: 34000, bookings: 4200 },
];

const topCities = [
  { city: 'TP. Hồ Chí Minh', bookings: 1420, share: 33.8 },
  { city: 'Hà Nội', bookings: 980, share: 23.3 },
  { city: 'Đà Nẵng', bookings: 720, share: 17.1 },
  { city: 'Phú Quốc', bookings: 540, share: 12.9 },
  { city: 'Nha Trang', bookings: 342, share: 8.1 },
];

const PIE_COLORS = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'];

const kpis = [
  { label: 'Total Users', value: '18,450', change: '+8.5%', up: true, icon: Users, color: 'text-role-manager-primary', bg: 'bg-role-manager-light' },
  { label: 'Active Hotels', value: '142', change: '+6.8%', up: true, icon: Hotel, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Total Bookings (Jun)', value: '4,200', change: '+10.5%', up: true, icon: CalendarCheck, color: 'text-violet-600', bg: 'bg-violet-50' },
  { label: 'Conversion Rate', value: '5.9%', change: '-0.4%', up: false, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
];

const conversionRate = conversionData.map(d => ({
  month: d.month,
  'View→Search': +((d.searches / d.views) * 100).toFixed(1),
  'Search→Book': +((d.bookings / d.searches) * 100).toFixed(1),
}));

export default function AnalyticsPage() {
  const latestRates = conversionRate[conversionRate.length - 1];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-role-manager-light rounded-lg">
            <BarChart2 className="w-6 h-6 text-role-manager-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Platform Analytics</h1>
            <p className="text-slate-500 text-sm">System growth metrics and conversion funnel</p>
          </div>
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

      {/* System Growth */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-6">System Growth Metrics</h2>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={growthData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="users" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 4 }} name="Users" />
            <Line type="monotone" dataKey="bookings" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} name="Bookings" />
            <Line type="monotone" dataKey="hotels" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} name="Hotels" strokeDasharray="5 4" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversion Funnel */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-2">Conversion Metrics</h2>
          <p className="text-xs text-slate-500 mb-5">View → Search → Booking conversion rates</p>

          {/* Funnel summary */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Page Views', value: '71K', icon: Eye, color: 'text-role-manager-primary' },
              { label: 'Searches', value: '34K', icon: MousePointerClick, color: 'text-violet-600' },
              { label: 'Bookings', value: '4.2K', icon: CalendarCheck, color: 'text-emerald-600' },
            ].map(f => {
              const Icon = f.icon;
              return (
                <div key={f.label} className="text-center bg-slate-50 rounded-xl p-3">
                  <Icon className={cn('w-5 h-5 mx-auto mb-1', f.color)} />
                  <p className="text-lg font-bold text-slate-900">{f.value}</p>
                  <p className="text-xs text-slate-500">{f.label}</p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-role-manager-light/50 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">View → Search Rate</p>
              <p className="text-2xl font-bold text-role-manager-primary">{latestRates['View→Search']}%</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">Search → Book Rate</p>
              <p className="text-2xl font-bold text-emerald-600">{latestRates['Search→Book']}%</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={conversionRate} margin={{ top: 0, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={(v) => [`${v ?? 0}%`, '']} />
              <Legend />
              <Bar dataKey="View→Search" fill="#2563EB" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Search→Book" fill="#10b981" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Cities + Pie */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Bookings by City</h2>
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
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [Number(v ?? 0).toLocaleString(), 'Bookings']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-3">
            {topCities.map((c, i) => (
              <div key={c.city} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                  <span className="text-slate-700 text-xs">{c.city}</span>
                </div>
                <span className="text-slate-500 text-xs font-medium">{c.share}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
