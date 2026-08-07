/**
 * Types cho khu vực doanh thu / ví / hiệu suất của MỘT khách sạn (cổng Hotel Partner).
 * Khớp các endpoint tag `Revenue`:
 *   - `GET /hotels/:id/revenue`  (báo cáo doanh thu)
 *   - `GET /hotels/:id/wallet`   (số dư ví + sổ giao dịch)
 *   - `GET /hotels/:id/analytics`(hiệu suất vận hành + điểm — tái dùng `HotelPerformance`)
 * Mọi giá trị tiền là Decimal được backend serialize thành **string**.
 */
import type { Paginated } from '@/types/api.types';

// ─── Revenue report (GET /hotels/:id/revenue) ────────────────────────────────

export type HotelRevenueGroupBy = 'day' | 'month';

export interface HotelRevenueParams {
  /** YYYY-MM-DD, bỏ trống = all-time. */
  from?: string;
  /** YYYY-MM-DD, bỏ trống = all-time. */
  to?: string;
  groupBy?: HotelRevenueGroupBy;
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

export interface HotelWalletBalance {
  balanceAvailable: string;
  balancePending: string;
  currency: string;
}

export interface WalletTransaction {
  id: string;
  type: WalletTransactionType;
  amount: string;
  balanceAfter: string;
  bookingId: string | null;
  commissionId: string | null;
  description: string | null;
  createdAt: string;
}

export interface HotelWalletParams {
  type?: WalletTransactionType;
  page?: number;
  limit?: number;
}

export interface HotelWalletResponse {
  wallet: HotelWalletBalance;
  transactions: Paginated<WalletTransaction>;
}
