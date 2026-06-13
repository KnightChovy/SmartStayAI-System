import { cn } from "@/lib/cn";
import { LockKeyholeOpen } from "lucide-react";

export function VerificationStepsCard() {
  const steps = [
    {
      step: "STEP 1",
      title: "Business Info",
      description: "Basic property details.",
      isActive: true,
    },
    {
      step: "STEP 2",
      title: "Business License",
      description: "Company registration docs.",
      isActive: false,
    },
    {
      step: "STEP 3",
      title: "Certificates",
      description: "Operating & safety licenses.",
      isActive: false,
    },
    {
      step: "STEP 4",
      title: "Representative",
      description: "Manager ID verification.",
      isActive: false,
    },
    {
      step: "STEP 5",
      title: "Property Images",
      description: "Upload hotel photos.",
      isActive: false,
    },
    {
      step: "STEP 6",
      title: "Banking Info",
      description: "Payout account details.",
      isActive: false,
    },
    {
      step: "STEP 7",
      title: "Review",
      description: "Final submission step.",
      isActive: false,
    }
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <h2 className="text-lg font-bold text-slate-900 mb-4">Verification Steps</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {steps.map((step, index) => (
          <div 
            key={index} 
            className={cn(
              "rounded-xl p-4 border transition-all duration-200",
              step.isActive 
                ? "bg-white border-slate-200 shadow-sm shadow-role-partner-primary/20" 
                : "bg-slate-50/50 border-transparent opacity-70 grayscale-[0.2]"
            )}
          >
            <div className="flex justify-between items-start mb-3">
              <span className={cn(
                "text-xs font-bold uppercase tracking-wider",
                step.isActive ? "text-role-partner-primary" : "text-slate-400"
              )}>
                {step.step}
              </span>
              {step.isActive && (
                <LockKeyholeOpen className="w-5 h-5 text-role-partner-primary" />
              )}
            </div>
            
            <h3 className={cn(
              "font-semibold mb-1.5 text-sm",
              step.isActive ? "text-slate-900" : "text-slate-500"
            )}>
              {step.title}
            </h3>
            
            <p className="text-[13px] text-slate-500 leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
