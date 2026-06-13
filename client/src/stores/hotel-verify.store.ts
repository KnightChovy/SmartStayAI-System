import { create } from 'zustand';
import type {
  BusinessInfoFormValues,
  PropertyDetailsFormValues,
  AccommodationCertificateFormValues,
  RepresentativeFormValues,
  PropertyImagesFormValues,
  PaymentPayoutsFormValues,
} from '@/validations/hotel-verify.validation';

interface HotelVerifyDraft {
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
  resetDraft: () => void;
}

export const useHotelVerifyStore = create<HotelVerifyStore>((set) => ({
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
  resetDraft: () => set({ draft: {} }),
}));
