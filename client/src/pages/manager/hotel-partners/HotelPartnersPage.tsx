import { useMemo, useState } from 'react';
import {
  Users,
  Search,
  Eye,
  ShieldOff,
  Star,
  CheckCircle2,
  Clock,
  X,
  MapPin,
  Hotel,
  Mail,
  Phone,
  Copy,
  Building2,
  Loader2,
  Percent,
  CalendarDays,
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
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import { formatDate } from '@/utils/formatDate';
import { errorMessage } from '@/utils/errorMessage';
import { ActionMenu, type ActionItem } from '@/components/hotel-partner/shared/ActionMenu';
import { BookingActivitiesTab } from '@/components/manager/hotel-partners/BookingActivitiesTab';
import {
  usePlatformPartners,
  usePerformanceLeaderboard,
  useHotelPerformance,
} from '@/hooks/platform-manager';
import { useAdminHotels, useUpdateAdminHotelFlags } from '@/hooks/admin';
import type {
  PlatformPartner,
  PlatformPartnerStatus,
} from '@/types/platform-manager.types';
import type { AdminManagedHotel } from '@/types/admin.types';

type PartnerFilter = 'all' | PlatformPartnerStatus;
type TabId = 'partners' | 'hotels' | 'performance' | 'bookings';

// ─── Trạng thái đối tác (người) ──────────────────────────────────────────────
const partnerStatusConfig: Record<
  PlatformPartnerStatus,
  { label: string; class: string; icon: React.ComponentType<{ className?: string }> }
> = {
  approved: {
    label: 'Approved',
    class: 'bg-emerald-100 text-emerald-700',
    icon: CheckCircle2,
  },
  pending: {
    label: 'Pending',
    class: 'bg-amber-100 text-amber-700',
    icon: Clock,
  },
  suspended: {
    label: 'Suspended',
    class: 'bg-red-100 text-red-700',
    icon: ShieldOff,
  },
  rejected: {
    label: 'Rejected',
    class: 'bg-slate-200 text-slate-600',
    icon: XCircle,
  },
};

// ─── Chuẩn hoá chỉ số về thang điểm 0..100 (khớp trọng số & công thức của backend) ───
const ratingToScore = (r: number | null) =>
  r === null ? null : Math.round((r / 5) * 100);
const occupancyToScore = (o: number | null) =>
  o === null ? null : Math.round(o * 100);
const cancellationToScore = (c: number | null) =>
  c === null ? null : Math.round((1 - c) * 100);
const responseToScore = (m: number | null) => {
  if (m === null) return null;
  if (m <= 15) return 100;
  if (m >= 1440) return 0;
  return Math.round(100 * (1 - (m - 15) / (1440 - 15)));
};

const avgOf = (nums: (number | null)[]): number | null => {
  const vals = nums.filter((n): n is number => n !== null);
  if (!vals.length) return null;
  return vals.reduce((s, n) => s + n, 0) / vals.length;
};

/** Tỷ lệ 0..1 → "xx.x%". */
const fmtRate = (rate: number | null, digits = 1): string =>
  rate === null ? '—' : `${(rate * 100).toFixed(digits)}%`;

/** Thời gian phản hồi trung bình (phút) → "Xm" hoặc "X.Xh". */
const fmtResponse = (minutes: number | null): string => {
  if (minutes === null) return '—';
  if (minutes < 60) return `${Math.round(minutes)}m`;
  return `${(minutes / 60).toFixed(1)}h`;
};

const scoreColorClass = (score: number | null): string =>
  score === null
    ? 'text-slate-400'
    : score >= 80
      ? 'text-emerald-600'
      : score >= 60
        ? 'text-amber-600'
        : 'text-red-600';

function copyToClipboard(value: string, label: string) {
  navigator.clipboard
    .writeText(value)
    .then(() => toast.success(`${label} copied`))
    .catch(() => toast.error(`Could not copy ${label.toLowerCase()}`));
}

// ─── Trạng thái loading / error / empty dùng chung cho tab dữ liệu thật ───────
function TableStateRow({
  colSpan,
  children,
}: {
  colSpan: number;
  children: React.ReactNode;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-14 text-center">
        {children}
      </td>
    </tr>
  );
}

// ─── Summary Cards dùng chung ────────────────────────────────────────────────
function SummaryCards(
  cards: { label: string; value: number | string; color: string }[]
) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(c => (
        <div
          key={c.label}
          className="bg-white rounded-xl border border-slate-200 p-4 text-center"
        >
          <p className={cn('text-3xl font-bold', c.color)}>{c.value}</p>
          <p className="text-sm text-slate-500 mt-1">{c.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Partner Detail Modal (người đối tác) ────────────────────────────────────
function PartnerDetailModal({
  partner,
  onClose,
}: {
  partner: PlatformPartner;
  onClose: () => void;
}) {
  const cfg = partnerStatusConfig[partner.status];
  const StatusIcon = cfg.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-role-manager-light rounded-lg">
              <Users className="w-5 h-5 text-role-manager-primary" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">{partner.businessName}</h2>
              <p className="text-xs text-slate-500">
                {partner.owner?.fullName ?? partner.owner?.email ?? '—'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: 'Contact email',
                value: partner.contactEmail ?? '—',
                icon: Mail,
              },
              {
                label: 'Contact phone',
                value: partner.contactPhone ?? '—',
                icon: Phone,
              },
              {
                label: 'Hotels',
                value: String(partner._count.hotels),
                icon: Hotel,
              },
              {
                label: 'Commission',
                value: `${partner.commissionRate}%`,
                icon: Percent,
              },
              {
                label: 'Joined',
                value: formatDate(partner.createdAt),
                icon: CalendarDays,
              },
              {
                label: 'Approved',
                value: partner.approvedAt ? formatDate(partner.approvedAt) : '—',
                icon: CheckCircle2,
              },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="bg-slate-50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="w-3.5 h-3.5 text-slate-400" />
                    <p className="text-xs text-slate-500">{item.label}</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 wrap-break-word">
                    {item.value}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Status:</span>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full',
                cfg.class
              )}
            >
              <StatusIcon className="w-3 h-3" />
              {cfg.label}
            </span>
          </div>
        </div>

        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Partners (người đối tác) ───────────────────────────────────────────
function PartnersTab() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<PartnerFilter>('all');
  const [selected, setSelected] = useState<PlatformPartner | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = usePlatformPartners({
    limit: 100,
  });
  const all = useMemo(() => data?.results ?? [], [data]);

  const filtered = all.filter(p => {
    const q = search.toLowerCase();
    const matchSearch =
      p.businessName.toLowerCase().includes(q) ||
      (p.owner?.fullName?.toLowerCase().includes(q) ?? false) ||
      (p.owner?.email.toLowerCase().includes(q) ?? false) ||
      (p.contactEmail?.toLowerCase().includes(q) ?? false);
    const matchFilter = filter === 'all' || p.status === filter;
    return matchSearch && matchFilter;
  });

  const counts = {
    all: all.length,
    approved: all.filter(p => p.status === 'approved').length,
    pending: all.filter(p => p.status === 'pending').length,
    suspended: all.filter(p => p.status === 'suspended').length,
    rejected: all.filter(p => p.status === 'rejected').length,
  };

  return (
    <div className="space-y-4">
      {SummaryCards([
        { label: 'Total Partners', value: counts.all, color: 'text-role-manager-primary' },
        { label: 'Approved', value: counts.approved, color: 'text-emerald-600' },
        { label: 'Pending', value: counts.pending, color: 'text-amber-600' },
        { label: 'Suspended', value: counts.suspended, color: 'text-red-600' },
      ])}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {(['all', 'approved', 'pending', 'suspended'] as PartnerFilter[]).map(
              s => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={cn(
                    'px-4 py-1.5 rounded-full text-sm font-medium transition-all',
                    filter === s
                      ? 'bg-role-manager-primary text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                  <span
                    className={cn(
                      'ml-1.5 text-xs px-1.5 py-0.5 rounded-full',
                      filter === s ? 'bg-white/20' : 'bg-slate-200'
                    )}
                  >
                    {counts[s]}
                  </span>
                </button>
              )
            )}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search partner or owner..."
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
                {['Partner', 'Contact', 'Hotels', 'Commission', 'Joined', 'Status'].map(
                  h => (
                    <th
                      key={h}
                      className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  )
                )}
                <th className="text-right px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <TableStateRow colSpan={7}>
                  <Loader2 className="w-6 h-6 mx-auto animate-spin text-slate-300" />
                </TableStateRow>
              ) : isError ? (
                <TableStateRow colSpan={7}>
                  <p className="text-slate-500 mb-3">Could not load partners.</p>
                  <button
                    onClick={() => refetch()}
                    className="px-4 py-1.5 rounded-lg bg-role-manager-primary text-white text-sm font-medium"
                  >
                    Try again
                  </button>
                </TableStateRow>
              ) : filtered.length === 0 ? (
                <TableStateRow colSpan={7}>
                  <span className="text-slate-400">No partners found</span>
                </TableStateRow>
              ) : (
                filtered.map(p => {
                  const cfg = partnerStatusConfig[p.status];
                  const StatusIcon = cfg.icon;
                  const items: ActionItem[] = [
                    {
                      label: 'View details',
                      icon: Eye,
                      onClick: () => setSelected(p),
                    },
                  ];
                  if (p.contactEmail) {
                    items.push({
                      label: 'Copy email',
                      icon: Mail,
                      onClick: () =>
                        copyToClipboard(p.contactEmail as string, 'Email'),
                    });
                  }
                  if (p.contactPhone) {
                    items.push({
                      label: 'Copy phone',
                      icon: Phone,
                      onClick: () =>
                        copyToClipboard(p.contactPhone as string, 'Phone'),
                    });
                  }
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                      onClick={() => setSelected(p)}
                    >
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">
                          {p.businessName}
                        </p>
                        <p className="text-xs text-slate-400">
                          {p.owner?.fullName ?? p.owner?.email ?? '—'}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-slate-600">{p.contactEmail ?? '—'}</p>
                        <p className="text-xs text-slate-400">
                          {p.contactPhone ?? '—'}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                          <Hotel className="w-3.5 h-3.5 text-slate-400" />
                          {p._count.hotels}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-700 font-medium">
                        {p.commissionRate}%
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {formatDate(p.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full',
                            cfg.class
                          )}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end">
                          <ActionMenu
                            items={items}
                            vertical
                            triggerVariant="ghost"
                            label="Partner actions"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing {filtered.length} of {all.length} partners
            {isFetching && !isLoading ? ' · refreshing…' : ''}
          </span>
        </div>
      </div>

      {selected && (
        <PartnerDetailModal
          partner={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

// ─── Tab: Hotels Partner (khách sạn đã verify) ───────────────────────────────
type HotelFilter = 'all' | 'listed' | 'unlisted';

function HotelsPartnerTab() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<HotelFilter>('all');

  // "Đã verify" = khách sạn đã được duyệt (isActive = true).
  const { data, isLoading, isError, refetch, isFetching } = useAdminHotels({
    isActive: true,
    limit: 100,
  });
  const updateFlags = useUpdateAdminHotelFlags();
  const all = useMemo(() => data?.results ?? [], [data]);

  const filtered = all.filter(h => {
    const q = search.toLowerCase();
    const matchSearch =
      h.name.toLowerCase().includes(q) ||
      h.city.toLowerCase().includes(q) ||
      (h.partner?.businessName.toLowerCase().includes(q) ?? false);
    const matchFilter =
      filter === 'all' ||
      (filter === 'listed' && h.isListed) ||
      (filter === 'unlisted' && !h.isListed);
    return matchSearch && matchFilter;
  });

  const counts = {
    all: all.length,
    listed: all.filter(h => h.isListed).length,
    unlisted: all.filter(h => !h.isListed).length,
  };

  const toggleListing = (hotel: AdminManagedHotel) => {
    updateFlags.mutate(
      { hotelId: hotel.id, payload: { isListed: !hotel.isListed } },
      {
        onSuccess: () =>
          toast.success(
            hotel.isListed
              ? `${hotel.name} unlisted`
              : `${hotel.name} listed on platform`
          ),
        onError: err =>
          toast.error(errorMessage(err, 'Could not update the hotel')),
      }
    );
  };

  return (
    <div className="space-y-4">
      {SummaryCards([
        { label: 'Verified Hotels', value: counts.all, color: 'text-role-manager-primary' },
        { label: 'Listed', value: counts.listed, color: 'text-emerald-600' },
        { label: 'Unlisted', value: counts.unlisted, color: 'text-slate-500' },
        {
          label: 'Partners',
          value: new Set(all.map(h => h.partner?.id).filter(Boolean)).size,
          color: 'text-violet-600',
        },
      ])}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {(['all', 'listed', 'unlisted'] as HotelFilter[]).map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-sm font-medium transition-all',
                  filter === s
                    ? 'bg-role-manager-primary text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
                <span
                  className={cn(
                    'ml-1.5 text-xs px-1.5 py-0.5 rounded-full',
                    filter === s ? 'bg-white/20' : 'bg-slate-200'
                  )}
                >
                  {counts[s]}
                </span>
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search hotel, city or partner..."
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
                {['Hotel', 'City', 'Rating', 'Partner', 'Listing'].map(h => (
                  <th
                    key={h}
                    className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
                <th className="text-right px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <TableStateRow colSpan={6}>
                  <Loader2 className="w-6 h-6 mx-auto animate-spin text-slate-300" />
                </TableStateRow>
              ) : isError ? (
                <TableStateRow colSpan={6}>
                  <p className="text-slate-500 mb-3">Could not load hotels.</p>
                  <button
                    onClick={() => refetch()}
                    className="px-4 py-1.5 rounded-lg bg-role-manager-primary text-white text-sm font-medium"
                  >
                    Try again
                  </button>
                </TableStateRow>
              ) : filtered.length === 0 ? (
                <TableStateRow colSpan={6}>
                  <span className="text-slate-400">No hotels found</span>
                </TableStateRow>
              ) : (
                filtered.map(h => {
                  const items: ActionItem[] = [
                    {
                      label: h.isListed ? 'Unlist from platform' : 'List on platform',
                      icon: h.isListed ? ShieldOff : CheckCircle2,
                      onClick: () => toggleListing(h),
                      disabled: updateFlags.isPending,
                    },
                    {
                      label: 'Copy hotel ID',
                      icon: Copy,
                      onClick: () => copyToClipboard(h.id, 'Hotel ID'),
                    },
                  ];
                  return (
                    <tr
                      key={h.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-2 font-medium text-slate-800">
                          <span className="p-1.5 bg-role-manager-light rounded-lg">
                            <Building2 className="w-4 h-4 text-role-manager-primary" />
                          </span>
                          {h.name}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-1 text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {h.city}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {h.starRating ? (
                          <span className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            <span className="text-slate-700 font-medium">
                              {h.starRating}
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {h.partner?.businessName ?? '—'}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full',
                            h.isListed
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          )}
                        >
                          {h.isListed ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {h.isListed ? 'Listed' : 'Unlisted'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end">
                          <ActionMenu
                            items={items}
                            vertical
                            triggerVariant="ghost"
                            label="Hotel actions"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing {filtered.length} of {all.length} verified hotels
            {isFetching && !isLoading ? ' · refreshing…' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Platform Performance (bảng xếp hạng hiệu suất thật) ─────────────────
function HotelPerformanceModal({
  hotelId,
  onClose,
}: {
  hotelId: string;
  onClose: () => void;
}) {
  const { data, isLoading, isError } = useHotelPerformance(hotelId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-role-manager-light rounded-lg">
              <Activity className="w-5 h-5 text-role-manager-primary" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">
                {data?.hotelName ?? 'Hotel performance'}
              </h2>
              <p className="text-xs text-slate-500">
                {data ? `${data.city} · last 90 days` : 'Performance & score'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {isLoading ? (
            <div className="py-10 text-center">
              <Loader2 className="w-6 h-6 mx-auto animate-spin text-slate-300" />
            </div>
          ) : isError || !data ? (
            <p className="py-10 text-center text-slate-500">
              Could not load this hotel&apos;s performance.
            </p>
          ) : (
            <>
              {/* Composite score */}
              <div className="flex items-center justify-between bg-slate-50 rounded-xl p-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">
                    Composite score
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    rating 40% · occupancy 25% · cancel 20% · response 15%
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={cn(
                      'text-3xl font-bold',
                      scoreColorClass(data.score)
                    )}
                  >
                    {data.score ?? '—'}
                  </span>
                  <span className="text-sm text-slate-400">/100</span>
                </div>
              </div>

              {/* Component scores */}
              <div className="space-y-2.5">
                {(
                  [
                    ['Rating', data.scores.rating],
                    ['Occupancy', data.scores.occupancy],
                    ['Cancellation', data.scores.cancellation],
                    ['Response', data.scores.response],
                  ] as [string, number | null][]
                ).map(([label, val]) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="w-24 text-xs text-slate-500">{label}</span>
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-role-manager-primary rounded-full"
                        style={{ width: `${val ?? 0}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-sm font-medium text-slate-700">
                      {val ?? '—'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Raw metrics */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: 'Occupancy',
                    value: fmtRate(data.metrics.occupancyRate),
                  },
                  {
                    label: 'Cancellation',
                    value: fmtRate(data.metrics.cancellationRate),
                  },
                  {
                    label: 'Avg response',
                    value: fmtResponse(data.metrics.avgResponseMinutes),
                  },
                  {
                    label: 'Avg rating',
                    value:
                      data.metrics.avgRating !== null
                        ? `${data.metrics.avgRating.toFixed(2)} (${data.metrics.reviewCount})`
                        : '—',
                  },
                  {
                    label: 'Total bookings',
                    value: String(data.metrics.totalBookings),
                  },
                  {
                    label: 'Cancelled',
                    value: String(data.metrics.cancelledBookings),
                  },
                ].map(m => (
                  <div key={m.label} className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500">{m.label}</p>
                    <p className="text-sm font-semibold text-slate-800 mt-1">
                      {m.value}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function PlatformPerformanceTab() {
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  const { data, isLoading, isError, refetch, isFetching } =
    usePerformanceLeaderboard();

  const hotels = useMemo(() => data?.hotels ?? [], [data]);
  const rated = hotels.filter(h => h.score !== null);

  const avgOccupancy = avgOf(hotels.map(h => h.occupancyRate));
  const avgCancellation = avgOf(hotels.map(h => h.cancellationRate));
  const avgResponse = avgOf(hotels.map(h => h.avgResponseMinutes));
  const avgRating = avgOf(hotels.map(h => h.avgRating));

  const occupancyData = rated.slice(0, 8).map(h => ({
    name: h.hotelName,
    occupancy: h.occupancyRate !== null ? Math.round(h.occupancyRate * 100) : 0,
    cancellation:
      h.cancellationRate !== null ? Math.round(h.cancellationRate * 100) : 0,
  }));

  const radarData = [
    { metric: 'Occupancy', value: occupancyToScore(avgOccupancy) ?? 0 },
    { metric: 'Rating', value: ratingToScore(avgRating) ?? 0 },
    { metric: 'Response', value: responseToScore(avgResponse) ?? 0 },
    { metric: 'Retention', value: cancellationToScore(avgCancellation) ?? 0 },
  ];

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 py-20 text-center">
        <Loader2 className="w-7 h-7 mx-auto animate-spin text-slate-300" />
      </div>
    );
  }
  if (isError) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
        <p className="text-slate-500 mb-3">
          Could not load platform performance.
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-1.5 rounded-lg bg-role-manager-primary text-white text-sm font-medium"
        >
          Try again
        </button>
      </div>
    );
  }

  const kpis = [
    {
      label: 'Avg Occupancy Rate',
      value: fmtRate(avgOccupancy),
      icon: BarChart3,
      color: 'text-role-manager-primary',
      bg: 'bg-role-manager-light',
      good: (avgOccupancy ?? 0) >= 0.7,
    },
    {
      label: 'Avg Cancellation Rate',
      value: fmtRate(avgCancellation),
      icon: XCircle,
      color: 'text-red-500',
      bg: 'bg-red-50',
      good: (avgCancellation ?? 1) < 0.1,
    },
    {
      label: 'Avg Response Time',
      value: fmtResponse(avgResponse),
      icon: Timer,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      good: (avgResponse ?? Infinity) < 240,
    },
    {
      label: 'Avg Guest Rating',
      value: avgRating !== null ? avgRating.toFixed(2) : '—',
      icon: Star,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
      good: (avgRating ?? 0) >= 4.0,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Platform-wide KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => {
          const Icon = k.icon;
          return (
            <div
              key={k.label}
              className="bg-white rounded-xl border border-slate-200 p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={cn('p-2 rounded-lg', k.bg)}>
                  <Icon className={cn('w-5 h-5', k.color)} />
                </div>
                <span
                  className={cn(
                    'text-xs font-semibold px-2 py-0.5 rounded-full',
                    k.good
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-600'
                  )}
                >
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
          <h2 className="font-semibold text-slate-900 mb-1">
            Occupancy vs Cancellation Rate
          </h2>
          <p className="text-xs text-slate-400 mb-5">Top hotels with data</p>
          {occupancyData.length === 0 ? (
            <div className="h-55 flex items-center justify-center text-sm text-slate-400">
              Not enough data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={occupancyData}
                margin={{ top: 0, right: 5, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  tickFormatter={(v: string) =>
                    v.length > 14 ? `${v.slice(0, 14)}…` : v
                  }
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `${v}%`}
                />
                <Tooltip formatter={v => [`${v ?? 0}%`, '']} />
                <Legend />
                <Bar
                  dataKey="occupancy"
                  fill="#2563EB"
                  radius={[4, 4, 0, 0]}
                  name="Occupancy %"
                />
                <Bar
                  dataKey="cancellation"
                  fill="#f87171"
                  radius={[4, 4, 0, 0]}
                  name="Cancellation %"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Radar Chart — platform health */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-1">
            Platform Health Score
          </h2>
          <p className="text-xs text-slate-400 mb-5">
            Average normalized score across dimensions
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart cx="50%" cy="50%" outerRadius={80} data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fontSize: 12, fill: '#64748b' }}
              />
              <Radar
                name="Platform"
                dataKey="value"
                stroke="#2563EB"
                fill="#2563EB"
                fillOpacity={0.15}
                strokeWidth={2}
              />
              <Tooltip formatter={v => [`${v ?? 0}/100`, '']} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Leaderboard table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-2">
          <Activity className="w-5 h-5 text-role-manager-primary" />
          <h2 className="font-semibold text-slate-900">
            Performance Leaderboard
          </h2>
          <span className="ml-auto text-xs text-slate-400">
            {hotels.length} hotels{isFetching ? ' · refreshing…' : ''}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {[
                  '#',
                  'Hotel',
                  'Occupancy',
                  'Cancellation',
                  'Response',
                  'Rating',
                  'Score',
                ].map(h => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {hotels.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No hotels to rank yet
                  </td>
                </tr>
              ) : (
                hotels.map((h, i) => (
                  <tr
                    key={h.hotelId}
                    className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                    onClick={() => setSelectedHotelId(h.hotelId)}
                  >
                    <td className="px-5 py-3.5 text-slate-400 font-medium">
                      {i + 1}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-800">{h.hotelName}</p>
                      <p className="text-xs text-slate-400">{h.city}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-role-manager-primary rounded-full"
                            style={{
                              width: `${
                                h.occupancyRate !== null
                                  ? Math.round(h.occupancyRate * 100)
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium text-slate-700">
                          {fmtRate(h.occupancyRate, 0)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          'font-medium',
                          h.cancellationRate === null
                            ? 'text-slate-400'
                            : h.cancellationRate > 0.15
                              ? 'text-red-600'
                              : h.cancellationRate > 0.08
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                        )}
                      >
                        {fmtRate(h.cancellationRate, 1)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          'font-medium',
                          h.avgResponseMinutes === null
                            ? 'text-slate-400'
                            : h.avgResponseMinutes > 240
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                        )}
                      >
                        {fmtResponse(h.avgResponseMinutes)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {h.avgRating !== null ? (
                        <span className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span className="font-medium text-slate-700">
                            {h.avgRating.toFixed(1)}
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          'text-lg font-bold',
                          scoreColorClass(h.score)
                        )}
                      >
                        {h.score ?? '—'}
                      </span>
                      {h.score !== null && (
                        <span className="text-xs text-slate-400">/100</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedHotelId && (
        <HotelPerformanceModal
          hotelId={selectedHotelId}
          onClose={() => setSelectedHotelId(null)}
        />
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
const TABS: {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'partners', label: 'Partners', icon: Users },
  { id: 'hotels', label: 'Hotels Partner', icon: Building2 },
  { id: 'performance', label: 'Platform Performance', icon: Activity },
  { id: 'bookings', label: 'Booking Activities', icon: CalendarCheck },
];

export default function HotelPartnersPage() {
  const [activeTab, setActiveTab] = useState<TabId>('partners');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-role-manager-light rounded-lg">
            <Users className="w-6 h-6 text-role-manager-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Hotel Partners
            </h1>
            <p className="text-slate-500 text-sm">
              Monitor partner activity, platform performance, and booking
              operations
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-5 border-b border-slate-100 overflow-x-auto hide-scrollbar">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all border-b-2 -mb-px whitespace-nowrap',
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
      {activeTab === 'partners' && <PartnersTab />}
      {activeTab === 'hotels' && <HotelsPartnerTab />}
      {activeTab === 'performance' && <PlatformPerformanceTab />}
      {activeTab === 'bookings' && <BookingActivitiesTab />}
    </div>
  );
}
