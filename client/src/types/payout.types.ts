/**
 * Yêu cầu RÚT TIỀN của khách sạn (`Payout`).
 *
 * Luồng: chủ KS tạo yêu cầu → tiền **rời `balanceAvailable` ngay lúc tạo** (giữ lại, để không
 * tạo được nhiều yêu cầu vượt số dư) → Platform Manager chuyển khoản tay rồi duyệt một lần.
 * Duyệt (`paid`) thì ví không đụng nữa; từ chối (`failed`) thì hoàn phần đã giữ về available.
 *
 * Đây là **điểm duyệt tay DUY NHẤT** còn lại trong luồng tiền — tất toán hoa hồng
 * (pending → available) giờ do cron chạy tự động, endpoint duyệt từng khoản đã bị gỡ.
 *
 * Mọi số tiền là Decimal serialize thành **string**.
 */

/** Khớp enum `PayoutStatus` của Prisma. `processing` hiện BE chưa set, nhưng vẫn khai đủ. */
export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed';

/** Dòng lịch sử rút của CHÍNH khách sạn mình — cố ý KHÔNG có số tài khoản. */
export interface HotelPayout {
  id: string;
  amount: string;
  currency: string;
  status: PayoutStatus;
  /** Mã giao dịch ngân hàng, PM nhập khi đã chuyển khoản. `null` khi chưa duyệt. */
  payoutTransactionId: string | null;
  processedAt: string | null;
  /** Ghi chú của PM — với `failed` thì đây là LÝ DO từ chối. */
  notes: string | null;
  createdAt: string;
}

export interface PayoutHotelSummary {
  id: string;
  name: string;
  city: string;
}

/** Tài khoản nhận tiền — ở DANH SÁCH backend chỉ trả tên chủ TK + ngân hàng, KHÔNG số TK. */
export interface PayoutAccountBrief {
  accountHolder: string;
  bankName: string;
}

/** Dòng trong danh sách toàn sàn của Platform Manager. */
export interface PlatformPayout extends HotelPayout {
  hotel: PayoutHotelSummary;
  payoutAccount: PayoutAccountBrief;
}

/**
 * Tài khoản đầy đủ — `accountNumber` đã được backend **giải mã**, và CHỈ endpoint chi tiết
 * mới giải mã. Không log, không đưa sang màn khác.
 */
export interface PayoutAccountFull extends PayoutAccountBrief {
  id: string;
  accountNumber: string;
  bankBranch: string | null;
  swiftCode: string | null;
  taxIdVatNumber: string | null;
  registeredBusinessAddress: string | null;
  isPrimary: boolean;
}

/** Chi tiết cho PM — kèm số tài khoản đã giải mã để đi chuyển khoản. */
export interface PlatformPayoutDetail extends HotelPayout {
  hotelId: string;
  partnerId: string;
  hotel: PayoutHotelSummary;
  payoutAccount: PayoutAccountFull;
}

// ─── Params & payloads ───────────────────────────────────────────────────────

export interface PayoutListParams {
  status?: PayoutStatus;
  page?: number;
  limit?: number;
}

/** Backend chặn `min(100000)` — FE validate cùng ngưỡng để báo trước khi gửi. */
export const MIN_PAYOUT_AMOUNT = 100_000;

export interface RequestPayoutDto {
  amount: number;
}

/**
 * `payoutTransactionId` chỉ có nghĩa khi **approve** (mã chuyển khoản để đối soát sao kê);
 * `notes` dùng cho cả hai, nhưng khi **reject** nó chính là lý do đối tác sẽ đọc.
 */
export type ReviewPayoutDto =
  | { decision: 'approve'; payoutTransactionId?: string; notes?: string }
  | { decision: 'reject'; notes?: string };
