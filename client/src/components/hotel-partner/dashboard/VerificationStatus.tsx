import { ShieldCheck } from 'lucide-react';

export function VerificationStatus() {
  return (
    <div className="p-6 rounded-xl border border-role-partner-light bg-linear-to-br from-[#eff6ff] to-[#dbeafe] shadow-sm mb-6 relative overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-105">
      <div className="absolute -top-2 -right-2">
        <ShieldCheck className="w-20 h-20 text-role-partner-primary opacity-20" />
      </div>
      <div className="absolute top-6 right-6">
        <ShieldCheck className="w-5 h-5 text-role-partner-primary" />
      </div>
      
      <h3 className="text-base font-bold text-slate-900 mb-2 relative z-10">Verification Status</h3>
      <p className="text-sm text-slate-600 mb-4 max-w-[85%] relative z-10 leading-relaxed">
        Your partner account is fully verified and active on the platform.
      </p>
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-50 border border-emerald-100 relative z-10">
        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
        <span className="text-xs font-bold text-emerald-700">Active</span>
      </div>
    </div>
  );
}

