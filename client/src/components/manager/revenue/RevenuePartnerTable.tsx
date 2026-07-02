import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ChevronUp,
  Search,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TableSkeleton } from '@/components/shared/skeletons';
import { cn } from '@/lib/cn';
import useDebounce from '@/hooks/useDebounce';
import { useRevenueByPartner } from '@/hooks/revenue';
import { formatCompactVnd, formatVndFull } from '@/utils/formatCurrency';
import type { DateRange, PartnerStatus } from '@/types/revenue.types';
import { ChangeBadge } from './ChangeBadge';
import { PARTNER_STATUS_CONFIG, PARTNER_STATUS_OPTIONS } from './labels';
import { SectionError } from './states';

interface RevenuePartnerTableProps {
  range: DateRange;
}

interface ColumnDef {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
}

const COLUMNS: ColumnDef[] = [
  { key: 'hotelName', label: 'Hotel', sortable: true },
  { key: 'bookings', label: 'Bookings', align: 'right', sortable: true },
  { key: 'grossRevenue', label: 'Gross Revenue', align: 'right', sortable: true },
  { key: 'commission', label: 'Commission', align: 'right', sortable: true },
  { key: 'commissionRate', label: 'Rate', align: 'right', sortable: true },
  { key: 'changePct', label: 'Change %', align: 'right', sortable: true },
  { key: 'status', label: 'Status', align: 'center', sortable: true },
];

const LIMIT = 8;

export function RevenuePartnerTable({ range }: RevenuePartnerTableProps) {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [status, setStatus] = useState<PartnerStatus | 'all'>('all');
  const [sortField, setSortField] = useState('grossRevenue');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  // Đổi filter/sort → về trang 1 (giữ nguyên khi chỉ chuyển trang — AC-3.5).
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, sortField, sortDir]);

  const { data, isLoading, isError, isFetching, refetch } = useRevenueByPartner({
    from: range.from,
    to: range.to,
    search: debouncedSearch || undefined,
    status: status === 'all' ? undefined : status,
    sortBy: `${sortField}:${sortDir}`,
    page,
    limit: LIMIT,
  });

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const rows = data?.results ?? [];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="font-semibold text-slate-900">Partner Revenue Ranking</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search hotel..."
              className="h-9 w-full sm:w-56 rounded-lg border border-slate-200 pl-8.5 pr-3 text-sm outline-none focus:border-role-manager-primary"
            />
          </div>
          <Select value={status} onValueChange={v => setStatus(v as PartnerStatus | 'all')}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PARTNER_STATUS_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isError ? (
        <SectionError onRetry={() => refetch()} />
      ) : isLoading ? (
        <TableSkeleton rows={LIMIT} columns={COLUMNS.length} />
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
          <Search className="w-7 h-7 mb-3" />
          <p className="text-sm">No partners match your filters</p>
        </div>
      ) : (
        <>
          <div className={cn('overflow-x-auto transition-opacity', isFetching && 'opacity-60')}>
            <table className="w-full min-w-180 text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500">
                  {COLUMNS.map(col => (
                    <th
                      key={col.key}
                      className={cn(
                        'py-2.5 px-3 font-medium',
                        col.align === 'right' && 'text-right',
                        col.align === 'center' && 'text-center',
                        (!col.align || col.align === 'left') && 'text-left'
                      )}
                    >
                      {col.sortable ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(col.key)}
                          className={cn(
                            'inline-flex items-center gap-1 hover:text-slate-800 transition-colors',
                            col.align === 'right' && 'flex-row-reverse',
                            sortField === col.key && 'text-role-manager-primary'
                          )}
                        >
                          {col.label}
                          <SortIcon active={sortField === col.key} dir={sortDir} />
                        </button>
                      ) : (
                        col.label
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(r => {
                  const cfg = PARTNER_STATUS_CONFIG[r.status];
                  return (
                    <tr
                      key={r.partnerId}
                      onClick={() =>
                        navigate(`/manager/hotel-partners?partnerId=${r.partnerId}`)
                      }
                      className="border-b border-slate-50 last:border-0 cursor-pointer hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3 px-3 font-medium text-slate-800">{r.hotelName}</td>
                      <td className="py-3 px-3 text-right text-slate-600">
                        {r.bookings.toLocaleString('en-US')}
                      </td>
                      <td
                        className="py-3 px-3 text-right font-medium text-slate-800"
                        title={formatVndFull(r.grossRevenue)}
                      >
                        {formatCompactVnd(r.grossRevenue)}
                      </td>
                      <td
                        className="py-3 px-3 text-right text-slate-600"
                        title={formatVndFull(r.commission)}
                      >
                        {formatCompactVnd(r.commission)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-600">{r.commissionRate}%</td>
                      <td className="py-3 px-3 text-right">
                        <ChangeBadge value={r.changePct} bare className="justify-end" />
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={cn(
                            'inline-block text-xs font-semibold px-2.5 py-1 rounded-full',
                            cfg.class
                          )}
                        >
                          {cfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <p className="text-slate-500 text-xs">
                {data.totalResults} partners · page {data.page}/{data.totalPages}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={data.page <= 1}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <button
                  type="button"
                  onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                  disabled={data.page >= data.totalPages}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  if (!active) return <ChevronsUpDown className="w-3 h-3 opacity-50" />;
  return dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
}
