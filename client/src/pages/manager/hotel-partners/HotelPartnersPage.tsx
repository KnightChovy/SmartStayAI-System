import { useState } from 'react';
import {
  Users,
  Search,
  Eye,
  ShieldOff,
  ShieldCheck,
  Star,
  AlertTriangle,
  CheckCircle2,
  Clock,
  X,
  MapPin,
  Hotel,
  CalendarDays,
  TrendingUp,
  ChevronDown,
  BarChart3,
  Activity,
  Timer,
  XCircle,
  CalendarCheck,
  ChevronRight,
} from 'lucide-react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';

type PartnerStatus = 'all' | 'active' | 'suspended' | 'pending';
type TabId = 'partners' | 'performance' | 'bookings';

interface HotelPartner {
  id: string;
  ownerName: string;
  hotelName: string;
  location: string;
  joinedAt: string;
  status: 'active' | 'suspended' | 'pending';
  totalBookings: number;
  rating: number;
  violations: number;
  monthlyRevenue: string;
  occupancyRate: number;
  cancellationRate: number;
  responseTimeHrs: number;
}

interface BookingActivity {
  id: string;
  partnerId: string;
  hotelName: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  amount: string;
  status: 'confirmed' | 'cancelled' | 'completed' | 'pending';
  createdAt: string;
}

const mockPartners: HotelPartner[] = [
  { id: 'HP-001', ownerName: 'Nguyễn Văn Minh', hotelName: 'Mường Thanh Grand', location: 'Hà Nội', joinedAt: '2025-03-10', status: 'active', totalBookings: 1240, rating: 4.7, violations: 0, monthlyRevenue: '₫320M', occupancyRate: 82, cancellationRate: 4.2, responseTimeHrs: 1.2 },
  { id: 'HP-002', ownerName: 'Trần Thị Lan', hotelName: 'Vinpearl Resort PQ', location: 'Kiên Giang', joinedAt: '2025-04-05', status: 'active', totalBookings: 2810, rating: 4.9, violations: 0, monthlyRevenue: '₫890M', occupancyRate: 91, cancellationRate: 2.1, responseTimeHrs: 0.8 },
  { id: 'HP-003', ownerName: 'Lê Quốc Hùng', hotelName: 'Palace Hotel Huế', location: 'Thừa Thiên Huế', joinedAt: '2025-05-18', status: 'suspended', totalBookings: 430, rating: 3.2, violations: 4, monthlyRevenue: '₫45M', occupancyRate: 38, cancellationRate: 31.5, responseTimeHrs: 18.4 },
  { id: 'HP-004', ownerName: 'Phạm Thị Thu', hotelName: 'Rex Hotel Sài Gòn', location: 'TP.HCM', joinedAt: '2025-06-01', status: 'active', totalBookings: 980, rating: 4.5, violations: 1, monthlyRevenue: '₫270M', occupancyRate: 74, cancellationRate: 8.7, responseTimeHrs: 2.1 },
  { id: 'HP-005', ownerName: 'Hoàng Văn Nam', hotelName: 'Gold Coast Hotel', location: 'Đà Nẵng', joinedAt: '2025-07-14', status: 'active', totalBookings: 620, rating: 4.1, violations: 2, monthlyRevenue: '₫180M', occupancyRate: 65, cancellationRate: 12.3, responseTimeHrs: 3.8 },
  { id: 'HP-006', ownerName: 'Vũ Minh Khoa', hotelName: 'Caravelle Saigon', location: 'TP.HCM', joinedAt: '2025-08-22', status: 'pending', totalBookings: 0, rating: 0, violations: 0, monthlyRevenue: '—', occupancyRate: 0, cancellationRate: 0, responseTimeHrs: 0 },
];

const mockBookings: BookingActivity[] = [
  { id: 'BK-2841', partnerId: 'HP-002', hotelName: 'Vinpearl Resort PQ', guestName: 'Nguyễn Thị Hoa', checkIn: '2026-06-15', checkOut: '2026-06-18', amount: '₫8,400,000', status: 'confirmed', createdAt: '2026-06-11' },
  { id: 'BK-2840', partnerId: 'HP-001', hotelName: 'Mường Thanh Grand', guestName: 'Trần Văn Bình', checkIn: '2026-06-12', checkOut: '2026-06-14', amount: '₫3,200,000', status: 'confirmed', createdAt: '2026-06-11' },
  { id: 'BK-2839', partnerId: 'HP-004', hotelName: 'Rex Hotel Sài Gòn', guestName: 'Lê Minh Tuấn', checkIn: '2026-06-20', checkOut: '2026-06-22', amount: '₫5,600,000', status: 'pending', createdAt: '2026-06-11' },
  { id: 'BK-2838', partnerId: 'HP-003', hotelName: 'Palace Hotel Huế', guestName: 'Phạm Thị Loan', checkIn: '2026-06-10', checkOut: '2026-06-11', amount: '₫1,800,000', status: 'cancelled', createdAt: '2026-06-10' },
  { id: 'BK-2837', partnerId: 'HP-005', hotelName: 'Gold Coast Hotel', guestName: 'Võ Văn Dũng', checkIn: '2026-06-08', checkOut: '2026-06-10', amount: '₫4,100,000', status: 'completed', createdAt: '2026-06-09' },
  { id: 'BK-2836', partnerId: 'HP-002', hotelName: 'Vinpearl Resort PQ', guestName: 'Đặng Thị Mai', checkIn: '2026-06-18', checkOut: '2026-06-25', amount: '₫19,600,000', status: 'confirmed', createdAt: '2026-06-09' },
  { id: 'BK-2835', partnerId: 'HP-001', hotelName: 'Mường Thanh Grand', guestName: 'Hoàng Văn Tùng', checkIn: '2026-06-07', checkOut: '2026-06-09', amount: '₫2,900,000', status: 'completed', createdAt: '2026-06-08' },
  { id: 'BK-2834', partnerId: 'HP-004', hotelName: 'Rex Hotel Sài Gòn', guestName: 'Bùi Thị Hương', checkIn: '2026-06-05', checkOut: '2026-06-07', amount: '₫4,800,000', status: 'cancelled', createdAt: '2026-06-07' },
];

const statusConfig = {
  active: { label: 'Active', class: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  suspended: { label: 'Suspended', class: 'bg-red-100 text-red-700', icon: ShieldOff },
  pending: { label: 'Pending', class: 'bg-amber-100 text-amber-700', icon: Clock },
};

const bookingStatusConfig = {
  confirmed: { label: 'Confirmed', class: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Cancelled', class: 'bg-red-100 text-red-700' },
  completed: { label: 'Completed', class: 'bg-blue-100 text-blue-700' },
  pending: { label: 'Pending', class: 'bg-amber-100 text-amber-700' },
};

const occupancyData = mockPartners
  .filter(p => p.status === 'active')
  .map(p => ({ name: p.hotelName.split(' ').slice(0, 2).join(' '), occupancy: p.occupancyRate, cancellation: p.cancellationRate }));

const radarData = [
  { metric: 'Occupancy', value: 76 },
  { metric: 'Rating', value: 88 },
  { metric: 'Response', value: 72 },
  { metric: 'Retention', value: 64 },
  { metric: 'Revenue', value: 80 },
];

// ─── Partner Detail Modal ────────────────────────────────────────────────────
function PartnerDetailModal({ partner, onClose, onSuspend, onActivate }: {
  partner: HotelPartner;
  onClose: () => void;
  onSuspend: (id: string) => void;
  onActivate: (id: string) => void;
}) {
  const [suspendReason, setSuspendReason] = useState('');
  const [showSuspendForm, setShowSuspendForm] = useState(false);
  const cfg = statusConfig[partner.status];
  const StatusIcon = cfg.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-role-manager-light rounded-lg">
              <Hotel className="w-5 h-5 text-role-manager-primary" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">{partner.hotelName}</h2>
              <p className="text-xs text-slate-500">{partner.id} · {partner.ownerName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Location', value: partner.location, icon: MapPin },
              { label: 'Joined', value: partner.joinedAt, icon: CalendarDays },
              { label: 'Total Bookings', value: partner.totalBookings.toLocaleString(), icon: CalendarDays },
              { label: 'Monthly Revenue', value: partner.monthlyRevenue, icon: TrendingUp },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="bg-slate-50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="w-3.5 h-3.5 text-slate-400" />
                    <p className="text-xs text-slate-500">{item.label}</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-800">{item.value}</p>
                </div>
              );
            })}
          </div>

          {/* Performance metrics in modal */}
          {partner.status === 'active' && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Performance</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-role-manager-primary">{partner.occupancyRate}%</p>
                  <p className="text-xs text-slate-500">Occupancy</p>
                </div>
                <div className={cn('rounded-xl p-3 text-center', partner.cancellationRate > 15 ? 'bg-red-50' : 'bg-slate-50')}>
                  <p className={cn('text-lg font-bold', partner.cancellationRate > 15 ? 'text-red-600' : 'text-slate-800')}>{partner.cancellationRate}%</p>
                  <p className="text-xs text-slate-500">Cancellation</p>
                </div>
                <div className={cn('rounded-xl p-3 text-center', partner.responseTimeHrs > 4 ? 'bg-amber-50' : 'bg-slate-50')}>
                  <p className={cn('text-lg font-bold', partner.responseTimeHrs > 4 ? 'text-amber-600' : 'text-slate-800')}>{partner.responseTimeHrs}h</p>
                  <p className="text-xs text-slate-500">Response</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="font-semibold text-slate-800">{partner.rating > 0 ? partner.rating : 'N/A'}</span>
            </div>
            <div className={cn('flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full', partner.violations > 2 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600')}>
              <AlertTriangle className="w-3 h-3" />{partner.violations} violation{partner.violations !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Status:</span>
            <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full', cfg.class)}>
              <StatusIcon className="w-3 h-3" />{cfg.label}
            </span>
          </div>

          {showSuspendForm && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-red-700">Reason for suspension</p>
              <textarea
                value={suspendReason}
                onChange={e => setSuspendReason(e.target.value)}
                placeholder="Describe the policy violation..."
                className="w-full text-sm border border-red-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                rows={3}
              />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 text-xs" onClick={() => setShowSuspendForm(false)}>Cancel</Button>
                <Button
                  className="flex-1 text-xs bg-red-600 hover:bg-red-700 text-white"
                  disabled={!suspendReason.trim()}
                  onClick={() => { onSuspend(partner.id); onClose(); }}
                >
                  Confirm Suspension
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 pt-0">
          {partner.status === 'active' && !showSuspendForm && (
            <Button
              onClick={() => setShowSuspendForm(true)}
              variant="outline"
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
            >
              <ShieldOff className="w-4 h-4 mr-2" /> Suspend Partner
            </Button>
          )}
          {partner.status === 'suspended' && (
            <Button
              onClick={() => { onActivate(partner.id); onClose(); }}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <ShieldCheck className="w-4 h-4 mr-2" /> Reinstate Partner
            </Button>
          )}
          {!showSuspendForm && (
            <Button onClick={onClose} variant="outline" className="flex-1">Close</Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Partners ───────────────────────────────────────────────────────────
function PartnersTab({ partners, onSelect, onActivate }: {
  partners: HotelPartner[];
  onSelect: (p: HotelPartner) => void;
  onActivate: (id: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<PartnerStatus>('all');

  const all = partners;
  const filtered = all.filter(p => {
    const matchSearch = p.hotelName.toLowerCase().includes(search.toLowerCase()) ||
      p.ownerName.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || p.status === filter;
    return matchSearch && matchFilter;
  });

  const counts = {
    all: all.length,
    active: all.filter(p => p.status === 'active').length,
    suspended: all.filter(p => p.status === 'suspended').length,
    pending: all.filter(p => p.status === 'pending').length,
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Partners', value: counts.all, color: 'text-role-manager-primary', bg: 'bg-role-manager-light' },
          { label: 'Active', value: counts.active, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Suspended', value: counts.suspended, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Pending Approval', value: counts.pending, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className={cn('text-3xl font-bold', c.color)}>{c.value}</p>
            <p className="text-sm text-slate-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {(['all', 'active', 'suspended', 'pending'] as PartnerStatus[]).map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-sm font-medium transition-all',
                  filter === s ? 'bg-role-manager-primary text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
                <span className={cn('ml-1.5 text-xs px-1.5 py-0.5 rounded-full', filter === s ? 'bg-white/20' : 'bg-slate-200')}>
                  {counts[s]}
                </span>
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search partner or hotel..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-role-manager-primary/30 focus:border-role-manager-primary"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Partner</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Location</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Bookings</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Rating</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Violations</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Status</th>
                <th className="text-right px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">No partners found</td></tr>
              ) : filtered.map(p => {
                const cfg = statusConfig[p.status];
                const StatusIcon = cfg.icon;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-800">{p.hotelName}</p>
                      <p className="text-xs text-slate-400">{p.ownerName}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />{p.location}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-700 font-medium">{p.totalBookings.toLocaleString()}</td>
                    <td className="px-5 py-4">
                      {p.rating > 0 ? (
                        <span className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span className="text-slate-700 font-medium">{p.rating}</span>
                        </span>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn(
                        'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
                        p.violations > 2 ? 'bg-red-100 text-red-700' : p.violations > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                      )}>
                        {p.violations > 0 && <AlertTriangle className="w-3 h-3" />}
                        {p.violations}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full', cfg.class)}>
                        <StatusIcon className="w-3 h-3" />{cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => onSelect(p)} className="p-1.5 rounded-lg text-slate-400 hover:text-role-manager-primary hover:bg-role-manager-light transition-colors" title="View details">
                          <Eye className="w-4 h-4" />
                        </button>
                        {p.status === 'active' && (
                          <button onClick={() => onSelect(p)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Suspend">
                            <ShieldOff className="w-4 h-4" />
                          </button>
                        )}
                        {p.status === 'suspended' && (
                          <button onClick={() => onActivate(p.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="Reinstate">
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>Showing {filtered.length} of {all.length} partners</span>
          <div className="flex items-center gap-1"><span>Rows per page: 10</span><ChevronDown className="w-3 h-3" /></div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Platform Performance ───────────────────────────────────────────────
function PlatformPerformanceTab({ partners }: { partners: HotelPartner[] }) {
  const active = partners.filter(p => p.status === 'active');
  const avgOccupancy = (active.reduce((s, p) => s + p.occupancyRate, 0) / active.length).toFixed(1);
  const avgCancellation = (active.reduce((s, p) => s + p.cancellationRate, 0) / active.length).toFixed(1);
  const avgResponse = (active.reduce((s, p) => s + p.responseTimeHrs, 0) / active.length).toFixed(1);
  const avgRating = (active.reduce((s, p) => s + p.rating, 0) / active.length).toFixed(2);

  return (
    <div className="space-y-6">
      {/* Platform-wide KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Avg Occupancy Rate', value: `${avgOccupancy}%`, icon: BarChart3, color: 'text-role-manager-primary', bg: 'bg-role-manager-light', good: Number(avgOccupancy) >= 70 },
          { label: 'Avg Cancellation Rate', value: `${avgCancellation}%`, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', good: Number(avgCancellation) < 10 },
          { label: 'Avg Response Time', value: `${avgResponse}h`, icon: Timer, color: 'text-violet-600', bg: 'bg-violet-50', good: Number(avgResponse) < 4 },
          { label: 'Avg Guest Rating', value: avgRating, icon: Star, color: 'text-amber-500', bg: 'bg-amber-50', good: Number(avgRating) >= 4.0 },
        ].map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={cn('p-2 rounded-lg', k.bg)}>
                  <Icon className={cn('w-5 h-5', k.color)} />
                </div>
                <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', k.good ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600')}>
                  {k.good ? '● Good' : '● Needs attention'}
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{k.value}</p>
              <p className="text-xs text-slate-500 mt-1">{k.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Occupancy vs Cancellation by Hotel */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-1">Occupancy vs Cancellation Rate</h2>
          <p className="text-xs text-slate-400 mb-5">By active hotel partner</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={occupancyData} margin={{ top: 0, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={(v) => [`${v ?? 0}%`, '']} />
              <Legend />
              <Bar dataKey="occupancy" fill="#2563EB" radius={[4, 4, 0, 0]} name="Occupancy %" />
              <Bar dataKey="cancellation" fill="#f87171" radius={[4, 4, 0, 0]} name="Cancellation %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar Chart — platform health */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-1">Platform Health Score</h2>
          <p className="text-xs text-slate-400 mb-5">Aggregate performance across all dimensions</p>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart cx="50%" cy="50%" outerRadius={80} data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: '#64748b' }} />
              <Radar name="Platform" dataKey="value" stroke="#2563EB" fill="#2563EB" fillOpacity={0.15} strokeWidth={2} />
              <Tooltip formatter={(v) => [`${v ?? 0}/100`, '']} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per-partner performance table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-2">
          <Activity className="w-5 h-5 text-role-manager-primary" />
          <h2 className="font-semibold text-slate-900">Performance by Partner</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-5 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Hotel</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Occupancy</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Cancellation</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Response Time</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Rating</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {active.map(p => {
                const score = Math.round((p.occupancyRate * 0.4) + ((100 - p.cancellationRate * 2) * 0.3) + (p.rating * 10 * 0.2) + ((10 - Math.min(p.responseTimeHrs, 10)) * 10 * 0.1));
                const scoreColor = score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-red-600';
                return (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-800">{p.hotelName}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-role-manager-primary rounded-full" style={{ width: `${p.occupancyRate}%` }} />
                        </div>
                        <span className="text-sm font-medium text-slate-700">{p.occupancyRate}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={cn('font-medium', p.cancellationRate > 15 ? 'text-red-600' : p.cancellationRate > 8 ? 'text-amber-600' : 'text-emerald-600')}>
                        {p.cancellationRate}%
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={cn('font-medium', p.responseTimeHrs > 4 ? 'text-amber-600' : 'text-emerald-600')}>
                        {p.responseTimeHrs}h
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="font-medium text-slate-700">{p.rating}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={cn('text-lg font-bold', scoreColor)}>{score}</span>
                      <span className="text-xs text-slate-400">/100</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Booking Activities ─────────────────────────────────────────────────
function BookingActivitiesTab({ bookings, partners }: { bookings: BookingActivity[]; partners: HotelPartner[] }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'cancelled' | 'completed' | 'pending'>('all');
  const [partnerFilter, setPartnerFilter] = useState<string>('all');

  const filtered = bookings.filter(b => {
    const matchSearch = b.guestName.toLowerCase().includes(search.toLowerCase()) ||
      b.id.toLowerCase().includes(search.toLowerCase()) ||
      b.hotelName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    const matchPartner = partnerFilter === 'all' || b.partnerId === partnerFilter;
    return matchSearch && matchStatus && matchPartner;
  });

  const counts = {
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    pending: bookings.filter(b => b.status === 'pending').length,
  };

  return (
    <div className="space-y-4">
      {/* Booking Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Confirmed', value: counts.confirmed, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Completed', value: counts.completed, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Pending', value: counts.pending, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Cancelled', value: counts.cancelled, color: 'text-red-600', bg: 'bg-red-50' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className={cn('text-3xl font-bold', c.color)}>{c.value}</p>
            <p className="text-sm text-slate-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 min-w-50">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search booking ID, guest, hotel..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-role-manager-primary/30 focus:border-role-manager-primary"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-600 focus:outline-none focus:ring-2 focus:ring-role-manager-primary/30"
          >
            <option value="all">All statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={partnerFilter}
            onChange={e => setPartnerFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-600 focus:outline-none focus:ring-2 focus:ring-role-manager-primary/30"
          >
            <option value="all">All hotels</option>
            {partners.filter(p => p.status === 'active').map(p => (
              <option key={p.id} value={p.id}>{p.hotelName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Booking Activity Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-2">
          <CalendarCheck className="w-5 h-5 text-role-manager-primary" />
          <h2 className="font-semibold text-slate-900">Recent Booking Activities</h2>
          <span className="ml-auto text-xs text-slate-400">{filtered.length} bookings</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-5 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Booking ID</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Hotel</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Guest</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Check-in</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Check-out</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Amount</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-slate-400">No bookings found</td></tr>
              ) : filtered.map(b => {
                const cfg = bookingStatusConfig[b.status];
                return (
                  <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-role-manager-primary">{b.id}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-800 max-w-[160px] truncate">{b.hotelName}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">{b.guestName}</td>
                    <td className="px-5 py-3.5 text-slate-600">{b.checkIn}</td>
                    <td className="px-5 py-3.5 text-slate-600">{b.checkOut}</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">{b.amount}</td>
                    <td className="px-5 py-3.5">
                      <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', cfg.class)}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">{b.createdAt}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>Showing {filtered.length} of {bookings.length} bookings</span>
          <div className="flex items-center gap-1"><span>Rows per page: 10</span><ChevronDown className="w-3 h-3" /></div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'partners', label: 'Partners', icon: Users },
  { id: 'performance', label: 'Platform Performance', icon: Activity },
  { id: 'bookings', label: 'Booking Activities', icon: CalendarCheck },
];

export default function HotelPartnersPage() {
  const [activeTab, setActiveTab] = useState<TabId>('partners');
  const [partners, setPartners] = useState(mockPartners);
  const [selected, setSelected] = useState<HotelPartner | null>(null);

  const handleSuspend = (id: string) => setPartners(prev =>
    prev.map(p => p.id === id ? { ...p, status: 'suspended' as const } : p)
  );
  const handleActivate = (id: string) => setPartners(prev =>
    prev.map(p => p.id === id ? { ...p, status: 'active' as const } : p)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-role-manager-light rounded-lg">
            <Users className="w-6 h-6 text-role-manager-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Hotel Partners</h1>
            <p className="text-slate-500 text-sm">Monitor partner activity, platform performance, and booking operations</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-5 border-b border-slate-100">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all border-b-2 -mb-px',
                  activeTab === t.id
                    ? 'border-role-manager-primary text-role-manager-primary bg-role-manager-light/30'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                )}
              >
                <Icon className="w-4 h-4" />
                {t.label}
                {t.id === 'partners' && (
                  <ChevronRight className="w-3 h-3 opacity-40" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'partners' && (
        <PartnersTab
          partners={partners}
          onSelect={setSelected}
          onActivate={handleActivate}
        />
      )}
      {activeTab === 'performance' && (
        <PlatformPerformanceTab partners={partners} />
      )}
      {activeTab === 'bookings' && (
        <BookingActivitiesTab bookings={mockBookings} partners={partners} />
      )}

      {selected && (
        <PartnerDetailModal
          partner={selected}
          onClose={() => setSelected(null)}
          onSuspend={handleSuspend}
          onActivate={handleActivate}
        />
      )}
    </div>
  );
}
