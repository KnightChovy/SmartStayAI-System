import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DataTable,
  type Column,
} from '@/components/hotel-partner/shared/DataTable';
import { Pill } from '@/components/hotel-partner/shared/Pill';
import { ErrorState } from '@/components/hotel-partner/shared/states';
import { TableSkeleton } from '@/components/shared/skeletons';
import { useHotelWallet } from '@/hooks/hotel-revenue';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import type {
  WalletTransaction,
  WalletTransactionType,
} from '@/types/hotel-revenue.types';
import { WALLET_TXN_CONFIG, WALLET_TXN_OPTIONS, isPositiveTxn } from './labels';

const PAGE_SIZE = 10;
const ALL_TYPES = 'all';

interface TransactionHistoryCardProps {
  hotelId: string;
}

/** Sổ cái đầy đủ của ví: earning / commission / payout / refund / adjustment. */
export function TransactionHistoryCard({
  hotelId,
}: TransactionHistoryCardProps) {
  const [type, setType] = useState<WalletTransactionType | typeof ALL_TYPES>(
    ALL_TYPES
  );
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useHotelWallet(hotelId, {
    page,
    limit: PAGE_SIZE,
    type: type === ALL_TYPES ? undefined : type,
  });

  const txns = data?.transactions;

  const changeType = (value: string) => {
    setType(value as WalletTransactionType | typeof ALL_TYPES);
    setPage(1);
  };

  const columns = useMemo<Column<WalletTransaction>[]>(
    () => [
      {
        id: 'type',
        header: 'Type',
        cell: t => {
          const cfg = WALLET_TXN_CONFIG[t.type];
          return <Pill tone={cfg.tone}>{cfg.label}</Pill>;
        },
      },
      {
        id: 'description',
        header: 'Description',
        cell: t => (
          <span className="text-slate-600">{t.description ?? '—'}</span>
        ),
        className: 'max-w-[300px] truncate',
      },
      {
        id: 'amount',
        header: 'Amount',
        align: 'right',
        cell: t => {
          const positive = isPositiveTxn(t.type);
          return (
            <span
              className={cn(
                'whitespace-nowrap font-semibold tabular-nums',
                positive ? 'text-emerald-600' : 'text-red-600'
              )}
            >
              {positive ? '+' : ''}
              {formatCurrency(t.amount)}
            </span>
          );
        },
      },
      {
        id: 'balanceAfter',
        header: 'Balance after',
        align: 'right',
        cell: t => (
          <span className="whitespace-nowrap tabular-nums text-slate-700">
            {formatCurrency(t.balanceAfter)}
          </span>
        ),
      },
      {
        id: 'createdAt',
        header: 'Date',
        cell: t => (
          <span className="whitespace-nowrap text-slate-500">
            {formatDate(t.createdAt)}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-900">Transaction history</h2>
          <p className="text-sm text-slate-500">
            Every movement in and out of this hotel&apos;s wallet
          </p>
        </div>
        <Select value={type} onValueChange={changeType}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="All transaction types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_TYPES}>All transaction types</SelectItem>
            {WALLET_TXN_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isError ? (
        <div className="flex flex-col items-center gap-3">
          <ErrorState label="Failed to load transactions." className="py-8" />
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : isLoading && !txns ? (
        <TableSkeleton rows={6} columns={5} />
      ) : txns && txns.results.length > 0 ? (
        <>
          <DataTable
            columns={columns}
            rows={txns.results}
            rowKey={t => t.id}
            minWidthClass="min-w-[760px]"
          />
          <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
            <span>
              Page {txns.page} of {txns.totalPages} · {txns.totalResults}{' '}
              transaction{txns.totalResults === 1 ? '' : 's'}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={txns.page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={txns.page >= txns.totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      ) : (
        <p className="py-12 text-center text-sm text-slate-400">
          {type === ALL_TYPES
            ? 'No transactions yet.'
            : 'No transactions of this type.'}
        </p>
      )}
    </div>
  );
}
