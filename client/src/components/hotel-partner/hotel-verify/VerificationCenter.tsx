import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Hourglass,
  CheckCircle2,
  Search,
  Loader2,
  Plus,
  AlertCircle,
  Upload,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatDate } from '@/utils/formatDate';
import { DetailSkeleton } from '@/components/shared/skeletons';
import { useGetApplications } from '@/hooks/hotel-verify';
import { useNavigate } from 'react-router';
import type {
  VerificationStatus,
  VerificationApplication,
  VerificationDocument,
  DocumentType,
} from '@/types/hotel-verify.types';
import {
  useReplaceDocument,
  useUploadFile,
} from '@/hooks/hotel-verify/useHotelVerify';

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  business_license: 'Business License',
  operating_license: 'Operating License',
  fire_safety: 'Fire Safety Certificate (PCCC)',
  security_order: 'Security Order (ANTT)',
  classification: 'Star Classification',
  tax_certificate: 'Tax Certificate',
  owner_id: 'Owner ID',
  property_proof: 'Property Proof',
};

const STATUS_TABS: { label: string; status: VerificationStatus }[] = [
  { label: 'Pending Review', status: 'pending' },
  { label: 'In Review', status: 'in_review' },
  { label: 'Approved', status: 'approved' },
  { label: 'Rejected', status: 'rejected' },
];

interface VerificationCenterProps {
  onVerifyNew: () => void;
}

// One rejected document → upload a new file then call the replace endpoint.
function RejectedDocumentRow({ doc }: { doc: VerificationDocument }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const uploadFile = useUploadFile();
  const replaceDocument = useReplaceDocument();
  const busy = uploadFile.isPending || replaceDocument.isPending;

  const handleFile = async (file?: File) => {
    if (!file) return;
    setError(null);
    try {
      const fileUrl = await uploadFile.mutateAsync(file);
      await replaceDocument.mutateAsync({ documentId: doc.id, fileUrl });
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-red-100 bg-white p-3">
      <div className="flex items-center gap-2 min-w-0">
        <FileText className="w-4 h-4 text-red-500 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">
            {DOCUMENT_TYPE_LABELS[doc.documentType] ?? doc.documentType}
          </p>
          <p className="text-xs text-red-600">Rejected — please resubmit</p>
          {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={e => handleFile(e.target.files?.[0])}
      />
      <Button
        size="sm"
        variant="outline"
        className="shrink-0 border-red-200 text-red-600 hover:bg-red-50"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? (
          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
        ) : (
          <Upload className="w-3.5 h-3.5 mr-1.5" />
        )}
        Resubmit
      </Button>
    </div>
  );
}

function RejectedDocumentsCard({
  application,
}: {
  application: VerificationApplication;
}) {
  // Only documents currently rejected and not already replaced.
  const rejected = application.documents.filter(
    d => d.status === 'rejected' && !d.replacedById
  );
  if (rejected.length === 0) return null;

  return (
    <div className="mt-5 border border-red-200 rounded-xl p-5 bg-red-50/40 max-w-3xl">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="w-4 h-4 text-red-600" />
        <h3 className="text-sm font-bold text-red-700">
          Documents to Resubmit ({rejected.length})
        </h3>
      </div>
      <div className="space-y-2">
        {rejected.map(doc => (
          <RejectedDocumentRow key={doc.id} doc={doc} />
        ))}
      </div>
    </div>
  );
}

export function VerificationCenter({ onVerifyNew }: VerificationCenterProps) {
  const { data: applications, isLoading } = useGetApplications();
  const navigate = useNavigate();
  // null = follow the latest application's status; otherwise the user-picked tab.
  const [activeTab, setActiveTab] = useState<VerificationStatus | null>(null);

  const handleEdit = (appId: string) => {
    // Navigate to the form, finding the first rejected or pending step would be ideal
    // For now, let's just go to step 1
    navigate(`?applicationId=${appId}&step=1`);
  };

  if (isLoading) {
    return <DetailSkeleton className="min-h-100" />;
  }

  const hasAnyApp = (applications?.length ?? 0) > 0;
  // Applications are returned newest-first; default the active tab to the latest one's status.
  const activeStatus: VerificationStatus =
    activeTab ?? applications?.[0]?.status ?? 'pending';
  // Show the newest application matching the active tab.
  const displayApp = applications?.find(a => a.status === activeStatus) ?? null;

  const needsAction = activeStatus === 'rejected';
  const isApproved = activeStatus === 'approved';

  const statusLabel = ((): string => {
    switch (activeStatus) {
      case 'approved':
        return 'APPROVED';
      case 'rejected':
        return 'REJECTED';
      case 'in_review':
        return 'IN REVIEW';
      default:
        return 'PENDING';
    }
  })();

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            Verification Center
          </h1>
          <p className="text-sm text-slate-600">
            Track the status of your property verification and manage required
            documents.
          </p>
        </div>
        <Button
          onClick={onVerifyNew}
          className="h-10 px-5 text-sm font-semibold bg-role-partner-primary hover:bg-role-partner-secondary text-white cursor-pointer transition-transform hover:scale-105 duration-300 shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" /> Verify New Hotel
        </Button>
      </div>

      {/* Tabs */}
      {hasAnyApp && (
        <div className="flex items-center gap-6 border-b border-slate-200 mb-6 overflow-x-auto whitespace-nowrap pb-1">
          {STATUS_TABS.map(tab => {
            const active = tab.status === activeStatus;
            const count =
              applications?.filter(a => a.status === tab.status).length ?? 0;
            return (
              <button
                key={tab.status}
                onClick={() => setActiveTab(tab.status)}
                className={cn(
                  'pb-3 text-[13px] font-semibold transition-colors relative cursor-pointer',
                  active
                    ? 'text-blue-700'
                    : 'text-slate-500 hover:text-slate-800'
                )}
              >
                {tab.label}
                {count > 0 && (
                  <span
                    className={cn(
                      'ml-1.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full',
                      active
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-500'
                    )}
                  >
                    {count}
                  </span>
                )}
                {active && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-700 rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Status Card */}
      {displayApp ? (
        <div className="border border-slate-200 rounded-xl p-5 md:p-6 bg-white shadow-sm max-w-3xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8 border-b border-slate-100 pb-5">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center shrink-0 border',
                  needsAction
                    ? 'bg-red-100 border-red-200'
                    : isApproved
                      ? 'bg-emerald-100 border-emerald-200'
                      : 'bg-amber-100 border-amber-200'
                )}
              >
                {needsAction ? (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                ) : isApproved ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Hourglass className="w-5 h-5 text-amber-600" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-bold text-slate-900">
                    {needsAction
                      ? 'Action Required'
                      : isApproved
                        ? 'Verification Approved'
                        : 'Review in Progress'}
                  </h2>
                  <span
                    className={cn(
                      'text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border',
                      needsAction
                        ? 'bg-red-100 text-red-700 border-red-200'
                        : isApproved
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                          : 'bg-amber-100 text-amber-700 border-amber-200'
                    )}
                  >
                    {statusLabel}
                  </span>
                </div>
                <p className="text-[13px] text-slate-600">
                  {needsAction
                    ? 'Some parts of your application require attention.'
                    : isApproved
                      ? 'Your property has been verified and is now active.'
                      : 'Your documents are being reviewed by our team.'}
                </p>
              </div>
            </div>

            {needsAction ? (
              <Button
                onClick={() => handleEdit(displayApp.id)}
                size="sm"
                className="bg-role-partner-primary hover:bg-role-partner-secondary text-white"
              >
                Review & Fix
              </Button>
            ) : (
              <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 md:mt-0 mt-2 self-start md:self-auto">
                {isApproved ? 'Verified' : 'Est. completion: 24-48 hours'}
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="pl-1 space-y-6 relative">
            {/* Vertical Line Background */}
            <div className="absolute left-4.75 top-4 bottom-4 w-px bg-slate-200" />

            {/* Step 1: Documents Submitted */}
            <div className="flex gap-4 relative z-10">
              <div className="w-8 h-8 rounded-full bg-emerald-100 border-2 border-white shadow-sm flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-0.5">
                  Documents Submitted
                </h3>
                <p className="text-[13px] text-slate-600 mb-1.5">
                  You successfully uploaded required documents.
                </p>
                {displayApp.submittedAt && (
                  <p className="text-[11px] font-medium text-slate-400">
                    {formatDate(displayApp.submittedAt)}
                  </p>
                )}
              </div>
            </div>

            {/* Step 2: Under Review */}
            <div className="flex gap-4 relative z-10">
              <div
                className={cn(
                  'w-8 h-8 rounded-full border-2 border-white shadow-sm flex items-center justify-center shrink-0 mt-0.5',
                  isApproved
                    ? 'bg-emerald-100'
                    : 'bg-blue-600 ring-4 ring-blue-50'
                )}
              >
                {isApproved ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Search className="w-4 h-4 text-white" />
                )}
              </div>
              <div>
                <h3
                  className={cn(
                    'text-sm font-bold mb-0.5',
                    isApproved ? 'text-slate-900' : 'text-blue-700'
                  )}
                >
                  Under Review
                </h3>
                <p className="text-[13px] text-slate-600 mb-2">
                  Our compliance team is currently verifying your business
                  details.
                </p>
                {needsAction && (
                  <div className="bg-red-50 border border-red-100 p-3 rounded-md mt-2">
                    <p className="text-sm text-red-800 font-medium flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> Application needs
                      attention
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                      {displayApp.rejectionReason ||
                        'Please review and update your application.'}
                    </p>
                    <Button
                      onClick={() => handleEdit(displayApp.id)}
                      variant="link"
                      className="text-red-700 h-auto p-0 text-xs mt-2 font-bold"
                    >
                      Fix Now &rarr;
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Final Approval */}
            <div
              className={cn(
                'flex gap-4 relative z-10',
                isApproved ? '' : 'opacity-50'
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full border-2 border-white shadow-sm flex items-center justify-center shrink-0 mt-0.5',
                  isApproved ? 'bg-emerald-100' : 'bg-slate-100'
                )}
              >
                <CheckCircle2
                  className={cn(
                    'w-4 h-4',
                    isApproved ? 'text-emerald-600' : 'text-slate-400'
                  )}
                />
              </div>
              <div>
                <h3
                  className={cn(
                    'text-sm font-bold mb-0.5',
                    isApproved ? 'text-slate-900' : 'text-slate-400'
                  )}
                >
                  Final Approval
                </h3>
                <p
                  className={cn(
                    'text-[13px]',
                    isApproved ? 'text-slate-600' : 'text-slate-400'
                  )}
                >
                  Profile activation upon successful review.
                </p>
              </div>
            </div>
          </div>

          {/* Resubmit rejected documents (API #7) */}
          <RejectedDocumentsCard application={displayApp} />
        </div>
      ) : !hasAnyApp ? (
        <div className="border border-slate-200 rounded-xl p-10 bg-slate-50 text-center max-w-3xl border-dashed">
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            No Verification Applications
          </h3>
          <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
            You haven't submitted any properties for verification yet. Start the
            process to get your hotel listed.
          </p>
          <Button
            onClick={onVerifyNew}
            className="bg-role-partner-primary hover:bg-role-partner-secondary text-white"
          >
            <Plus className="w-4 h-4 mr-2" /> Start Verification
          </Button>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl p-10 bg-slate-50 text-center max-w-3xl border-dashed">
          <h3 className="text-base font-semibold text-slate-700 mb-2">
            No {statusLabel.toLowerCase()} applications
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            You don't have any applications in this status.
          </p>
        </div>
      )}
    </div>
  );
}
