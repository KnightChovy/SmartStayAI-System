import React, { useState } from 'react';
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
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function VerifyHotelPage() {
  const [step, setStep] = useState(0);
  const [hasSubmitted, setHasSubmitted] = useState(true);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-[1400px] mx-auto w-full">
      {hasSubmitted ? (
        <VerificationCenter onVerifyNew={() => {
          setHasSubmitted(false);
          setStep(0);
        }} />
      ) : step === 0 ? (
        <div className="">
        
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <VerificationHeroCard onStart={() => setStep(1)} />
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
          <Button onClick={() => { setStep(0); setHasSubmitted(true); }} className="h-11 px-8 bg-role-partner-primary hover:bg-role-partner-secondary text-white rounded-full">
            Return to Verification Center
          </Button>
        </div>
      ) : (
        <div className="w-full mx-auto max-w-[850px] animate-in fade-in slide-in-from-bottom-4 duration-500">
          <VerificationStepper currentStep={step} />
          
          {step === 1 && (
            <BusinessInfoStep onContinue={() => setStep(2)} />
          )}

          {step === 2 && (
            <PropertyDetailsStep onBack={() => setStep(1)} onContinue={() => setStep(3)} />
          )}

          {step === 3 && (
            <AccommodationCertificateStep onBack={() => setStep(2)} onContinue={() => setStep(4)} />
          )}

          {step === 4 && (
            <RepresentativeVerificationStep onBack={() => setStep(3)} onContinue={() => setStep(5)} />
          )}

          {step === 5 && (
            <PropertyImagesStep onBack={() => setStep(4)} onContinue={() => setStep(6)} />
          )}

          {step === 6 && (
            <PaymentPayoutsStep onBack={() => setStep(5)} onContinue={() => setStep(7)} />
          )}

          {step === 7 && (
            <ReviewSubmitStep onBack={() => setStep(6)} onSubmit={() => setStep(8)} />
          )}

          <div className="text-center mt-8 text-sm text-slate-500 font-medium">
             Need help? Contact <span className="text-role-partner-primary cursor-pointer hover:underline">Partner Support</span>
          </div>
        </div>
      )}
    </div>
  );
}
