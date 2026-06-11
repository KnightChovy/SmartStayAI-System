import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Landmark,
  ShieldCheck,
  Building2,
  FileCheck2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  useHotelVerifyStore,
  type HotelVerifyDraft,
} from '@/stores/hotel-verify.store';
import { useSubmitRegistration } from '@/hooks/hotel-verify/useHotelVerify';
import type { HotelRegistrationRequest } from '@/types/hotel-verify.types';

interface SummaryCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  isComplete: boolean;
  stepNumber: number;
  onNavigateToStep?: (step: number) => void;
  children: React.ReactNode;
}

const SummaryCard = ({
  icon: Icon,
  title,
  isComplete,
  stepNumber,
  onNavigateToStep,
  children,
}: SummaryCardProps) => {
  const isClickable = !!onNavigateToStep;
  const handleActivate = isClickable
    ? () => onNavigateToStep(stepNumber)
    : undefined;
  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={handleActivate}
      onKeyDown={
        isClickable
          ? e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleActivate?.();
              }
            }
          : undefined
      }
      className={cn(
        'border rounded-xl p-5 bg-slate-50/50 relative transition-all outline-none',
        isClickable && 'cursor-pointer focus-visible:ring-2 focus-visible:ring-role-partner-primary/50',
        !isComplete
          ? 'border-amber-200 hover:border-amber-400 hover:bg-amber-50/60 hover:shadow-md'
          : 'border-slate-200 hover:border-role-partner-primary/40 hover:bg-role-partner-light/10 hover:shadow-md'
      )}
    >
      <div className="absolute top-4 right-4">
        <div
          className={cn(
            'rounded-full p-1',
            isComplete
              ? 'bg-emerald-100 text-emerald-600'
              : 'bg-amber-100 text-amber-600'
          )}
        >
          {isComplete ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
          <Icon className="w-5 h-5 text-role-partner-primary" />
        </div>
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      </div>
      <div className="text-sm text-slate-600 space-y-1.5 ml-13">{children}</div>
      {isClickable && (
        <div
          className={cn(
            'mt-3 pt-3 border-t flex items-center gap-1.5 text-xs font-semibold',
            isComplete
              ? 'border-slate-100 text-role-partner-primary'
              : 'border-amber-100 text-amber-600'
          )}
        >
          <ArrowRight className="w-3 h-3" />{' '}
          {isComplete ? 'Tap to edit this step' : 'Tap to complete this step'}
        </div>
      )}
    </div>
  );
};

function buildPayload(
  draft: HotelVerifyDraft
): HotelRegistrationRequest | null {
  const {
    businessInfo,
    businessLicense,
    certificates,
    representative,
    propertyImages,
    paymentPayouts,
  } = draft;
  if (
    !businessInfo ||
    !businessLicense ||
    !certificates ||
    !representative ||
    !propertyImages ||
    !paymentPayouts
  ) {
    return null;
  }

  const so = certificates.securityOrder;
  const cl = certificates.classification;

  // Room config is collected on the Property & Rooms step; lift it to a
  // top-level `roomConfig` key and keep `propertyImages` as images only.
  const { roomConfig, ...propertyImagesDto } = propertyImages;

  return {
    businessInfo,
    businessLicense: {
      ...businessLicense,
      expiryDate: businessLicense.expiryDate ?? '',
    },
    certificates: {
      operatingLicense: certificates.operatingLicense,
      fireSafety: certificates.fireSafety,
      ...(so?.certificateNumber && so.issueDate && so.documentFileUrl
        ? {
            securityOrder: {
              certificateNumber: so.certificateNumber,
              issueDate: so.issueDate,
              documentFileUrl: so.documentFileUrl,
            },
          }
        : {}),
      ...(cl?.starRating && cl.ratingCertificateFileUrl
        ? {
            classification: {
              starRating: cl.starRating,
              ratingCertificateFileUrl: cl.ratingCertificateFileUrl,
            },
          }
        : {}),
    },
    representative,
    propertyImages: propertyImagesDto,
    roomConfig,
    paymentPayouts: {
      bankAccount: {
        ...paymentPayouts.bankAccount,
        swiftCode: paymentPayouts.bankAccount.swiftCode ?? '',
      },
      ...(paymentPayouts.taxInvoice?.taxIdVatNumber
        ? {
            taxInvoice: {
              taxIdVatNumber: paymentPayouts.taxInvoice.taxIdVatNumber!,
              registeredBusinessAddress:
                paymentPayouts.taxInvoice.registeredBusinessAddress ?? '',
            },
          }
        : {}),
    },
  };
}

export function ReviewSubmitStep({
  onBack,
  onSubmit,
  onNavigateToStep,
}: {
  onBack?: () => void;
  onSubmit?: () => void;
  onNavigateToStep?: (step: number) => void;
}) {
  const { draft, resetDraft } = useHotelVerifyStore();
  const { mutateAsync, isPending } = useSubmitRegistration();
  const [agreed, setAgreed] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    businessInfo,
    businessLicense,
    certificates,
    representative,
    propertyImages,
    paymentPayouts,
  } = draft;

  const isAllComplete = !!(
    businessInfo &&
    businessLicense &&
    certificates &&
    representative &&
    propertyImages &&
    paymentPayouts
  );

  const maskedAccount = paymentPayouts?.bankAccount.accountNumber
    ? `•••• •••• ${paymentPayouts.bankAccount.accountNumber.slice(-4)}`
    : '•••• •••• ????';

  const totalImages =
    (propertyImages?.coverImages.length ?? 0) +
    (propertyImages?.exteriorImages.length ?? 0) +
    (propertyImages?.roomImages.length ?? 0);

  const handleSubmit = async () => {
    if (!agreed || !isAllComplete) return;
    setSubmitError(null);

    const payload = buildPayload(draft);
    if (!payload) {
      setSubmitError('Please complete all steps before submitting.');
      return;
    }

    try {
      await mutateAsync(payload);
      resetDraft();
      onSubmit?.();
    } catch {
      setSubmitError(
        'Submission failed. Please check your connection and try again.'
      );
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] mt-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Review &amp; Submit
        </h2>
        <p className="text-slate-600">
          Please review all the information below before submitting your
          verification request.
        </p>
      </div>

      <div className="h-px bg-slate-100 w-full mb-8" />

      {!isAllComplete && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            Some steps are incomplete. Please go back and fill in all required
            information before submitting.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <SummaryCard
          icon={Building2}
          title="1. Business Info"
          isComplete={!!businessInfo}
          stepNumber={1}
          onNavigateToStep={onNavigateToStep}
        >
          <p>
            <span className="font-medium text-slate-900">Hotel Name:</span>{' '}
            {businessInfo?.businessName ?? '—'}
          </p>
          <p>
            <span className="font-medium text-slate-900">Property Type:</span>{' '}
            {businessInfo?.businessType ?? '—'}
          </p>
          <p>
            <span className="font-medium text-slate-900">Location:</span>{' '}
            {businessInfo ? `${businessInfo.cityProvince}` : '—'}
          </p>
        </SummaryCard>

        <SummaryCard
          icon={FileText}
          title="2. Business License"
          isComplete={!!businessLicense}
          stepNumber={2}
          onNavigateToStep={onNavigateToStep}
        >
          <p>
            <span className="font-medium text-slate-900">License No:</span>{' '}
            {businessLicense?.licenseNumber ?? '—'}{' '}
            {businessLicense?.status && (
              <span className="capitalize">({businessLicense.status})</span>
            )}
          </p>
          <p>
            <span className="font-medium text-slate-900">
              Issuing Authority:
            </span>{' '}
            {businessLicense?.authority ?? '—'}
          </p>
          {businessLicense?.documentFileUrl && (
            <p className="flex items-center gap-1.5 text-role-partner-primary mt-2 font-medium bg-role-partner-light/50 w-fit px-2 py-0.5 rounded-md">
              <FileText className="w-3.5 h-3.5" /> 1 document attached
            </p>
          )}
        </SummaryCard>

        <SummaryCard
          icon={FileCheck2}
          title="3. Accommodation Cert"
          isComplete={!!certificates}
          stepNumber={3}
          onNavigateToStep={onNavigateToStep}
        >
          <p>
            <span className="font-medium text-slate-900">
              Operating License:
            </span>{' '}
            {certificates?.operatingLicense ? 'Provided' : '—'}
          </p>
          <p>
            <span className="font-medium text-slate-900">
              Fire Safety (PCCC):
            </span>{' '}
            {certificates?.fireSafety ? 'Provided' : '—'}
          </p>
          {certificates?.securityOrder?.certificateNumber && (
            <p>
              <span className="font-medium text-slate-900">
                Security (ANTT):
              </span>{' '}
              Provided
            </p>
          )}
          <p className="flex items-center gap-1.5 text-role-partner-primary mt-2 font-medium bg-role-partner-light/50 w-fit px-2 py-0.5 rounded-md">
            <FileText className="w-3.5 h-3.5" /> 2 documents attached
          </p>
        </SummaryCard>

        <SummaryCard
          icon={ShieldCheck}
          title="4. Representative"
          isComplete={!!representative}
          stepNumber={4}
          onNavigateToStep={onNavigateToStep}
        >
          <p>
            <span className="font-medium text-slate-900">Name:</span>{' '}
            {representative?.fullName ?? '—'}
          </p>
          <p>
            <span className="font-medium text-slate-900">Role:</span>{' '}
            {representative?.role?.replace('_', ' ') ?? '—'}
          </p>
          <p>
            <span className="font-medium text-slate-900">ID Number:</span>{' '}
            {representative?.idNumber ?? '—'}
          </p>
          {representative?.idFrontImageUrl &&
            representative?.idBackImageUrl && (
              <p className="flex items-center gap-1.5 text-role-partner-primary mt-2 font-medium bg-role-partner-light/50 w-fit px-2 py-0.5 rounded-md">
                <ImageIcon className="w-3.5 h-3.5" /> Front &amp; Back ID
                attached
              </p>
            )}
        </SummaryCard>

        <SummaryCard
          icon={ImageIcon}
          title="5. Property & Rooms"
          isComplete={!!propertyImages}
          stepNumber={5}
          onNavigateToStep={onNavigateToStep}
        >
          <p>
            <span className="font-medium text-slate-900">Images:</span>{' '}
            {totalImages} uploaded
          </p>
          {propertyImages && (
            <p className="text-xs text-slate-500">
              Cover ({propertyImages.coverImages.length}), Exterior (
              {propertyImages.exteriorImages.length}), Rooms (
              {propertyImages.roomImages.length})
            </p>
          )}
          <p>
            <span className="font-medium text-slate-900">Rooms:</span>{' '}
            {propertyImages?.roomConfig
              ? `${propertyImages.roomConfig.totalRooms} rooms · ${propertyImages.roomConfig.roomTypes.length} type${
                  propertyImages.roomConfig.roomTypes.length !== 1 ? 's' : ''
                }`
              : '—'}
          </p>
          {propertyImages?.roomConfig?.roomTypes?.length ? (
            <p className="text-xs text-slate-500">
              {propertyImages.roomConfig.roomTypes
                .map(t => `${t.name || 'Unnamed'} (${t.quantity})`)
                .join(', ')}
            </p>
          ) : null}
        </SummaryCard>

        <SummaryCard
          icon={Landmark}
          title="6. Payment &amp; Payouts"
          isComplete={!!paymentPayouts}
          stepNumber={6}
          onNavigateToStep={onNavigateToStep}
        >
          <p>
            <span className="font-medium text-slate-900">Bank:</span>{' '}
            {paymentPayouts?.bankAccount.bankName ?? '—'}
          </p>
          <p>
            <span className="font-medium text-slate-900">Account:</span>{' '}
            {maskedAccount}
          </p>
          <p>
            <span className="font-medium text-slate-900">Holder:</span>{' '}
            {paymentPayouts?.bankAccount.accountHolder ?? '—'}
          </p>
        </SummaryCard>
      </div>

      <div className="bg-[#eff6ff] border border-blue-100 rounded-xl p-5 mb-8 transition-all hover:shadow-sm">
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="mt-0.5 shrink-0">
            <Checkbox
              id="terms"
              checked={agreed}
              onCheckedChange={checked => setAgreed(checked as boolean)}
              className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 border-blue-300 w-5 h-5 rounded"
            />
          </div>
          <div className="space-y-1.5 leading-none">
            <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
              I certify that all the information provided is accurate and true.
            </p>
            <p className="text-[13px] text-slate-600 leading-relaxed">
              I understand that submitting false documents may result in
              permanent ban from the SmartStay AI platform. By clicking submit,
              I also agree to the Terms of Service and Privacy Policy.
            </p>
          </div>
        </label>
      </div>

      {submitError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{submitError}</p>
        </div>
      )}

      <div className="flex justify-between items-center pt-6 border-t border-slate-100 mt-8">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="h-11 px-6 bg-white border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!agreed || !isAllComplete || isPending}
          className={cn(
            'h-11 px-8 cursor-pointer transition-all',
            agreed && isAllComplete
              ? 'bg-role-partner-primary hover:bg-role-partner-secondary text-white shadow-md hover:shadow-lg'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed border-none shadow-none'
          )}
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting…
            </>
          ) : (
            'Submit Application'
          )}
        </Button>
      </div>
    </div>
  );
}
