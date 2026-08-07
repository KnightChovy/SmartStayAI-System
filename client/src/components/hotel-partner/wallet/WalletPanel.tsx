import { HandCoins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useHotelWallet } from '@/hooks/hotel-revenue';
import { WalletBalanceCard } from './WalletBalanceCard';
import { WithdrawalHistoryCard } from './WithdrawalHistoryCard';

interface WalletPanelProps {
  hotelId: string;
}

/**
 * Ví của MỘT khách sạn: số dư · lịch sử rút tiền.
 *
 * Sổ giao dịch đầy đủ đã gỡ khỏi đây — sắp chuyển sang màn Revenue. Component
 * `TransactionHistoryCard` + `labels.ts` giữ nguyên tại chỗ để bên đó dùng lại,
 * hiện chưa file nào import.
 *
 * ⚠️ Nút "Request withdrawal" CỐ Ý bị vô hiệu hoá: backend **chưa có endpoint** nào cho
 * đối tác tự tạo yêu cầu rút tiền. Bảng `payouts` có trong `schema.prisma` (kèm enum
 * `PayoutStatus`) nhưng không service/controller/route nào chạm tới — và mô hình của nó là
 * đợt chi trả do NỀN TẢNG tạo theo kỳ (`periodStart`/`periodEnd` + `commissions[]`),
 * không phải đơn do đối tác gửi. Ship một nút bấm-không-làm-gì là mời người dùng
 * bấm vào chỗ trống, nên hiển thị rõ trạng thái thay vì giả vờ.
 */
export function WalletPanel({ hotelId }: WalletPanelProps) {
  // Chỉ lấy số dư ở đây (limit 1) — endpoint luôn trả kèm `wallet` bất kể `limit`;
  // bảng rút tiền bên dưới tự query danh sách của riêng nó.
  const { data, isLoading } = useHotelWallet(hotelId, { page: 1, limit: 1 });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Balance &amp; payouts
          </h2>
          <p className="text-sm text-slate-500">
            Track your balance and every payout made against it
          </p>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            {/* Nút disabled không bắn sự kiện chuột ⇒ bọc span để tooltip vẫn hiện. */}
            <span tabIndex={0}>
              <Button
                disabled
                className="bg-role-partner-primary text-white hover:bg-role-partner-secondary"
              >
                <HandCoins className="mr-1.5 h-4 w-4" />
                Request Payout
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            Self-service payout requests are not available yet. The platform
            issues payouts against your settled balance.
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <WalletBalanceCard
            hotelId={hotelId}
            wallet={data?.wallet}
            isLoading={isLoading}
          />
        </div>
        <div className="lg:col-span-2">
          <WithdrawalHistoryCard hotelId={hotelId} />
        </div>
      </div>
    </div>
  );
}
