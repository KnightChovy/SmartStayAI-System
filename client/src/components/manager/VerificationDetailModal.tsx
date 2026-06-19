import { useState } from 'react';
import {
  X,
  Building2,
  FileText,
  ShieldCheck,
  ImageIcon,
  Landmark,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  MapPin,
  Phone,
  Mail,
  Hash,
  Calendar,
  ExternalLink,
  Star,
  BedDouble,
  User,
  CreditCard,
  FileCheck2,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import {
  useGetRegistrationDetail,
  useReviewRegistration,
  useReviewDocument,
} from '@/hooks/manager/useManagerVerification';
import type { VerificationListItem } from '@/types/manager.types';
import type {
  VerificationApplication,
  VerificationDocument,
  DocumentType,
  DocumentStatus,
} from '@/types/hotel-verify.types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function fmtDate(value?: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('vi-VN');
}

function InfoRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value?: string | null;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-50 last:border-0">
      {Icon && <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />}
      <div className="min-w-0">
        <p className="text-xs text-slate-400 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-slate-800 break-words">{value}</p>
      </div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-50/60 rounded-xl border border-slate-100 p-5">
      <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  );
}

const docStatusConfig: Record<DocumentStatus, { label: string; class: string }> = {
  pending: { label: 'Pending', class: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Approved', class: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Rejected', class: 'bg-red-100 text-red-700' },
};

function DocStatusBadge({ status }: { status: DocumentStatus }) {
  const cfg = docStatusConfig[status];
  return (
    <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', cfg.class)}>
      {cfg.label}
    </span>
  );
}

// ─── Section components ───────────────────────────────────────────────────────

function HotelInfoSection({ detail }: { detail: VerificationApplication }) {
  const { hotel, partner } = detail;
  const coords =
    hotel.latitude && hotel.longitude ? `${hotel.latitude}, ${hotel.longitude}` : null;
  return (
    <div className="space-y-4">
      <SectionCard title="Business Details">
        <InfoRow label="Hotel Name" value={hotel.name} icon={Building2} />
        <InfoRow label="Business Type" value={hotel.businessType} icon={Building2} />
        <InfoRow label="Registration No." value={hotel.businessRegistrationNumber} icon={Hash} />
        <InfoRow label="Tax Code" value={hotel.taxCode} icon={Hash} />
        <InfoRow label="Star Rating" value={hotel.starRating ? `${hotel.starRating} ★` : null} icon={Star} />
      </SectionCard>
      <SectionCard title="Contact (Partner)">
        <InfoRow label="Business Name" value={partner.businessName} icon={Building2} />
        <InfoRow label="Phone" value={partner.contactPhone} icon={Phone} />
        <InfoRow label="Email" value={partner.contactEmail} icon={Mail} />
      </SectionCard>
      <SectionCard title="Address">
        <InfoRow label="Address" value={hotel.address} icon={MapPin} />
        <InfoRow label="Ward" value={hotel.ward} icon={MapPin} />
        <InfoRow label="District" value={hotel.district} icon={MapPin} />
        <InfoRow label="City / Province" value={hotel.city} icon={MapPin} />
        <InfoRow label="Country" value={hotel.country} icon={MapPin} />
        <InfoRow label="GPS Coordinates" value={coords} icon={MapPin} />
      </SectionCard>
    </div>
  );
}

function DocumentsSection({ detail }: { detail: VerificationApplication }) {
  const { mutateAsync, isPending, variables } = useReviewDocument();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleReview = async (doc: VerificationDocument, decision: 'approve' | 'reject') => {
    setPendingId(doc.id);
    try {
      await mutateAsync({ documentId: doc.id, dto: { decision } });
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* License metadata */}
      {detail.licenses.length > 0 && (
        <SectionCard title="License Details">
          <div className="space-y-4">
            {detail.licenses.map(lic => (
              <div key={lic.id} className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-sm font-semibold text-slate-800 mb-2">
                  {DOCUMENT_TYPE_LABELS[lic.licenseType]}
                </p>
                <InfoRow label="License Number" value={lic.licenseNumber} icon={FileText} />
                <InfoRow label="Certificate Number" value={lic.certificateNumber} icon={FileText} />
                <InfoRow label="Issuing Authority" value={lic.authority} icon={Building2} />
                <InfoRow label="Issue Date" value={fmtDate(lic.issueDate)} icon={Calendar} />
                <InfoRow label="Expiry Date" value={fmtDate(lic.expiryDate)} icon={Calendar} />
                <InfoRow label="Validity" value={lic.validityStatus} icon={CheckCircle2} />
                {lic.starRating && (
                  <InfoRow label="Star Rating" value={`${lic.starRating} stars`} icon={Star} />
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Documents with per-document review */}
      <SectionCard title="Submitted Documents">
        {detail.documents.length === 0 ? (
          <p className="text-sm text-slate-400 italic">No documents uploaded</p>
        ) : (
          <div className="space-y-3">
            {detail.documents.map(doc => {
              const busy = isPending && (pendingId === doc.id || variables?.documentId === doc.id);
              const replaced = !!doc.replacedById;
              return (
                <div
                  key={doc.id}
                  className="rounded-lg border border-slate-200 bg-white p-3.5"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-800">
                          {DOCUMENT_TYPE_LABELS[doc.documentType] ?? doc.documentType}
                        </p>
                        <DocStatusBadge status={doc.status} />
                        {replaced && (
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            Replaced
                          </span>
                        )}
                      </div>
                      {doc.reviewedAt && (
                        <p className="text-xs text-slate-400 mt-1">
                          Reviewed {fmtDate(doc.reviewedAt)}
                        </p>
                      )}
                    </div>
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-role-manager-primary bg-role-manager-light px-3 py-1.5 rounded-lg hover:bg-role-manager-primary/10 transition-colors shrink-0"
                    >
                      <FileText className="w-3.5 h-3.5" /> View
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  </div>

                  {doc.status === 'pending' && !replaced && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                        disabled={busy}
                        onClick={() => handleReview(doc, 'reject')}
                      >
                        {busy ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5 mr-1.5" />}
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        disabled={busy}
                        onClick={() => handleReview(doc, 'approve')}
                      >
                        {busy ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />}
                        Approve
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function RepresentativeSection({ detail }: { detail: VerificationApplication }) {
  const reps = detail.hotel.representatives;
  if (!reps?.length) return <p className="text-sm text-slate-400">No representatives</p>;
  return (
    <div className="space-y-4">
      {reps.map(rep => (
        <div key={rep.id} className="space-y-4">
          <SectionCard title="Personal Information">
            <InfoRow label="Full Name" value={rep.fullName} icon={User} />
            <InfoRow label="Role" value={typeof rep.role === 'string' ? rep.role.replace(/_/g, ' ') : rep.role} icon={User} />
            <InfoRow label="Date of Birth" value={fmtDate(rep.dateOfBirth)} icon={Calendar} />
            <InfoRow label="ID Number" value={rep.idNumber} icon={Hash} />
            <InfoRow label="Phone" value={rep.phone} icon={Phone} />
            <InfoRow label="Address" value={rep.address} icon={MapPin} />
          </SectionCard>
          <SectionCard title="Identity Documents">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'ID Card — Front', url: rep.idFrontImageUrl },
                { label: 'ID Card — Back', url: rep.idBackImageUrl },
              ].map(item => (
                <div key={item.label}>
                  <p className="text-xs text-slate-500 mb-2">{item.label}</p>
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="block aspect-[3/2] bg-slate-100 rounded-xl overflow-hidden hover:opacity-80 transition-opacity border border-slate-200">
                      <img src={item.url} alt={item.label} className="w-full h-full object-cover" />
                    </a>
                  ) : (
                    <div className="aspect-[3/2] bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-xs border border-dashed border-slate-300">
                      Not uploaded
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      ))}
    </div>
  );
}

function PropertySection({ detail }: { detail: VerificationApplication }) {
  const { images, roomConfig } = detail.hotel;
  const byCategory = (cat: string) => images.filter(img => img.imageCategory === cat);
  const groups = [
    { label: 'Cover Images', urls: byCategory('cover') },
    { label: 'Exterior Images', urls: byCategory('exterior') },
    { label: 'Room Images', urls: byCategory('room') },
  ];

  return (
    <div className="space-y-4">
      <SectionCard title="Property Images">
        <div className="space-y-5">
          {groups.map(g =>
            g.urls.length === 0 ? (
              <p key={g.label} className="text-sm text-slate-400 italic">
                No {g.label.toLowerCase()} uploaded
              </p>
            ) : (
              <div key={g.label}>
                <p className="text-xs text-slate-500 mb-2">{g.label} ({g.urls.length})</p>
                <div className="grid grid-cols-3 gap-2">
                  {g.urls.map(img => (
                    <a key={img.id} href={img.url} target="_blank" rel="noopener noreferrer" className="block aspect-video bg-slate-100 rounded-lg overflow-hidden hover:opacity-80 transition-opacity">
                      <img src={img.url} alt={img.caption ?? g.label} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </a>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      </SectionCard>

      {roomConfig && (
        <SectionCard title="Room Configuration">
          <div className="flex items-center gap-3 mb-4 p-3 bg-white rounded-lg border border-slate-200">
            <BedDouble className="w-5 h-5 text-role-manager-primary" />
            <div>
              <p className="text-xs text-slate-500">Total Rooms</p>
              <p className="text-lg font-bold text-slate-900">{roomConfig.totalRooms}</p>
            </div>
          </div>
          <div className="space-y-2">
            {roomConfig.types.map((rt, i) => (
              <div key={rt.id ?? i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <span className="text-sm text-slate-700">{rt.name || `Room Type ${i + 1}`}</span>
                <span className="text-sm font-semibold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-full">{rt.quantity} rooms</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

function PaymentSection({ detail }: { detail: VerificationApplication }) {
  const accounts = detail.hotel.payoutAccounts;
  if (!accounts?.length) return <p className="text-sm text-slate-400">No payout account</p>;
  return (
    <div className="space-y-4">
      {accounts.map(acc => (
        <SectionCard key={acc.id} title={acc.isPrimary ? 'Bank Account (Primary)' : 'Bank Account'}>
          <InfoRow label="Account Holder" value={acc.accountHolder} icon={User} />
          <InfoRow label="Bank Name" value={acc.bankName} icon={Landmark} />
          <InfoRow label="Account Number" value="•••• (encrypted)" icon={CreditCard} />
          <InfoRow label="Bank Branch" value={acc.bankBranch} icon={Building2} />
          <InfoRow label="SWIFT Code" value={acc.swiftCode} icon={Hash} />
          <InfoRow label="Tax ID / VAT" value={acc.taxIdVatNumber} icon={FileText} />
          <InfoRow label="Registered Address" value={acc.registeredBusinessAddress} icon={MapPin} />
        </SectionCard>
      ))}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

type SectionId = 'hotel' | 'documents' | 'representatives' | 'property' | 'payment';

const SECTIONS: { id: SectionId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'hotel', label: 'Hotel Info', icon: Building2 },
  { id: 'documents', label: 'Documents', icon: FileCheck2 },
  { id: 'representatives', label: 'Representatives', icon: ShieldCheck },
  { id: 'property', label: 'Property & Rooms', icon: ImageIcon },
  { id: 'payment', label: 'Payment', icon: Landmark },
];

const statusConfig = {
  pending: { label: 'Pending', class: 'bg-amber-100 text-amber-700' },
  in_review: { label: 'In Review', class: 'bg-blue-100 text-blue-700' },
  approved: { label: 'Approved', class: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Rejected', class: 'bg-red-100 text-red-700' },
};

interface Props {
  summary: VerificationListItem;
  onClose: () => void;
}

export function VerificationDetailModal({ summary, onClose }: Props) {
  const [activeSection, setActiveSection] = useState<SectionId>('hotel');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const { data: detail, isLoading, isError } = useGetRegistrationDetail(summary.id);
  const { mutateAsync, isPending } = useReviewRegistration();

  // Use the freshest status (detail overrides the list snapshot once loaded).
  const status = detail?.status ?? summary.status;
  const canReview = status === 'pending' || status === 'in_review';
  const statusCfg = statusConfig[status];
  const rejectionReason = detail?.rejectionReason ?? summary.rejectionReason;

  const handleDecision = async (decision: 'approve' | 'reject') => {
    await mutateAsync({
      requestId: summary.id,
      dto: { decision, ...(decision === 'reject' ? { rejectionReason: rejectReason } : {}) },
    });
    onClose();
  };

  const renderSection = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full py-20">
          <Loader2 className="w-8 h-8 text-role-manager-primary animate-spin" />
        </div>
      );
    }
    if (isError || !detail) {
      return (
        <div className="flex flex-col items-center justify-center h-full py-20 gap-3 text-slate-400">
          <AlertCircle className="w-8 h-8" />
          <p className="text-sm">Failed to load registration details</p>
        </div>
      );
    }
    switch (activeSection) {
      case 'hotel': return <HotelInfoSection detail={detail} />;
      case 'documents': return <DocumentsSection detail={detail} />;
      case 'representatives': return <RepresentativeSection detail={detail} />;
      case 'property': return <PropertySection detail={detail} />;
      case 'payment': return <PaymentSection detail={detail} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-role-manager-light rounded-lg shrink-0">
              <ShieldCheck className="w-5 h-5 text-role-manager-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-slate-900 truncate">{summary.hotel.name}</h2>
                <span className={cn('text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0', statusCfg.class)}>
                  {statusCfg.label}
                </span>
              </div>
              <p className="text-xs text-slate-400">{summary.partner.businessName} · {summary.hotel.city}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 shrink-0 ml-4">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body: sidebar + content */}
        <div className="flex flex-1 min-h-0">
          <nav className="w-48 shrink-0 border-r border-slate-100 py-4 px-2 flex flex-col gap-1 overflow-y-auto">
            {SECTIONS.map(s => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-all w-full',
                    activeSection === s.id
                      ? 'bg-role-manager-light text-role-manager-primary'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {s.label}
                </button>
              );
            })}
          </nav>

          <div className="flex-1 overflow-y-auto p-6">
            {renderSection()}
          </div>
        </div>

        {/* Footer: reject reason form or approve/reject buttons */}
        {canReview && (
          <div className="border-t border-slate-100 px-6 py-4 shrink-0">
            {showRejectForm ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-red-700">Reason for rejection (required)</p>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Describe why this request is being rejected..."
                  className="w-full text-sm border border-red-200 rounded-xl p-3 bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                  rows={3}
                />
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => { setShowRejectForm(false); setRejectReason(''); }}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    disabled={!rejectReason.trim() || isPending}
                    onClick={() => handleDecision('reject')}
                  >
                    {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <XCircle className="w-4 h-4 mr-2" />
                    Confirm Rejection
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400"
                  onClick={() => setShowRejectForm(true)}
                  disabled={isPending}
                >
                  <XCircle className="w-4 h-4 mr-2" /> Reject
                </Button>
                <Button
                  className="flex-1 bg-role-manager-primary hover:bg-role-manager-secondary text-white"
                  onClick={() => handleDecision('approve')}
                  disabled={isPending}
                >
                  {isPending
                    ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Approve Registration
                </Button>
              </div>
            )}
          </div>
        )}

        {!canReview && rejectionReason && (
          <div className="border-t border-slate-100 px-6 py-4 shrink-0">
            <div className="bg-red-50 border border-red-100 rounded-xl p-3">
              <p className="text-xs font-semibold text-red-600 mb-1">Rejection Reason</p>
              <p className="text-sm text-red-700">{rejectionReason}</p>
            </div>
          </div>
        )}

        {!canReview && !rejectionReason && (
          <div className="border-t border-slate-100 px-6 py-4 shrink-0 flex justify-end">
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        )}
      </div>
    </div>
  );
}
