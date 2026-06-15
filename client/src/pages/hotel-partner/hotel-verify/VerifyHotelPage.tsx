import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { VerificationHeroCard } from '../../../components/hotel-partner/hotel-verify/VerificationHeroCard';
import { VerificationBenefitsCard } from '../../../components/hotel-partner/hotel-verify/VerificationBenefitsCard';
import { VerificationStepsCard } from '../../../components/hotel-partner/hotel-verify/VerificationStepsCard';
import { VerificationStepper } from '../../../components/hotel-partner/hotel-verify/VerificationStepper';
import { BusinessInfoStep } from '../../../components/hotel-partner/hotel-verify/BusinessInfoStep';
import { PropertyDetailsStep } from '../../../components/hotel-partner/hotel-verify/PropertyDetailsStep';
import { AccommodationCertificateStep } from '../../../components/hotel-partner/hotel-verify/AccommodationCertificateStep';
import { RepresentativeVerificationStep } from '../../../components/hotel-partner/hotel-verify/RepresentativeVerificationStep';
import { PropertyImagesStep } from '../../../components/hotel-partner/hotel-verify/PropertyImagesStep';
import { PaymentPayoutsStep } from '../../../components/hotel-partner/hotel-verify/PaymentPayoutsStep';
import { ReviewSubmitStep } from '../../../components/hotel-partner/hotel-verify/ReviewSubmitStep';
import { VerificationCenter } from '../../../components/hotel-partner/hotel-verify/VerificationCenter';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGetApplicationById } from '@/hooks/hotel-verify';

export default function VerifyHotelPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const applicationId = searchParams.get('applicationId');
  const urlStep = parseInt(searchParams.get('step') || '0', 10);
  
  const [step, setStep] = useState(urlStep);
  const [hasSubmitted, setHasSubmitted] = useState(!applicationId && step === 0);

  
  useEffect(() => {
    if (urlStep !== step) {
      setStep(urlStep);
    }
  }, [urlStep]);

  const updateStep = (newStep: number) => {
    setStep(newStep);
    setSearchParams(prev => {
      if (newStep === 0) {
        prev.delete('step');
      } else {
        prev.set('step', newStep.toString());
      }
      return prev;
    });
  };

  const { data: application, isLoading } = useGetApplicationById(applicationId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-role-partner-primary" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-[1400px] mx-auto w-full">
      {hasSubmitted && !applicationId ? (
        <VerificationCenter onVerifyNew={() => {
          setHasSubmitted(false);
          updateStep(0);
        }} />
      ) : step === 0 ? (
        <div className="">
        
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <VerificationHeroCard onStart={() => updateStep(1)} />
            </div>
            <div className="lg:col-span-1">
              <VerificationBenefitsCard />
            </div>
          </div>

          <div className="w-full mt-4">
            <VerificationStepsCard />
          </div>
        </div>
      ) : step === 8 ? (
        <div className="w-full mx-auto max-w-[600px] animate-in fade-in zoom-in-95 duration-500 py-16 text-center">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Application Submitted!</h2>
          <p className="text-slate-600 mb-8 text-lg">
            Thank you for submitting your verification request. Our team will review your documents and respond within 2-3 business days.
          </p>
          <Button onClick={() => { 
            updateStep(0); 
            setHasSubmitted(true); 
            setSearchParams(new URLSearchParams()); // clear application id
          }} className="h-11 px-8 bg-role-partner-primary hover:bg-role-partner-secondary text-white rounded-full">
            Return to Verification Center
          </Button>
        </div>
      ) : (
        <div className="w-full mx-auto max-w-[850px] animate-in fade-in slide-in-from-bottom-4 duration-500">
          <VerificationStepper currentStep={step} />
          
          {step === 1 && (
            <BusinessInfoStep onContinue={() => updateStep(2)} />
          )}

          {step === 2 && (
            <PropertyDetailsStep onBack={() => updateStep(1)} onContinue={() => updateStep(3)} />
          )}

          {step === 3 && (
            <AccommodationCertificateStep onBack={() => updateStep(2)} onContinue={() => updateStep(4)} />
          )}

          {step === 4 && (
            <RepresentativeVerificationStep onBack={() => updateStep(3)} onContinue={() => updateStep(5)} />
          )}

          {step === 5 && (
            <PropertyImagesStep onBack={() => updateStep(4)} onContinue={() => updateStep(6)} />
          )}

          {step === 6 && (
            <PaymentPayoutsStep onBack={() => updateStep(5)} onContinue={() => updateStep(7)} />
          )}

          {step === 7 && (
            <ReviewSubmitStep onBack={() => updateStep(6)} onSubmit={() => updateStep(8)} />
          )}

          <div className="text-center mt-8 text-sm text-slate-500 font-medium">
             Need help? Contact <span className="text-role-partner-primary cursor-pointer hover:underline">Partner Support</span>
          </div>
        </div>
      )}
    </div>
  );
}
