import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, CheckCircle2, FileText, Image as ImageIcon, Landmark, ShieldCheck, Building2, FileCheck2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SummaryCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}

const SummaryCard = ({ icon: Icon, title, children }: SummaryCardProps) => (
  <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 relative hover:border-role-partner-light hover:bg-role-partner-light/10 transition-colors">
    <div className="absolute top-4 right-4">
      <div className="bg-emerald-100 text-emerald-600 rounded-full p-1">
        <CheckCircle2 className="w-4 h-4" />
      </div>
    </div>
    <div className="flex items-center gap-3 mb-3">
      <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
        <Icon className="w-5 h-5 text-role-partner-primary" />
      </div>
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
    </div>
    <div className="text-sm text-slate-600 space-y-1.5 ml-[52px]">
      {children}
    </div>
  </div>
);

export function ReviewSubmitStep({ onBack, onSubmit }: { onBack?: () => void, onSubmit?: () => void }) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="w-full bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] mt-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Review & Submit</h2>
        <p className="text-slate-600">
          Please review all the information below before submitting your verification request.
        </p>
      </div>

      <div className="h-px bg-slate-100 w-full mb-8" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        
        <SummaryCard icon={Building2} title="1. Business Info">
          <p><span className="font-medium text-slate-900">Hotel Name:</span> Global Stay Hotel</p>
          <p><span className="font-medium text-slate-900">Property Type:</span> Hotel</p>
          <p><span className="font-medium text-slate-900">Location:</span> Hanoi, Vietnam</p>
        </SummaryCard>

        <SummaryCard icon={FileText} title="2. Business License">
          <p><span className="font-medium text-slate-900">License No:</span> 1234567890 (Active)</p>
          <p><span className="font-medium text-slate-900">Issuing Authority:</span> Dept of Planning & Investment</p>
          <p className="flex items-center gap-1.5 text-role-partner-primary mt-2 font-medium bg-role-partner-light/50 w-fit px-2 py-0.5 rounded-md"><FileText className="w-3.5 h-3.5" /> 1 document attached</p>
        </SummaryCard>

        <SummaryCard icon={FileCheck2} title="3. Accommodation Cert">
          <p><span className="font-medium text-slate-900">Operating License:</span> Provided</p>
          <p><span className="font-medium text-slate-900">Fire Safety (PCCC):</span> Provided</p>
          <p className="flex items-center gap-1.5 text-role-partner-primary mt-2 font-medium bg-role-partner-light/50 w-fit px-2 py-0.5 rounded-md"><FileText className="w-3.5 h-3.5" /> 2 documents attached</p>
        </SummaryCard>

        <SummaryCard icon={ShieldCheck} title="4. Representative">
          <p><span className="font-medium text-slate-900">Name:</span> Nguyen Van A</p>
          <p><span className="font-medium text-slate-900">Role:</span> Owner</p>
          <p><span className="font-medium text-slate-900">ID Number:</span> 012345678912</p>
          <p className="flex items-center gap-1.5 text-role-partner-primary mt-2 font-medium bg-role-partner-light/50 w-fit px-2 py-0.5 rounded-md"><ImageIcon className="w-3.5 h-3.5" /> Front & Back ID attached</p>
        </SummaryCard>

        <SummaryCard icon={ImageIcon} title="5. Property Images">
          <p><span className="font-medium text-slate-900">Total Uploaded:</span> 5 images</p>
          <p>Includes Cover, Exterior, and 3 Room images.</p>
        </SummaryCard>

        <SummaryCard icon={Landmark} title="6. Payment & Payouts">
          <p><span className="font-medium text-slate-900">Bank:</span> Vietcombank</p>
          <p><span className="font-medium text-slate-900">Account:</span> •••• •••• 0000</p>
          <p><span className="font-medium text-slate-900">Holder:</span> Global Stay</p>
        </SummaryCard>

      </div>

      <div className="bg-[#eff6ff] border border-blue-100 rounded-xl p-5 mb-8 transition-all hover:shadow-sm">
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="mt-0.5 shrink-0">
            <Checkbox 
              id="terms" 
              checked={agreed} 
              onCheckedChange={(checked) => setAgreed(checked as boolean)} 
              className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 border-blue-300 w-5 h-5 rounded" 
            />
          </div>
          <div className="space-y-1.5 leading-none">
            <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
              I certify that all the information provided is accurate and true.
            </p>
            <p className="text-[13px] text-slate-600 leading-relaxed">
              I understand that submitting false documents may result in permanent ban from the SmartStay AI platform. By clicking submit, I also agree to the Terms of Service and Privacy Policy.
            </p>
          </div>
        </label>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center pt-6 border-t border-slate-100 mt-8">
        <Button type="button" variant="outline" onClick={onBack} className="h-11 px-6 bg-white border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div className="flex items-center gap-4">
          <Button 
            type="button" 
            onClick={() => {
              if (agreed && onSubmit) {
                onSubmit();
              }
            }} 
            disabled={!agreed}
            className={cn(
              "h-11 px-8 cursor-pointer transition-all",
              agreed 
                ? "bg-role-partner-primary hover:bg-role-partner-secondary text-white shadow-md hover:shadow-lg" 
                : "bg-slate-200 text-slate-400 cursor-not-allowed border-none shadow-none"
            )}
          >
            Submit Application
          </Button>
        </div>
      </div>
    </div>
  );
}
