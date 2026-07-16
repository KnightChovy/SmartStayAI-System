import { Link } from 'react-router';
import { ShieldCheck, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatDate } from '@/utils/formatDate';
import type { DashboardVerification } from '@/types/dashboard.types';
import { VERIFICATION_STATUS_CONFIG } from './labels';
import { ListCardSkeleton, SectionEmpty, SectionError } from './states';

interface RecentVerificationsProps {
  data: DashboardVerification[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

/**
 * Hồ sơ xác minh mới nhất (`GET /hotel-partners/registrations`).
 *
 * CỐ Ý chỉ đọc, không có nút duyệt/từ chối nhanh:
 *  • Từ chối BẮT BUỘC kèm `rejectionReason` (BE 400 nếu thiếu) — không thể one-click.
 *  • Duyệt một hồ sơ nghĩa là chấp nhận giấy tờ pháp lý của khách sạn; việc đó thuộc màn
 *    Verifications, nơi có modal xem từng document. Duyệt mù từ dashboard là sai quy trình.
 * Mỗi dòng dẫn thẳng sang màn xử lý thật.
 */
export function RecentVerifications({
  data,
  isLoading,
  isError,
  onRetry,
}: RecentVerificationsProps) {
  if (isLoading) return <ListCardSkeleton rows={4} />;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-role-manager-primary" />
          <h2 className="font-semibold text-slate-900">Recent Verifications</h2>
        </div>
        <Link
          to="/manager/verification"
          className="text-xs text-role-manager-primary font-medium hover:underline"
        >
          View all →
        </Link>
      </div>

      {isError ? (
        <SectionError onRetry={onRetry} />
      ) : !data || data.length === 0 ? (
        <SectionEmpty
          icon={ShieldCheck}
          title="No verification requests"
          description="New submissions will show up here."
        />
      ) : (
        <div className="space-y-1">
          {data.map(v => {
            const cfg = VERIFICATION_STATUS_CONFIG[v.status];
            return (
              <Link
                key={v.id}
                to="/manager/verification"
                className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-role-manager-primary"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{v.hotelName}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {v.partnerName} · {formatDate(v.submittedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', cfg.class)}
                  >
                    {cfg.label}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
