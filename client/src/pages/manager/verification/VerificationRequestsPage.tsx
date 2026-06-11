import { useState } from 'react';
import {
  ShieldCheck,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Building2,
  MapPin,
  CalendarDays,
  FileText,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import {
  useListRegistrations,
  useReviewRegistration,
} from '@/hooks/manager/useManagerVerification';
import type {
  HotelVerificationRequestSummary,
  VerificationStatus,
} from '@/types/manager.types';

const statusConfig = {
  pending: { label: 'Pending', icon: Clock, class: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
  in_review: { label: 'In Review', icon: Clock, class: 'bg-blue-100 text-blue-700', dot: 'bg-blue-400' },
  approved: { label: 'Approved', icon: CheckCircle2, class: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400' },
  rejected: { label: 'Rejected', icon: XCircle, class: 'bg-red-100 text-red-700', dot: 'bg-red-400' },
};

// ─── Detail / Review Modal ───────────────────────────────────────────────────
function ReviewModal({
  request,
  onClose,
}: {
  request: HotelVerificationRequestSummary;
  onClose: () => void;
}) {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const { mutateAsync, isPending } = useReviewRegistration();

  const cfg = statusConfig[request.status];

  const handleDecision = async (decision: 'approve' | 'reject') => {
    await mutateAsync({
      requestId: request.id,
      dto: {
        decision,
        ...(decision === 'reject' ? { rejectionReason: rejectReason } : {}),
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-role-manager-light rounded-lg">
              <ShieldCheck className="w-5 h-5 text-role-manager-primary" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">{request.hotelName}</h2>
              <p className="text-xs text-slate-500">{request.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Owner', value: request.ownerName, icon: Building2 },
              { label: 'Location', value: request.cityProvince, icon: MapPin },
              { label: 'Submitted', value: new Date(request.submittedAt).toLocaleDateString('vi-VN'), icon: CalendarDays },
              { label: 'License No.', value: request.licenseNumber, icon: FileText },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="bg-slate-50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="w-3.5 h-3.5 text-slate-400" />
                    <p className="text-xs text-slate-500">{item.label}</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-800">{item.value || '—'}</p>
                </div>
              );
            })}
          </div>

          <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between">
            <span className="text-sm text-slate-600">Total Rooms</span>
            <span className="font-bold text-slate-900">{request.totalRooms} rooms</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Current status:</span>
            <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', cfg.class)}>
              {cfg.label}
            </span>
          </div>

          {request.rejectionReason && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3">
              <p className="text-xs font-semibold text-red-600 mb-1">Rejection reason</p>
              <p className="text-sm text-red-700">{request.rejectionReason}</p>
            </div>
          )}

          {showRejectForm && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-red-700">Reason for rejection</p>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Describe why this request is being rejected..."
                className="w-full text-sm border border-red-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                rows={3}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={() => { setShowRejectForm(false); setRejectReason(''); }}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 text-xs bg-red-600 hover:bg-red-700 text-white"
                  disabled={!rejectReason.trim() || isPending}
                  onClick={() => handleDecision('reject')}
                >
                  {isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                  Confirm Rejection
                </Button>
              </div>
            </div>
          )}
        </div>

        {(request.status === 'pending' || request.status === 'in_review') && !showRejectForm && (
          <div className="flex gap-3 p-6 pt-0">
            <Button
              onClick={() => setShowRejectForm(true)}
              variant="outline"
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400"
              disabled={isPending}
            >
              <XCircle className="w-4 h-4 mr-2" /> Reject
            </Button>
            <Button
              onClick={() => handleDecision('approve')}
              className="flex-1 bg-role-manager-primary hover:bg-role-manager-secondary text-white"
              disabled={isPending}
            >
              {isPending
                ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Approve
            </Button>
          </div>
        )}
        {(request.status === 'approved' || request.status === 'rejected') && (
          <div className="p-6 pt-0">
            <Button onClick={onClose} variant="outline" className="w-full">Close</Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
type FilterStatus = 'all' | VerificationStatus;

const PAGE_SIZE = 10;

export default function VerificationRequestsPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<HotelVerificationRequestSummary | null>(null);

  const { data, isLoading, isError, refetch } = useListRegistrations({
    ...(filter !== 'all' ? { status: filter } : {}),
    sortBy: 'submittedAt:desc',
    limit: PAGE_SIZE,
    page,
  });

  const requests = data?.results ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalResults = data?.totalResults ?? 0;

  const filtered = search
    ? requests.filter(
        r =>
          r.hotelName.toLowerCase().includes(search.toLowerCase()) ||
          r.ownerName.toLowerCase().includes(search.toLowerCase())
      )
    : requests;

  const filterLabels: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_review', label: 'In Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-role-manager-light rounded-lg">
            <ShieldCheck className="w-6 h-6 text-role-manager-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Verification Requests</h1>
            <p className="text-slate-500 text-sm">Review and approve hotel partner registrations</p>
          </div>
          {totalResults > 0 && (
            <span className="ml-auto text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              {totalResults} total
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {filterLabels.map(f => (
              <button
                key={f.value}
                onClick={() => { setFilter(f.value); setPage(1); }}
                className={cn(
                  'px-4 py-1.5 rounded-full text-sm font-medium transition-all',
                  filter === f.value
                    ? 'bg-role-manager-primary text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search hotel or owner..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-role-manager-primary/30 focus:border-role-manager-primary"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-role-manager-primary animate-spin" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <p className="text-slate-500 text-sm">Failed to load requests</p>
            <Button variant="outline" className="text-xs" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Hotel</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Owner</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Location</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Submitted</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Status</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      No requests found
                    </td>
                  </tr>
                ) : (
                  filtered.map(r => {
                    const cfg = statusConfig[r.status];
                    const StatusIcon = cfg.icon;
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-800">{r.hotelName}</p>
                          <p className="text-xs text-slate-400 font-mono">{r.id.slice(0, 8)}…</p>
                        </td>
                        <td className="px-5 py-4 text-slate-600">{r.ownerName}</td>
                        <td className="px-5 py-4">
                          <span className="flex items-center gap-1 text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {r.cityProvince}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-500">
                          {new Date(r.submittedAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-5 py-4">
                          <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full', cfg.class)}>
                            <StatusIcon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelected(r)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-role-manager-primary hover:bg-role-manager-light transition-colors"
                              title="View & Review"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {(r.status === 'pending' || r.status === 'in_review') && (
                              <>
                                <button
                                  onClick={() => setSelected(r)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                                  title="Approve"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setSelected(r)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                  title="Reject"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !isError && totalPages > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing {filtered.length} of {totalResults} requests
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-slate-600 font-medium">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1 ml-3">
                <span>Rows:</span>
                <ChevronDown className="w-3 h-3" />
                <span>{PAGE_SIZE}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <ReviewModal
          request={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
