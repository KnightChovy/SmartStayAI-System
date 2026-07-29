import { ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export function VerificationHeroCard({ onStart }: { onStart?: () => void }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between relative overflow-hidden h-full">
      {/* Decorative background shape */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-bl-[100%] z-0 opacity-80" />

      <div className="relative z-10">
        <div className="w-10 h-10 bg-role-partner-light text-role-partner-primary rounded-xl flex items-center justify-center mb-4">
          <ShieldCheck className="w-5 h-5" />
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">
          Verify Your Hotel
        </h1>

        <p className="text-slate-600 text-sm leading-relaxed max-w-xl mb-6">
          Complete verification to start receiving bookings on StayHub. A
          verified badge builds trust and unlocks full platform capabilities.
        </p>
      </div>

      <div className="bg-slate-50/70 rounded-xl p-5 mb-6 border border-slate-100 relative z-10">
        <div className="flex justify-between items-center mb-3">
          <span className="font-semibold text-slate-900">Current Progress</span>
          <span className="font-bold text-role-partner-primary">0%</span>
        </div>

        {/* Progress bar */}
        <Progress
          value={0}
          className="h-2.5 mb-3 bg-role-staff-light **:data-[slot=progress-indicator]:bg-role-partner-primary"
        />

        <p className="text-sm text-slate-600">
          4 steps remaining to activate your listing.
        </p>
      </div>

      <div className="relative z-10">
        <Button
          onClick={onStart}
          size="lg"
          className="bg-role-partner-primary hover:bg-role-partner-secondary cursor-pointer text-white rounded-lg px-6 h-10 text-sm font-medium transition-all shadow-sm"
        >
          Start Verification <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
