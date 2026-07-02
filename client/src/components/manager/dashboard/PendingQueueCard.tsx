import { Link } from 'react-router';
import { ClipboardList, ArrowRight } from 'lucide-react';

interface PendingQueueCardProps {
  pendingCount: number;
  isLoading: boolean;
}

/** AC-8: "Cần xử lý" — số verification chờ duyệt để manager thấy ngay việc cần làm. */
export function PendingQueueCard({ pendingCount, isLoading }: PendingQueueCardProps) {
  return (
    <div className="bg-gradient-to-br from-role-manager-primary to-role-manager-secondary rounded-xl p-6 text-white">
      <div className="flex items-center gap-2 mb-2">
        <ClipboardList className="w-5 h-5" />
        <h2 className="font-semibold">Needs your attention</h2>
      </div>
      {isLoading ? (
        <div className="h-9 w-16 bg-white/20 rounded animate-pulse mt-1" />
      ) : (
        <p className="text-4xl font-bold">{pendingCount}</p>
      )}
      <p className="text-sm text-white/80 mt-1">
        {pendingCount === 1 ? 'verification' : 'verifications'} awaiting review
      </p>
      <Link
        to="/manager/verification"
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-white/15 hover:bg-white/25 px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        Review queue <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
