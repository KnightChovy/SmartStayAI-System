import React from 'react';
import { Button } from '@/components/ui/button';
import { Hourglass, CheckCircle2, Search, Loader2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerificationCenterProps {
  onVerifyNew: () => void;
}

export function VerificationCenter({ onVerifyNew }: VerificationCenterProps) {
  const tabs = ['Pending Review', 'Approved', 'Need More Info', 'Rejected'];

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Verification Center</h1>
          <p className="text-sm text-slate-600">Track the status of your property verification and manage required documents.</p>
        </div>
        <Button 
          onClick={onVerifyNew}
          className="h-10 px-5 text-sm font-semibold bg-role-partner-primary hover:bg-role-partner-secondary text-white cursor-pointer transition-transform hover:scale-105 duration-300 shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" /> Verify New Hotel
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-slate-200 mb-6 overflow-x-auto whitespace-nowrap pb-1">
        {tabs.map((tab, idx) => (
          <button 
            key={idx} 
            className={cn(
              "pb-3 text-[13px] font-semibold transition-colors relative cursor-pointer",
              idx === 0 
                ? "text-blue-700" 
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            {tab}
            {idx === 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-700 rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Status Card */}
      <div className="border border-slate-200 rounded-xl p-5 md:p-6 bg-white shadow-sm max-w-3xl">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8 border-b border-slate-100 pb-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0 border border-amber-200">
              <Hourglass className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-bold text-slate-900">Review in Progress</h2>
                <span className="bg-amber-100 text-amber-700 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border border-amber-200">Pending</span>
              </div>
              <p className="text-[13px] text-slate-600">Your documents are being reviewed by our team.</p>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 md:mt-0 mt-2 self-start md:self-auto">
            Est. completion: 24-48 hours
          </div>
        </div>

        {/* Timeline */}
        <div className="pl-1 space-y-6 relative">
          {/* Vertical Line Background */}
          <div className="absolute left-[19px] top-4 bottom-4 w-px bg-slate-200" />
          
          {/* Step 1: Documents Submitted */}
          <div className="flex gap-4 relative z-10">
            <div className="w-8 h-8 rounded-full bg-emerald-100 border-2 border-white shadow-sm flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-0.5">Documents Submitted</h3>
              <p className="text-[13px] text-slate-600 mb-1.5">You successfully uploaded 5 required documents.</p>
              <p className="text-[11px] font-medium text-slate-400">Oct 12, 10:45 AM</p>
            </div>
          </div>

          {/* Step 2: Under Review */}
          <div className="flex gap-4 relative z-10">
            <div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-white shadow-sm flex items-center justify-center shrink-0 mt-0.5 ring-4 ring-blue-50">
              <Search className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-blue-700 mb-0.5">Under Review</h3>
              <p className="text-[13px] text-slate-600 mb-2">Our compliance team is currently verifying your business details.</p>
              <div className="flex items-center gap-1.5 text-[13px] font-semibold text-blue-600">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking Business License...
              </div>
            </div>
          </div>

          {/* Step 3: Final Approval */}
          <div className="flex gap-4 relative z-10 opacity-50">
            <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-400 mb-0.5">Final Approval</h3>
              <p className="text-[13px] text-slate-400">Profile activation upon successful review.</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
