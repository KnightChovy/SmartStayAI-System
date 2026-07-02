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
  MapPin,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/shared/skeletons';
import { formatDate } from '@/utils/formatDate';
import { useListRegistrations } from '@/hooks/manager/useManagerVerification';
import { VerificationDetailModal } from '@/components/manager/VerificationDetailModal';
import type {
  VerificationListItem,
  VerificationStatus,
} from '@/types/manager.types';

const statusConfig = {
  pending:   { label: 'Pending',   icon: Clock,         class: 'bg-amber-100 text-amber-700' },
  in_review: { label: 'In Review', icon: Clock,         class: 'bg-blue-100 text-blue-700' },
  approved:  { label: 'Approved',  icon: CheckCircle2,  class: 'bg-emerald-100 text-emerald-700' },
  rejected:  { label: 'Rejected',  icon: XCircle,       class: 'bg-red-100 text-red-700' },
};

type FilterStatus = 'all' | VerificationStatus;
const PAGE_SIZE = 10;

export default function VerificationRequestsPage() {
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState<FilterStatus>('all');
  const [page, setPage]       = useState(1);
  const [selected, setSelected] = useState<VerificationListItem | null>(null);

  const { data, isLoading, isError, refetch } = useListRegistrations({
    ...(filter !== 'all' ? { status: filter } : {}),
    sortBy: 'submittedAt:desc',
    limit: PAGE_SIZE,
    page,
  });

  const requests     = data?.results ?? [];
  const totalPages   = data?.totalPages ?? 1;
  const totalResults = data?.totalResults ?? 0;

  const filtered = search
    ? requests.filter(
        r =>
          r.hotel.name.toLowerCase().includes(search.toLowerCase()) ||
          r.partner.businessName.toLowerCase().includes(search.toLowerCase())
      )
    : requests;

  const filterLabels: { value: FilterStatus; label: string }[] = [
    { value: 'all',       label: 'All' },
    { value: 'pending',   label: 'Pending' },
    { value: 'in_review', label: 'In Review' },
    { value: 'approved',  label: 'Approved' },
    { value: 'rejected',  label: 'Rejected' },
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
          <TableSkeleton rows={6} columns={6} className="border-0 rounded-none" />
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
                    <td colSpan={6} className="text-center py-12 text-slate-400">No requests found</td>
                  </tr>
                ) : filtered.map(r => {
                  const cfg = statusConfig[r.status];
                  const StatusIcon = cfg.icon;
                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                      onClick={() => setSelected(r)}
                    >
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">{r.hotel.name}</p>
                        <p className="text-xs text-slate-400 font-mono">{r.id.slice(0, 8)}…</p>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{r.partner.businessName}</td>
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-1 text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {r.hotel.city}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-500">
                        {formatDate(r.submittedAt)}
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full', cfg.class)}>
                          <StatusIcon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => setSelected(r)}
                            className="flex items-center gap-1.5 text-xs font-medium text-role-manager-primary hover:bg-role-manager-light px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Review
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !isError && totalPages > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Showing {filtered.length} of {totalResults} requests</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-slate-600 font-medium">{page} / {totalPages}</span>
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
        <VerificationDetailModal
          summary={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
