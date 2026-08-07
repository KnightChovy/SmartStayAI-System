import type { ReactNode } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Clock,
  HandCoins,
  Wallet,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/utils/formatCurrency';
import type { HotelWalletBalance } from '@/types/hotel-revenue.types';

interface WalletBalanceCardProps {
  wallet: HotelWalletBalance | undefined;
  isLoading: boolean;
  /** Nút hành động, đặt NGAY trong chặng "Available" — đó là số duy nhất bấm được. */
  action?: ReactNode;
}

/**
 * Ba số dư = ba CHẶNG của cùng một dòng tiền, đọc từ trái sang:
 *
 *   Pending settlement  →  Available  →  Pending payout
 *
 * Bản trước xếp DỌC trong một cột hẹp 1/3 màn hình: mũi tên bé xíu dễ bỏ qua, mà cột phải
 * (lịch sử rút) khi rỗng lại để trống cả nửa trang. Nằm ngang thì mũi tên đọc ra ngay là một
 * dòng chảy, và khối này chiếm đúng bề ngang nó xứng đáng.
 *
 * "Available" là chặng **hành động được** ⇒ tô nền, số to nhất, và nút Request payout đặt
 * thẳng trong đó thay vì nằm tận header, cách xa con số mà nó tác động.
 */
export function WalletBalanceCard({
  wallet,
  isLoading,
  action,
}: WalletBalanceCardProps) {
  const loading = isLoading && !wallet;

  // Ba số RỜI NHAU (tạo yêu cầu rút là chuyển từ available sang pendingPayout, không nhân đôi)
  // nên cộng lại đúng bằng "tất cả tiền đang là của khách sạn" — câu hỏi đầu tiên người ta hỏi
  // khi mở ví, mà bản trước không trả lời ở đâu cả.
  const total =
    Number(wallet?.balancePending ?? 0) +
    Number(wallet?.balanceAvailable ?? 0) +
    Number(wallet?.pendingPayout ?? 0);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold text-slate-900">Where your money is</h2>
        <div className="flex items-baseline gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-default text-xs text-slate-500">
                Total balance
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-64 text-xs">
              Everything that is yours right now — money still settling, money
              ready to withdraw, and money already requested.
            </TooltipContent>
          </Tooltip>
          {loading ? (
            <Skeleton className="h-6 w-32" />
          ) : (
            <span className="text-lg font-bold tabular-nums text-slate-900">
              {formatCurrency(total)}
            </span>
          )}
        </div>
      </div>

      <div className="grid items-stretch gap-2 md:grid-cols-[1fr_auto_1.2fr_auto_1fr]">
        <Stage
          icon={Clock}
          label="Pending settlement"
          value={wallet?.balancePending}
          note="Guests have paid but not finished their stay"
          hint="Moves to Available automatically once the stay is closed and the hold period passes."
          tone="amber"
          loading={loading}
        />

        <Arrow />

        <Stage
          icon={Wallet}
          label="Available for payout"
          value={wallet?.balanceAvailable}
          note="Settled and yours to take out"
          hint="Requesting a payout draws from this balance."
          tone="emerald"
          loading={loading}
          emphasis
          action={action}
        />

        <Arrow />

        <Stage
          icon={HandCoins}
          label="Pending payout"
          value={wallet?.pendingPayout}
          note="Requested — waiting for the platform to transfer"
          hint="Already deducted from Available. It comes back if the request is declined."
          tone="blue"
          loading={loading}
        />
      </div>
    </section>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const TONE: Record<
  'amber' | 'emerald' | 'blue',
  { text: string; icon: string; card: string }
> = {
  amber: { text: 'text-amber-600', icon: 'text-amber-500', card: '' },
  emerald: {
    text: 'text-emerald-700',
    icon: 'text-emerald-600',
    card: 'border-emerald-200 bg-emerald-50/60',
  },
  blue: { text: 'text-blue-600', icon: 'text-blue-500', card: '' },
};

function Stage({
  icon: Icon,
  label,
  value,
  note,
  hint,
  tone,
  loading,
  emphasis = false,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | undefined;
  note: string;
  hint: string;
  tone: keyof typeof TONE;
  loading: boolean;
  emphasis?: boolean;
  action?: ReactNode;
}) {
  const t = TONE[tone];
  // Số 0 KHÔNG tô màu: màu mạnh trên một con số bằng không là kéo mắt về chỗ không có gì
  // (bản trước hiện "0 VNĐ" xanh đậm y như một khoản tiền thật).
  const isZero = Number(value ?? 0) === 0;

  return (
    <div
      className={cn(
        'flex flex-col rounded-xl border p-4',
        emphasis ? t.card : 'border-slate-200'
      )}
    >
      <div className="flex items-center gap-2">
        <Icon
          className={cn('h-4 w-4 shrink-0', isZero ? 'text-slate-300' : t.icon)}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(
                'cursor-default text-xs',
                emphasis ? 'font-semibold text-slate-700' : 'text-slate-500'
              )}
            >
              {label}
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-64 text-xs">{hint}</TooltipContent>
        </Tooltip>
      </div>

      {loading ? (
        <Skeleton className={cn('mt-2', emphasis ? 'h-9 w-40' : 'h-7 w-32')} />
      ) : (
        <p
          className={cn(
            'mt-1.5 font-bold tracking-tight tabular-nums',
            emphasis ? 'text-2xl xl:text-3xl' : 'text-xl',
            isZero ? 'text-slate-400' : t.text
          )}
        >
          {formatCurrency(value)}
        </p>
      )}

      <p className="mt-1 text-xs leading-snug text-slate-400">{note}</p>

      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

/** Mũi tên nối chặng: ngang trên desktop, xuống dòng trên mobile. */
function Arrow() {
  return (
    <div className="flex items-center justify-center py-1 md:py-0" aria-hidden>
      <ChevronDown className="h-4 w-4 text-slate-300 md:hidden" />
      <ChevronRight className="hidden h-4 w-4 text-slate-300 md:block" />
    </div>
  );
}
