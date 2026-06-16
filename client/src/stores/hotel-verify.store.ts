import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  BusinessInfoFormValues,
  PropertyDetailsFormValues,
  AccommodationCertificateFormValues,
  RepresentativeFormValues,
  PropertyImagesFormValues,
  PaymentPayoutsFormValues,
} from '@/validations/hotel-verify.validation';
import type {
  VerificationApplication,
  DocumentType,
  LicenseType,
} from '@/types/hotel-verify.types';

export interface HotelVerifyDraft {
  businessInfo?: BusinessInfoFormValues;
  businessLicense?: PropertyDetailsFormValues;
  certificates?: AccommodationCertificateFormValues;
  representative?: RepresentativeFormValues;
  propertyImages?: PropertyImagesFormValues;
  paymentPayouts?: PaymentPayoutsFormValues;
}

interface HotelVerifyStore {
  draft: HotelVerifyDraft;
  setBusinessInfo: (data: BusinessInfoFormValues) => void;
  setBusinessLicense: (data: PropertyDetailsFormValues) => void;
  setCertificates: (data: AccommodationCertificateFormValues) => void;
  setRepresentative: (data: RepresentativeFormValues) => void;
  setPropertyImages: (data: PropertyImagesFormValues) => void;
  setPaymentPayouts: (data: PaymentPayoutsFormValues) => void;
  /** Prefill the whole draft from an existing application (edit / "Review & Fix"). */
  hydrateFromApplication: (app: VerificationApplication) => void;
  resetDraft: () => void;
}

// ── Map a fetched application (detail shape) back into the wizard draft ────────

// ISO datetime ("2020-01-15T00:00:00.000Z") → date input value ("2020-01-15").
const toDateInput = (iso?: string | null): string => (iso ? iso.slice(0, 10) : '');

export function mapApplicationToDraft(
  app: VerificationApplication
): HotelVerifyDraft {
  const { hotel, partner } = app;

  const licenseOf = (type: LicenseType) =>
    app.licenses.find(l => l.licenseType === type) ?? null;
  // The current (non-replaced) document of a type, else the latest one.
  const docUrl = (type: DocumentType): string => {
    const docs = app.documents.filter(d => d.documentType === type);
    const current = docs.find(d => !d.replacedById) ?? docs[docs.length - 1];
    return current?.fileUrl ?? '';
  };

  const images = hotel.images ?? [];
  const urlsByCategory = (cat: string) =>
    images.filter(i => i.imageCategory === cat).map(i => i.url);

  const bizLic = licenseOf('business_license');
  const opLic = licenseOf('operating_license');
  const fireLic = licenseOf('fire_safety');
  const secLic = licenseOf('security_order');
  const classLic = licenseOf('classification');
  const rep = hotel.representatives?.[0];
  const payout = hotel.payoutAccounts?.[0];

  const businessInfo: BusinessInfoFormValues = {
    businessName: hotel.name ?? '',
    businessType: (hotel.businessType as string) || 'hotel',
    businessRegistrationNumber: hotel.businessRegistrationNumber ?? '',
    taxCode: hotel.taxCode ?? undefined,
    phone: partner.contactPhone ?? '',
    email: partner.contactEmail ?? '',
    address: hotel.address ?? '',
    cityProvince: hotel.city ?? '',
    ward: hotel.ward ?? undefined,
    location: {
      lat: Number(hotel.latitude ?? 0),
      lng: Number(hotel.longitude ?? 0),
    },
  };

  const businessLicense: PropertyDetailsFormValues = {
    licenseNumber: bizLic?.licenseNumber ?? '',
    issueDate: toDateInput(bizLic?.issueDate),
    expiryDate: toDateInput(bizLic?.expiryDate) || undefined,
    authority: bizLic?.authority ?? '',
    status: (bizLic?.validityStatus ?? 'active') as
      | 'active'
      | 'pending'
      | 'expired',
    documentFileUrl: docUrl('business_license'),
  };

  const hasSecurityOrder = !!secLic || !!docUrl('security_order');
  const hasClassification = !!classLic || !!docUrl('classification');
  const certificates: AccommodationCertificateFormValues = {
    operatingLicense: {
      licenseNumber: opLic?.licenseNumber ?? '',
      issueDate: toDateInput(opLic?.issueDate),
      authority: opLic?.authority ?? '',
      documentFileUrl: docUrl('operating_license'),
    },
    fireSafety: {
      certificateNumber: fireLic?.certificateNumber ?? '',
      issueDate: toDateInput(fireLic?.issueDate),
      documentFileUrl: docUrl('fire_safety'),
    },
    ...(hasSecurityOrder
      ? {
          securityOrder: {
            certificateNumber: secLic?.certificateNumber ?? undefined,
            issueDate: toDateInput(secLic?.issueDate) || undefined,
            documentFileUrl: docUrl('security_order') || undefined,
          },
        }
      : {}),
    ...(hasClassification
      ? {
          classification: {
            starRating: classLic?.starRating ?? undefined,
            ratingCertificateFileUrl: docUrl('classification') || undefined,
          },
        }
      : {}),
  };

  const representative: RepresentativeFormValues | undefined = rep
    ? {
        fullName: rep.fullName ?? '',
        role: (rep.role ?? 'owner') as RepresentativeFormValues['role'],
        dob: toDateInput(rep.dateOfBirth),
        idNumber: rep.idNumber ?? '',
        phone: rep.phone ?? '',
        address: rep.address ?? '',
        idFrontImageUrl: rep.idFrontImageUrl ?? '',
        idBackImageUrl: rep.idBackImageUrl ?? '',
      }
    : undefined;

  const propertyImages: PropertyImagesFormValues = {
    coverImages: urlsByCategory('cover'),
    exteriorImages: urlsByCategory('exterior'),
    roomImages: urlsByCategory('room'),
    roomConfig: {
      totalRooms: hotel.roomConfig?.totalRooms ?? 0,
      roomTypes: (hotel.roomConfig?.types ?? []).map(t => ({
        name: t.name,
        quantity: t.quantity,
      })),
    },
  };

  const hasTaxInvoice =
    !!payout?.taxIdVatNumber || !!payout?.registeredBusinessAddress;
  const paymentPayouts: PaymentPayoutsFormValues = {
    bankAccount: {
      accountHolder: payout?.accountHolder ?? '',
      bankName: payout?.bankName ?? '',
      // Account number is encrypted server-side and never returned — must be re-entered.
      accountNumber: '',
      bankBranch: payout?.bankBranch ?? '',
      swiftCode: payout?.swiftCode ?? undefined,
    },
    ...(hasTaxInvoice
      ? {
          taxInvoice: {
            taxIdVatNumber: payout?.taxIdVatNumber ?? undefined,
            registeredBusinessAddress:
              payout?.registeredBusinessAddress ?? undefined,
          },
        }
      : {}),
  };

  return {
    businessInfo,
    businessLicense,
    certificates,
    representative,
    propertyImages,
    paymentPayouts,
  };
}

export const useHotelVerifyStore = create<HotelVerifyStore>()(
  persist(
    (set) => ({
      draft: {},
      setBusinessInfo: (businessInfo) =>
        set((state) => ({ draft: { ...state.draft, businessInfo } })),
      setBusinessLicense: (businessLicense) =>
        set((state) => ({ draft: { ...state.draft, businessLicense } })),
      setCertificates: (certificates) =>
        set((state) => ({ draft: { ...state.draft, certificates } })),
      setRepresentative: (representative) =>
        set((state) => ({ draft: { ...state.draft, representative } })),
      setPropertyImages: (propertyImages) =>
        set((state) => ({ draft: { ...state.draft, propertyImages } })),
      setPaymentPayouts: (paymentPayouts) =>
        set((state) => ({ draft: { ...state.draft, paymentPayouts } })),
      hydrateFromApplication: (app) =>
        set({ draft: mapApplicationToDraft(app) }),
      resetDraft: () => set({ draft: {} }),
    }),
    {
      name: 'hotel-verify-draft',
      storage: createJSONStorage(() => localStorage),
      // Only persist the accumulated draft, not the action functions.
      partialize: (state) => ({ draft: state.draft }),
    }
  )
);
