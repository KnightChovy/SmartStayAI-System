import type {
  ChargeFrequency,
  ContactType,
  DistanceUnit,
  NearbyCategory,
  PhoneType,
  PolicyType,
  TransportType,
} from '@/types/hotel-property.types';
import type { BedType } from '@/types/hotel-management.types';

interface Opt<T> {
  value: T;
  label: string;
}

export const CONTACT_TYPE_OPTIONS: Opt<ContactType>[] = [
  { value: 'general', label: 'General' },
  { value: 'physical_location', label: 'Physical location' },
  { value: 'availability', label: 'Availability' },
  { value: 'invoices', label: 'Invoices' },
];

export const PHONE_TYPE_OPTIONS: Opt<PhoneType>[] = [
  { value: 'voice', label: 'Voice' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'fax', label: 'Fax' },
];

export const POLICY_TYPE_OPTIONS: Opt<PolicyType>[] = [
  { value: 'cancellation', label: 'Cancellation' },
  { value: 'tax', label: 'Tax' },
  { value: 'fee', label: 'Fee' },
  { value: 'parking', label: 'Parking' },
  { value: 'internet', label: 'Internet' },
  { value: 'deposit', label: 'Deposit' },
];

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
