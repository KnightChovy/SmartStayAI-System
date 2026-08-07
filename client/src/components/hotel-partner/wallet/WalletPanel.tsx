import { useState } from 'react';
import { HandCoins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useHotelWallet } from '@/hooks/hotel-revenue';
import { UserRole } from '@/constants/roles';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { MIN_PAYOUT_AMOUNT } from '@/types/payout.types';
import { RequestPayoutModal } from './RequestPayoutModal';
import { WalletBalanceCard } from './WalletBalanceCard';
import { WithdrawalHistoryCard } from './WithdrawalHistoryCard';

interface WalletPanelProps {
  hotelId: string;
}

/**
 * Ví của MỘT khách sạn: 3 số dư + yêu cầu rút + lịch sử yêu cầu.
 *
 * Sổ giao dịch KHÔNG còn ở đây — backend đã dời sang `GET /hotels/:id/revenue`, và trang
 * Revenue là nơi hiển thị nó.
 */
export function WalletPanel({ hotelId }: WalletPanelProps) {
  const [requestOpen, setRequestOpen] = useState(false);
  const { data, isLoading } = useHotelWallet(hotelId);
  const role = useAuthStore(s => s.user?.role);

  const available = Number(data?.wallet.balanceAvailable ?? 0);
  // Backend chỉ cho **chủ khách sạn** rút (kiểm `partner.ownerId`), staff/manager gọi vào là 403.
  // Khoá ở đây kèm lý do thay vì để họ bấm rồi ăn lỗi.
  const isOwner = role === UserRole.HOTEL_PARTNER;
  const belowMinimum = available < MIN_PAYOUT_AMOUNT;
  const disabled = isLoading || !isOwner || belowMinimum;

  const blockedReason = !isOwner
    ? 'Only the hotel owner account can request a payout.'
    : belowMinimum
      ? `You need at least ${formatCurrency(MIN_PAYOUT_AMOUNT)} available to request a payout.`
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Balance &amp; payouts
          </h2>
          <p className="text-sm text-slate-500">
            Where your money is right now, and every payout you have requested
          </p>
        </div>

        {blockedReason ? (
          <Tooltip>
            <TooltipTrigger asChild>
              {/* Nút disabled không bắn sự kiện chuột ⇒ bọc span để tooltip vẫn hiện. */}
              <span tabIndex={0}>
                <Button
                  disabled
                  className="bg-role-partner-primary text-white hover:bg-role-partner-secondary"
                >
                  <HandCoins className="mr-1.5 h-4 w-4" />
                  Request payout
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              {blockedReason}
            </TooltipContent>
          </Tooltip>
        ) : (
          <Button
            onClick={() => setRequestOpen(true)}
            disabled={disabled}
            className="bg-role-partner-primary text-white hover:bg-role-partner-secondary"
          >
            <HandCoins className="mr-1.5 h-4 w-4" />
            Request payout
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <WalletBalanceCard wallet={data?.wallet} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-2">
          <WithdrawalHistoryCard hotelId={hotelId} />
        </div>
      </div>

      <RequestPayoutModal
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        hotelId={hotelId}
        available={data?.wallet.balanceAvailable}
      />
    </div>
  );
}
