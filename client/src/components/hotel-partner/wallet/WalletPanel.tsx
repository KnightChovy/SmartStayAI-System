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
import { PayoutAccountCard } from './PayoutAccountCard';
import { PayoutAccountModal } from './PayoutAccountModal';
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
  const [accountOpen, setAccountOpen] = useState(false);
  const { data, isLoading } = useHotelWallet(hotelId);
  const role = useAuthStore(s => s.user?.role);

  const available = Number(data?.wallet.balanceAvailable ?? 0);
  const hasPendingPayout = Number(data?.wallet.pendingPayout ?? 0) > 0;
  // Backend chỉ cho **chủ khách sạn** rút (kiểm `partner.ownerId`), staff/manager gọi vào là 403.
  // Khoá ở đây kèm lý do thay vì để họ bấm rồi ăn lỗi.
  const isOwner = role === UserRole.HOTEL_PARTNER;
  const belowMinimum = available < MIN_PAYOUT_AMOUNT;
  const disabled = isLoading || !isOwner || belowMinimum;

  // BE từ chối tạo yêu cầu rút khi khách sạn chưa có tài khoản nhận tiền — chặn trước kèm lý do
  // và chỉ đúng chỗ cần làm, thay vì để bấm rồi ăn 400.
  const missingAccount = isOwner && !isLoading && !data?.payoutAccount;

  const blockedReason = !isOwner
    ? 'Only the hotel owner account can request a payout.'
    : missingAccount
      ? 'Add a bank account first — the platform needs somewhere to send the money.'
      : belowMinimum
        ? `You need at least ${formatCurrency(MIN_PAYOUT_AMOUNT)} available to request a payout.`
        : null;

  /**
   * Nút rút tiền nằm TRONG chặng "Available" chứ không ở header: nó chỉ tác động lên đúng con
   * số đó, đặt cạnh nhau thì không phải bắc cầu bằng mắt. Bị chặn thì disable kèm đúng lý do.
   */
  const payoutAction = blockedReason ? (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* Nút disabled không bắn sự kiện chuột ⇒ bọc span để tooltip vẫn hiện. */}
        <span tabIndex={0} className="inline-block">
          <Button
            disabled
            className="w-full bg-role-partner-primary text-white hover:bg-role-partner-secondary"
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
      className="w-full bg-role-partner-primary text-white hover:bg-role-partner-secondary"
    >
      <HandCoins className="mr-1.5 h-4 w-4" />
      Request payout
    </Button>
  );

  return (
    <div className="space-y-6">
      {/* Khối tiền chiếm FULL width: bản trước nhét vào cột 1/3 nên khi lịch sử rút rỗng thì
          nửa phải trang trống trơn. */}
      <WalletBalanceCard
        wallet={data?.wallet}
        isLoading={isLoading}
        action={payoutAction}
      />

      {/* Hàng dưới đọc theo đúng câu hỏi kế tiếp: tiền sẽ đi VỀ ĐÂU → đã rút những lần nào. */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <PayoutAccountCard
            account={data?.payoutAccount}
            isLoading={isLoading}
            canEdit={isOwner}
            onEdit={() => setAccountOpen(true)}
          />
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

      {/* `key` theo id tài khoản: đổi khách sạn / lưu xong thì form nạp lại giá trị mới. */}
      <PayoutAccountModal
        key={data?.payoutAccount?.id ?? 'new'}
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        hotelId={hotelId}
        account={data?.payoutAccount}
        hasPendingPayout={hasPendingPayout}
      />
    </div>
  );
}
