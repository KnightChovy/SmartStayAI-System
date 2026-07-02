import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ShieldAlert, ShieldX, Clock, ArrowRight, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PartnerVerificationState } from '@/hooks/hotel-verify';

interface GateCopy {
  icon: LucideIcon;
  tone: string;
  toneBg: string;
  title: string;
  message: string;
  cta: string;
}

const COPY: Record<Exclude<PartnerVerificationState, 'verified'>, GateCopy> = {
  none: {
    icon: ShieldAlert,
    tone: 'text-amber-600',
    toneBg: 'bg-amber-50',
    title: 'Verify your hotel first',
    message:
      'You need to register and verify your hotel before you can use the partner management features. This usually takes just a few minutes.',
    cta: 'Verify hotel now',
  },
  pending: {
    icon: Clock,
    tone: 'text-blue-600',
    toneBg: 'bg-blue-50',
    title: 'Verification in review',
    message:
      'Your verification request is being reviewed. You will be able to use the management features once it is approved.',
    cta: 'View status',
  },
  rejected: {
    icon: ShieldX,
    tone: 'text-red-600',
    toneBg: 'bg-red-50',
    title: 'Verification rejected',
    message:
      'Your verification request was rejected. Please review the feedback, update your documents and resubmit.',
    cta: 'Resubmit application',
  },
};

interface PartnerVerificationGateProps {
  state: Exclude<PartnerVerificationState, 'verified'>;
}

/**
 * Chặn nội dung trang khi partner chưa verify khách sạn: hiện panel giải thích + popup cảnh báo,
 * CTA dẫn tới trang xác minh (`/partner/verify`). Chỉ verify/profile mới đi qua được gate.
 */
export function PartnerVerificationGate({ state }: PartnerVerificationGateProps) {
  const navigate = useNavigate();
  const [popupOpen, setPopupOpen] = useState(true);
  const copy = COPY[state];
  const Icon = copy.icon;

  const goVerify = () => {
    setPopupOpen(false);
    navigate('/partner/verify');
  };

  return (
    <>
      {/* Panel chặn nội dung */}
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className={`mx-auto mb-4 flex size-14 items-center justify-center rounded-full ${copy.toneBg}`}>
            <Icon className={`w-7 h-7 ${copy.tone}`} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">{copy.title}</h2>
          <p className="mt-2 text-sm text-slate-500">{copy.message}</p>
          <Button
            onClick={goVerify}
            className="mt-6 bg-role-partner-primary hover:bg-role-partner-secondary text-white"
          >
            {copy.cta}
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      </div>

      {/* Popup cảnh báo — dựng riêng để không có header/đường kẻ như Modal dùng chung */}
      {popupOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onMouseDown={e => {
            if (e.target === e.currentTarget) setPopupOpen(false);
          }}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              onClick={() => setPopupOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-role-partner-primary"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className={`mb-5 flex size-16 items-center justify-center rounded-full ${copy.toneBg}`}>
                <Icon className={`w-8 h-8 ${copy.tone}`} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">{copy.title}</h2>
              <p className="mt-3 max-w-sm text-base leading-relaxed text-slate-500">{copy.message}</p>

              <div className="mt-7 flex w-full items-center justify-center gap-3">
                <Button variant="outline" onClick={() => setPopupOpen(false)}>
                  Later
                </Button>
                <Button
                  onClick={goVerify}
                  className="bg-role-partner-primary hover:bg-role-partner-secondary text-white"
                >
                  {copy.cta}
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
