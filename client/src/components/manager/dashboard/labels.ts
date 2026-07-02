import { AlertTriangle, Clock, XCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AlertSeverity, VerificationStatus } from '@/types/dashboard.types';

/** Design token màu trạng thái verification — dùng nhất quán toàn dashboard (AC-5). */
export const VERIFICATION_STATUS_CONFIG: Record<
  VerificationStatus,
  { label: string; class: string }
> = {
  pending: { label: 'Pending', class: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Approved', class: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Rejected', class: 'bg-red-100 text-red-700' },
};

export const ALERT_SEVERITY_CONFIG: Record<
  AlertSeverity,
  { label: string; class: string; icon: LucideIcon }
> = {
  high: { label: 'High', class: 'bg-red-100 text-red-700', icon: XCircle },
  medium: { label: 'Medium', class: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
  low: { label: 'Low', class: 'bg-slate-100 text-slate-600', icon: Clock },
};
