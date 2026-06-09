import React from 'react';
import { cn } from '@/lib/cn';
import { Check } from 'lucide-react';

interface VerificationStepperProps {
  currentStep: number;
}

export function VerificationStepper({ currentStep }: VerificationStepperProps) {
  const steps = [
    { id: 1, label: 'Business Info' },
    { id: 2, label: 'Business License' },
    { id: 3, label: 'Accommodation Certificate' },
    { id: 4, label: 'Representative Verification' },
    { id: 5, label: 'Property Images' },
    { id: 6, label: 'Payment & Payouts'},
    { id: 7, label: 'Review & Submit'}
  ];

  return (
    <div className="w-full mb-16 px-4">
      <div className="flex items-start justify-between w-full">
        {steps.map((step, index) => {
          const isActive = currentStep === step.id;
          const isPast = currentStep > step.id;

          return (
            <React.Fragment key={step.id}>
              {/* Step Item */}
              <div className="flex flex-col items-center relative z-10 flex-shrink-0">
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold border-2 transition-all bg-white",
                    isPast
                      ? "bg-role-partner-primary border-role-partner-primary text-white"
                      : isActive 
                      ? "border-role-partner-primary text-role-partner-primary ring-4 ring-role-partner-light"
                      : "border-slate-300 text-slate-400"
                  )}
                >
                  {isPast ? <Check className="w-4 h-4" /> : step.id}
                </div>
                
                {/* Text Label - Absolute positioned to not affect flex spacing of circles */}
                <span
                  className={cn(
                    "text-[10px] md:text-[11px] text-center mt-3 absolute top-full left-1/2 -translate-x-1/2 w-20 md:w-28 leading-tight",
                    isActive ? "text-role-partner-primary font-bold" : "text-slate-400 font-medium hidden md:block"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connecting Line */}
              {index < steps.length - 1 && (
                <div 
                  className={cn(
                    "flex-1 h-[2px] mt-4 mx-1 sm:mx-2 transition-colors",
                    isPast ? "bg-role-partner-primary" : "bg-slate-200"
                  )} 
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
