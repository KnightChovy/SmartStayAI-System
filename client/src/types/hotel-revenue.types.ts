/**
 * Types cho khu vực doanh thu / ví / hiệu suất của MỘT khách sạn (cổng Hotel Partner).
 * Khớp các endpoint tag `Revenue`:
 *   - `GET /hotels/:id/revenue`  (báo cáo doanh thu)
 *   - `GET /hotels/:id/wallet`   (số dư ví + sổ giao dịch)
 *   - `GET /hotels/:id/analytics`(hiệu suất vận hành + điểm — tái dùng `HotelPerformance`)
 * Mọi giá trị tiền là Decimal được backend serialize thành **string**.
 */
import type { Paginated } from '@/types/api.types';
import type { PaymentMethod } from '@/types/staff.types';

// ─── Revenue report (GET /hotels/:id/revenue) ────────────────────────────────

export type HotelRevenueGroupBy = 'day' | 'month';

export interface HotelRevenueParams {
  /** YYYY-MM-DD, bỏ trống = all-time. */
  from?: string;
  /** YYYY-MM-DD, bỏ trống = all-time. */
  to?: string;
  groupBy?: HotelRevenueGroupBy;
  /**
   * Phân trang + lọc cho **sổ giao dịch** trả kèm (`transactions`).
   * ⚠️ Độc lập với `from`/`to`: khoảng ngày chỉ lọc `summary`/`series`, KHÔNG lọc sổ này.
   */
  type?: WalletTransactionType;
  page?: number;
  limit?: number;
}

export interface HotelRevenueSummary {
  gross: string;
  commission: string;
  net: string;
  netAfterRefund: string;
  refunded: string;
  bookingCount: number;
  commissionRate: string;
}

export interface HotelRevenueSeriesPoint {
  period: string;
  gross: string;
  commission: string;
  net: string;
  netAfterRefund: string;
  refunded: string;
  bookingCount: number;
}

export interface HotelRevenueReport {
  summary: HotelRevenueSummary;
  groupBy: HotelRevenueGroupBy;
  series: HotelRevenueSeriesPoint[];
  /** Sổ giao dịch ví — BE dời từ `/wallet` sang đây. Phân trang bằng `page`/`limit`, lọc bằng `type`. */
  transactions: Paginated<WalletTransaction>;
}

// ─── Wallet (GET /hotels/:id/wallet) ─────────────────────────────────────────

/**
 * Các loại giao dịch của ví KHÁCH SẠN — khớp `getHotelWallet` của backend.
 * (`spend` là của ví khách, không bao giờ xuất hiện ở ví khách sạn.)
 */
export type WalletTransactionType =
  | 'earning'
  | 'commission'
  | 'payout'
  | 'settlement'
  | 'refund'
  | 'adjustment';

/**
 * Ba số dư của ví khách sạn — mỗi số là một GIAI ĐOẠN khác nhau của cùng dòng tiền,
 * không phải ba khoản độc lập:
 *
 *   booking trả tiền → `balancePending` (khách chưa ở xong)
 *     → cron tất toán  → `balanceAvailable` (rút được)
 *       → tạo yêu cầu rút → `pendingPayout` (đã rời khỏi "trong ví", chờ PM chi)
 *         → PM chi        → tiền ra khỏi hệ thống
 *         → PM từ chối    → quay lại `balanceAvailable`
 */
export interface HotelWalletBalance {
  /** "Trong ví" — đã tất toán, rút được ngay. Tạo yêu cầu rút sẽ trừ từ đây. */
  balanceAvailable: string;
  /** "Chờ tất toán" — khách chưa ở xong, chưa qua kỳ ký quỹ. Cron tự chuyển sang available. */
  balancePending: string;
  /** "Chờ payout" — Σ yêu cầu rút đang `pending`. BE tính sẵn, FE **không tự cộng**. */
  pendingPayout: string;
  currency: string;
}

export interface WalletTransaction {
  id: string;
  type: WalletTransactionType;
  /**
   * Trạng thái bút toán — sổ ví chỉ ghi khi tiền đã chuyển xong nên **luôn `completed`**.
   * Muốn trạng thái thanh toán cổng thật (kể cả `failed`) thì phải xem `GET /admin/payments`.
   */
  status: string;
  /** Có dấu sẵn: `+` earning, `−` payout/refund. Đừng suy dấu từ `type`. */
  amount: string;
  balanceAfter: string;
  bookingId: string | null;
  /** "Từ đâu" — có cả với `settlement` (tra qua commission); `null` với payout/adjustment. */
  bookingCode: string | null;
  /** Phương thức khách đã trả. **Mảng** vì đơn trả kết hợp có `wallet` + cổng. `[]` với payout. */
  paymentMethods: PaymentMethod[];
  commissionId: string | null;
  description: string | null;
  createdAt: string;
}

/** ⚠️ Ví giờ CHỈ trả số dư — sổ giao dịch đã chuyển sang `GET /hotels/:id/revenue`. */
export interface HotelWalletResponse {
  wallet: HotelWalletBalance;
}
