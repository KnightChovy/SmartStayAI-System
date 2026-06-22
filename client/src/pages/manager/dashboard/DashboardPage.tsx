import {
  Hotel,
  Users,
  CalendarCheck,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Link } from 'react-router';
import { cn } from '@/lib/cn';

const stats = [
  {
    label: 'Total Hotel Partners',
    value: '142',
    change: '+8',
    up: true,
    icon: Hotel,
    color: 'text-role-manager-primary',
    bg: 'bg-role-manager-light',
  },
  {
    label: 'Active Users',
    value: '18,450',
    change: '+1,230',
    up: true,
    icon: Users,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    label: 'Bookings This Month',
    value: '3,812',
    change: '+412',
    up: true,
    icon: CalendarCheck,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
  {
    label: 'Platform Revenue',
    value: '₫4.2B',
    change: '-2.1%',
    up: false,
    icon: TrendingUp,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
];

const recentVerifications = [
  { id: 'VR-001', name: 'Mường Thanh Grand Hà Nội', submitted: '2026-06-10', status: 'pending' },
  { id: 'VR-002', name: 'Vinpearl Resort Phú Quốc', submitted: '2026-06-09', status: 'approved' },
  { id: 'VR-003', name: 'Marriott Đà Nẵng', submitted: '2026-06-08', status: 'rejected' },
  { id: 'VR-004', name: 'Rex Hotel Sài Gòn', submitted: '2026-06-08', status: 'pending' },
];

const recentAlerts = [
  { id: 1, partner: 'Liberty Central Hotel', issue: 'Multiple guest complaints (4)', severity: 'high' },
  { id: 2, partner: 'Palace Hotel Huế', issue: 'Booking cancellation rate >30%', severity: 'medium' },
  { id: 3, partner: 'Gold Coast Hotel', issue: 'Incomplete profile for 14 days', severity: 'low' },
];

const statusConfig = {
  pending: { label: 'Pending', class: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Approved', class: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Rejected', class: 'bg-red-100 text-red-700' },
};

const severityConfig = {
  high: { class: 'bg-red-100 text-red-700', icon: XCircle },
  medium: { class: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
  low: { class: 'bg-slate-100 text-slate-600', icon: Clock },
};

export default function ManagerDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Platform Overview</h1>
            <p className="text-slate-500 text-sm mt-1">Monitor and manage the SmartStay AI platform</p>
          </div>
          <span className="text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            June 2026
          </span>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={cn('p-2 rounded-lg', s.bg)}>
                  <Icon className={cn('w-5 h-5', s.color)} />
                </div>
                <span className={cn('flex items-center gap-0.5 text-xs font-semibold', s.up ? 'text-emerald-600' : 'text-red-500')}>
                  {s.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {s.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Verification Requests */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-role-manager-primary" />
              <h2 className="font-semibold text-slate-900">Recent Verifications</h2>
            </div>
            <Link
              to="/manager/verification"
              className="text-xs text-role-manager-primary font-medium hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {recentVerifications.map(v => {
              const cfg = statusConfig[v.status as keyof typeof statusConfig];
              return (
                <div key={v.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{v.name}</p>
                    <p className="text-xs text-slate-400">{v.id} · {v.submitted}</p>
                  </div>
                  <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', cfg.class)}>
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Policy Violation Alerts */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="font-semibold text-slate-900">Policy Violation Alerts</h2>
            </div>
            <Link
              to="/manager/hotel-partners"
              className="text-xs text-role-manager-primary font-medium hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {recentAlerts.map(a => {
              const cfg = severityConfig[a.severity as keyof typeof severityConfig];
              const AlertIcon = cfg.icon;
              return (
                <div key={a.id} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
                  <div className={cn('p-1.5 rounded-lg mt-0.5 shrink-0', cfg.class)}>
                    <AlertIcon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{a.partner}</p>
                    <p className="text-xs text-slate-500">{a.issue}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Review Pending', sub: '2 awaiting', href: '/manager/verification', icon: ShieldCheck, color: 'text-role-manager-primary', bg: 'bg-role-manager-light' },
            { label: 'Monitor Partners', sub: '142 active', href: '/manager/hotel-partners', icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' },
            { label: 'Platform Revenue', sub: 'This month', href: '/manager/revenue', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Growth Analytics', sub: 'View metrics', href: '/manager/analytics', icon: CheckCircle2, color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map(q => {
            const Icon = q.icon;
            return (
              <Link
                key={q.label}
                to={q.href}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-100 hover:border-role-manager-primary/30 hover:bg-role-manager-light/30 transition-all group"
              >
                <div className={cn('p-2.5 rounded-xl', q.bg)}>
                  <Icon className={cn('w-5 h-5', q.color)} />
                </div>
                <p className="text-sm font-semibold text-slate-800 group-hover:text-role-manager-primary text-center">{q.label}</p>
                <p className="text-xs text-slate-400">{q.sub}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
