import { useMemo } from 'react';
import { usePerformanceLeaderboard } from '@/hooks/platform-manager';
import type { HotelLeaderboardRow } from '@/types/platform-manager.types';
import type { DashboardAlert } from '@/types/dashboard.types';

/**
 * "Khách sạn cần chú ý" — SUY RA CLIENT-SIDE từ `GET /platform-manager/performance`.
 *
 * BE KHÔNG có endpoint alert/vi phạm nào. Thay vì bịa dữ liệu, ta đọc bảng hiệu suất thật
 * (mặc định 90 ngày gần nhất) rồi áp ngưỡng dưới đây. Ngưỡng là quy ước của FE, không phải
 * chính sách do BE định nghĩa — sửa ở đây là đổi toàn bộ dashboard.
 */
const HIGH_CANCELLATION_RATE = 0.3;
const LOW_AVG_RATING = 3;
const SLOW_RESPONSE_MINUTES = 240;
const LOW_SCORE = 50;
const MAX_ALERTS = 6;

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 } as const;

/** Vấn đề NGHIÊM TRỌNG NHẤT của một khách sạn — mỗi KS chỉ 1 dòng để không lấn át danh sách. */
function worstIssue(h: HotelLeaderboardRow): Omit<DashboardAlert, 'hotelId' | 'hotelName'> | null {
  if (h.cancellationRate !== null && h.cancellationRate > HIGH_CANCELLATION_RATE) {
    return {
      id: `${h.hotelId}-cancellation`,
      severity: 'high',
      issue: `Cancellation rate ${Math.round(h.cancellationRate * 100)}% — over ${HIGH_CANCELLATION_RATE * 100}%`,
    };
  }
  if (h.avgRating !== null && h.avgRating < LOW_AVG_RATING) {
    return {
      id: `${h.hotelId}-rating`,
      severity: 'high',
      issue: `Guest rating ${h.avgRating.toFixed(1)}/5 — below ${LOW_AVG_RATING}`,
    };
  }
  if (h.avgResponseMinutes !== null && h.avgResponseMinutes > SLOW_RESPONSE_MINUTES) {
    return {
      id: `${h.hotelId}-response`,
      severity: 'medium',
      issue: `Slow replies — ${Math.round(h.avgResponseMinutes / 60)}h average response time`,
    };
  }
  if (h.score !== null && h.score < LOW_SCORE) {
    return {
      id: `${h.hotelId}-score`,
      severity: 'medium',
      issue: `Performance score ${h.score}/100`,
    };
  }
  return null;
}

export function useDashboardAlerts() {
  const query = usePerformanceLeaderboard();

  const data = useMemo<DashboardAlert[] | undefined>(() => {
    if (!query.data) return undefined;
    return query.data.hotels
      .map(h => {
        const issue = worstIssue(h);
        return issue ? { ...issue, hotelId: h.hotelId, hotelName: h.hotelName } : null;
      })
      .filter((a): a is DashboardAlert => a !== null)
      .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
      .slice(0, MAX_ALERTS);
  }, [query.data]);

  return {
    data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => {
      void query.refetch();
    },
  };
}
