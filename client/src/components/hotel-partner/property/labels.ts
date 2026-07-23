import type {
  ChargeFrequency,
  ChargeType,
  ContactType,
  DistanceUnit,
  NearbyCategory,
  PhoneType,
  TransportType,
} from '@/types/hotel-property.types';
import type { BedType } from '@/types/hotel-management.types';
import type { PillTone } from '@/components/hotel-partner/shared/Pill';

interface Opt<T> {
  value: T;
  label: string;
}

/** Nhãn hiển thị của một giá trị enum, dựa trên danh sách option tương ứng. */
export function optionLabel<T extends string>(options: Opt<T>[], value: T): string {
  return options.find(o => o.value === value)?.label ?? value;
}

export const CONTACT_TYPE_OPTIONS: Opt<ContactType>[] = [
  { value: 'general', label: 'General' },
  { value: 'physical_location', label: 'Physical location' },
  { value: 'availability', label: 'Availability' },
  { value: 'invoices', label: 'Invoices' },
];

export const CONTACT_TYPE_TONE: Record<ContactType, PillTone> = {
  general: 'slate',
  physical_location: 'blue',
  availability: 'emerald',
  invoices: 'violet',
};

export const PHONE_TYPE_OPTIONS: Opt<PhoneType>[] = [
  { value: 'voice', label: 'Voice' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'fax', label: 'Fax' },
];

export const CHARGE_TYPE_OPTIONS: Opt<ChargeType>[] = [
  { value: 'tax', label: 'Tax' },
  { value: 'fee', label: 'Fee' },
];

export const CHARGE_TYPE_TONE: Record<ChargeType, PillTone> = {
  tax: 'violet',
  fee: 'slate',
};

export const CHARGE_FREQUENCY_OPTIONS: Opt<ChargeFrequency>[] = [
  { value: 'per_stay', label: 'Per stay' },
  { value: 'per_night', label: 'Per night' },
  { value: 'per_person', label: 'Per person' },
  { value: 'per_person_per_night', label: 'Per person / night' },
];

export const NEARBY_CATEGORY_OPTIONS: Opt<NearbyCategory>[] = [
  { value: 'attraction', label: 'Attraction' },
  { value: 'beach', label: 'Beach' },
  { value: 'airport', label: 'Airport' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'public_transport', label: 'Public transport' },
  { value: 'landmark', label: 'Landmark' },
  { value: 'nature', label: 'Nature' },
];

export const NEARBY_CATEGORY_TONE: Record<NearbyCategory, PillTone> = {
  attraction: 'violet',
  beach: 'blue',
  airport: 'slate',
  restaurant: 'amber',
  public_transport: 'blue',
  landmark: 'violet',
  nature: 'emerald',
};

export const DISTANCE_UNIT_OPTIONS: Opt<DistanceUnit>[] = [
  { value: 'km', label: 'km' },
  { value: 'miles', label: 'miles' },
];

export const TRANSPORT_TYPE_OPTIONS: Opt<TransportType>[] = [
  { value: 'walk', label: 'Walk' },
  { value: 'car', label: 'Car' },
  { value: 'public_transport', label: 'Public transport' },
  { value: 'taxi', label: 'Taxi' },
  { value: 'shuttle', label: 'Shuttle' },
];

export const BED_TYPE_OPTIONS: Opt<BedType>[] = [
  { value: 'single', label: 'Single' },
  { value: 'double', label: 'Double' },
  { value: 'queen', label: 'Queen' },
  { value: 'king', label: 'King' },
  { value: 'sofa_bed', label: 'Sofa bed' },
  { value: 'bunk', label: 'Bunk' },
];
