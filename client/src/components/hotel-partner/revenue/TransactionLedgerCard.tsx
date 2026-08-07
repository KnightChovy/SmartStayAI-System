import { useState } from 'react';
import { Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pill } from '@/components/hotel-partner/shared/Pill';
import { ErrorState } from '@/components/hotel-partner/shared/states';
import { TableSkeleton } from '@/components/shared/skeletons';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useHotelRevenue } from '@/hooks/hotel-revenue';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import type {
  WalletTransaction,
  WalletTransactionType,
} from '@/types/hotel-revenue.types';
import type { PaymentMethod } from '@/types/staff.types';
import {
  WALLET_TXN_CONFIG,
  WALLET_TXN_OPTIONS,
  describeTxn,
  isPositiveTxn,
} from '@/components/hotel-partner/wallet/labels';
import { PAYOUT_STATUS_CONFIG } from '@/components/hotel-partner/wallet/payout-labels';

const PAGE_SIZE = 10;
const ALL_TYPES = 'all';

/** Nhãn phương thức thanh toán — `wallet` là ví của KHÁCH, không phải ví khách sạn. */
const PAYMENT_METHOD_LABEL: Partial<Record<PaymentMethod, string>> = {
  vnpay: 'VNPay',
  sepay: 'SePay',
  cash: 'Cash',
  wallet: 'Guest wallet',
  stripe: 'Stripe',
};

interface TransactionLedgerCardProps {
  hotelId: string;
}

/**
 * Sổ giao dịch ví — nay đọc từ `GET /hotels/:id/revenue` (field `transactions`), không còn
 * ở endpoint `/wallet`.
 *
 * ⚠️ CỐ Ý không truyền `from`/`to`: sổ này là **lịch sử bút toán**, backend không lọc nó theo
 * khoảng ngày của báo cáo. Truyền vào chỉ khiến người đọc tưởng bảng đang bám bộ lọc kỳ ở
 * trên trong khi thực tế không — nên bảng tự nói rõ là "toàn bộ lịch sử".
 */
export function TransactionLedgerCard({ hotelId }: TransactionLedgerCardProps) {
  const [type, setType] = useState<WalletTransactionType | typeof ALL_TYPES>(
    ALL_TYPES
  );
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useHotelRevenue(hotelId, {
    page,
    limit: PAGE_SIZE,
    type: type === ALL_TYPES ? undefined : type,
  });

  const txns = data?.transactions;
  const rows = txns?.results ?? [];
  const totalPages = txns?.totalPages ?? 1;

  const changeType = (value: string) => {
    const next = value as WalletTransactionType | typeof ALL_TYPES;
    setType(next);
    setPage(1);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
        <div>
          <h2 className="font-semibold text-slate-900">Transaction history</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Every entry in your wallet ledger — not limited by the date filter
            above
          </p>
        </div>
        <Select value={type} onValueChange={changeType}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_TYPES}>All types</SelectItem>
            {WALLET_TXN_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isError ? (
        <div className="flex flex-col items-center gap-3 py-12">
          <ErrorState label="Failed to load transactions." className="py-4" />
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : isLoading && !data ? (
        <div className="p-6">
          <TableSkeleton rows={5} columns={6} />
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <Receipt className="h-7 w-7 text-slate-300" />
          </div>
          <p className="text-sm text-slate-400">
            {type === ALL_TYPES
              ? 'No transactions yet'
              : `No ${WALLET_TXN_CONFIG[type].label.toLowerCase()} transactions`}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-200 text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Transaction Type</th>
                  <th className="px-6 py-3">Booking ID</th>
                  <th className="px-6 py-3">Payment Method</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                  <th className="px-6 py-3 text-right">
                    Balance After Transaction
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map(t => (
                  <Row key={t.id} txn={t} />
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3 text-xs text-slate-500">
            <span>
              {txns!.totalResults} transaction
              {txns!.totalResults === 1 ? '' : 's'}
              {totalPages > 1 && ` · page ${page} of ${totalPages}`}
            </span>
            {totalPages > 1 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Row({ txn }: { txn: WalletTransaction }) {
  // Tra bằng `??` chứ không `Record` đầy đủ: BE có thể thêm loại mới, thiếu khoá mà đọc
  // `.tone` thẳng thì ném lỗi và vỡ cả trang (đã từng xảy ra với `settlement`).
  const config = WALLET_TXN_CONFIG[txn.type] ?? {
    label: txn.type,
    tone: 'slate' as const,
  };
  // Dấu suy từ chính `amount` (BE ghi sẵn dấu), KHÔNG suy từ `type`: `adjustment` đi cả hai chiều.
  const amount = Number(txn.amount);
  const positive = amount >= 0 && isPositiveTxn(txn.type);

  return (
    <tr className="hover:bg-slate-50/60">
      <td className="whitespace-nowrap px-6 py-3.5 text-slate-600">
        {formatDate(txn.createdAt)}
      </td>

      <td className="px-6 py-3.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-default">
                <Pill tone={config.tone}>{config.label}</Pill>
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-64 text-xs">
              {/* Mã giao dịch dài, để trong tooltip thay vì chiếm một cột riêng chỉ để hiện
                  một chuỗi UUID không ai đọc bằng mắt. */}
              <p className="font-mono">{txn.id}</p>
            </TooltipContent>
          </Tooltip>

          {/* Badge trạng thái khoản rút — ẩn khi `null` (giao dịch không thuộc luồng rút).
              Không có badge này thì ba kết cục pending/paid/failed nhìn y hệt nhau vì cùng
              mang `type: 'payout'`. */}
          {txn.payoutStatus && (
            <Pill tone={PAYOUT_STATUS_CONFIG[txn.payoutStatus].tone}>
              {PAYOUT_STATUS_CONFIG[txn.payoutStatus].label}
            </Pill>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-400">
          {describeTxn(txn.type, txn.payoutStatus, txn.description)}
        </p>
      </td>

      <td className="px-6 py-3.5">
        {txn.bookingCode ? (
          <span className="font-mono text-xs text-slate-700">
            {txn.bookingCode}
          </span>
        ) : (
          <span className="text-xs italic text-slate-300">Not a booking</span>
        )}
      </td>

      <td className="px-6 py-3.5 text-xs text-slate-600">
        {txn.paymentMethods.length > 0 ? (
          txn.paymentMethods.map(m => PAYMENT_METHOD_LABEL[m] ?? m).join(' + ')
        ) : (
          <span className="italic text-slate-300">—</span>
        )}
      </td>

      <td className="px-6 py-3.5 text-right">
        {/* Xanh = tiền vào, đỏ = tiền ra. Cùng một màu cho cả hai chiều thì phải đọc kỹ dấu
            trừ mới biết đang nhận hay đang mất. */}
        <span
          className={cn(
            'whitespace-nowrap font-semibold tabular-nums',
            positive
              ? 'text-emerald-600'
              : amount < 0
                ? 'text-red-600'
                : 'text-slate-800'
          )}
        >
          {positive ? '+' : ''}
          {formatCurrency(txn.amount)}
        </span>
      </td>

      <td className="whitespace-nowrap px-6 py-3.5 text-right tabular-nums text-slate-500">
        {formatCurrency(txn.balanceAfter)}
      </td>
    </tr>
  );
}
