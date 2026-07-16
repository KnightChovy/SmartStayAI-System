import { ShieldAlert, ShieldCheck, ShieldQuestion, ShieldX } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { usePartnerVerification } from '@/hooks/hotel-verify';
import type { PartnerVerificationState } from '@/hooks/hotel-verify';

const STATE_META: Record<
  PartnerVerificationState,
  { icon: LucideIcon; title: string; desc: string; badge: string; dot: string; badgeText: string; label: string }
> = {
  verified: {
    icon: ShieldCheck,
    title: 'Verification Status',
    desc: 'Your partner account is fully verified and active on the platform.',
    badge: 'bg-emerald-50 border-emerald-100',
    dot: 'bg-emerald-500',
    badgeText: 'text-emerald-700',
    label: 'Active',
  },
  pending: {
    icon: ShieldQuestion,
    title: 'Verification Status',
    desc: 'Your verification application is being reviewed. We will notify you once approved.',
    badge: 'bg-amber-50 border-amber-100',
    dot: 'bg-amber-500',
    badgeText: 'text-amber-700',
    label: 'Pending review',
  },
  rejected: {
    icon: ShieldX,
    title: 'Verification Status',
    desc: 'Your verification was rejected. Please review the feedback and resubmit.',
    badge: 'bg-red-50 border-red-100',
    dot: 'bg-red-500',
    badgeText: 'text-red-700',
    label: 'Rejected',
  },
  none: {
    icon: ShieldAlert,
    title: 'Verification Status',
    desc: 'You have not submitted a verification application yet.',
    badge: 'bg-slate-100 border-slate-200',
    dot: 'bg-slate-400',
    badgeText: 'text-slate-600',
    label: 'Not submitted',
  },
};

export function VerificationStatus() {
  const { state, isLoading } = usePartnerVerification();
  const meta = STATE_META[state];
  const Icon = meta.icon;

  return (
    <div className="p-6 rounded-xl border border-role-partner-light bg-linear-to-br from-[#eff6ff] to-[#dbeafe] shadow-sm mb-6 relative overflow-hidden transition-transform duration-300 hover:scale-105">
      <div className="absolute -top-2 -right-2">
        <Icon className="w-20 h-20 text-role-partner-primary opacity-20" />
      </div>
      <div className="absolute top-6 right-6">
        <Icon className="w-5 h-5 text-role-partner-primary" />
      </div>

      <h3 className="text-base font-bold text-slate-900 mb-2 relative z-10">{meta.title}</h3>
      <p className="text-sm text-slate-600 mb-4 max-w-[85%] relative z-10 leading-relaxed">
        {meta.desc}
      </p>
      {isLoading ? (
        <div className="h-7 w-24 rounded-md bg-white/60 animate-pulse relative z-10" />
      ) : (
        <div
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border relative z-10 ${meta.badge}`}
        >
          <div className={`w-2 h-2 rounded-full ${meta.dot}`}></div>
          <span className={`text-xs font-bold ${meta.badgeText}`}>{meta.label}</span>
        </div>
      )}
    </div>
  );
}
