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
    { id: 5, label: 'Property & Rooms' },
    { id: 6, label: 'Payment & Payouts' },
    { id: 7, label: 'Review & Submit' },
  ];

  return (
    <div className="w-full mb-8 sm:mb-10">
      <div className="flex items-start justify-between w-full">
        {steps.map((step, index) => {
          const isActive = currentStep === step.id;
          const isPast = currentStep > step.id;

          return (
            <React.Fragment key={step.id}>
              {/* Step Item — circle + label stacked in normal flow */}
              <div className="flex flex-col items-center gap-2 shrink-0 w-14 sm:w-20 md:w-28">
                <div
                  className={cn(
                    'flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-semibold border-2 transition-all bg-white shrink-0',
                    isPast
                      ? 'bg-role-partner-primary border-role-partner-primary text-white'
                      : isActive
                        ? 'border-role-partner-primary text-role-partner-primary ring-4 ring-role-partner-light'
                        : 'border-slate-300 text-slate-400'
                  )}
                >
                  {isPast ? (
                    <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                  ) : (
                    step.id
                  )}
                </div>

                {/* Text Label — always visible, wraps within the column */}
                <span
                  className={cn(
                    'text-[9px] sm:text-[10px] md:text-xs text-center leading-tight',
                    isActive
                      ? 'text-role-partner-primary font-bold'
                      : isPast
                        ? 'text-slate-600 font-medium'
                        : 'text-slate-400 font-medium'
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connecting Line — aligned to circle vertical center */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mt-3.5 sm:mt-4 mx-0.5 sm:mx-1 transition-colors min-w-2',
                    isPast ? 'bg-role-partner-primary' : 'bg-slate-200'
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
