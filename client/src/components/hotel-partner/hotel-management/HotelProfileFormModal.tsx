import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/hotel-partner/shared/Modal';
import {
  TextField,
  TextareaField,
  SelectField,
  ToggleField,
  type SelectOption,
} from '@/components/hotel-partner/shared/form-controls';
import {
  hotelProfileFormSchema,
  type HotelProfileFormValues,
} from '@/validations/hotel-management.validation';
import { useUpdateHotel } from '@/hooks/hotels';
import { errorMessage } from '@/utils/errorMessage';
import type { UpdateHotelDto } from '@/types/hotel.types';
import type { ManagedHotel } from '@/types/hotel-management.types';

interface HotelProfileFormModalProps {
  open: boolean;
  onClose: () => void;
  hotel: ManagedHotel;
}

const STAR_OPTIONS: SelectOption[] = [1, 2, 3, 4, 5].map(n => ({
  value: String(n),
  label: `${n} star${n > 1 ? 's' : ''}`,
}));

const BUSINESS_TYPE_OPTIONS: SelectOption[] = [
  { value: 'hotel', label: 'Hotel' },
  { value: 'resort', label: 'Resort' },
  { value: 'villa', label: 'Villa' },
  { value: 'apartment', label: 'Apartment' },
];

const PETS_POLICY_OPTIONS: SelectOption[] = [
  { value: 'not_allowed', label: 'Not allowed' },
  { value: 'allowed', label: 'Allowed' },
  { value: 'on_request', label: 'On request' },
];

/** '' -> null để BE xoá field; ngược lại trim. */
function nullableText(value?: string): string | null {
  const v = value?.trim();
  return v ? v : null;
}

/** '' -> null; ngược lại Number. */
function numOrNull(value?: string): number | null {
  return value && value.trim() ? Number(value) : null;
}

function toDto(values: HotelProfileFormValues): UpdateHotelDto {
  return {
    name: values.name.trim(),
    address: values.address.trim(),
    city: values.city.trim(),
    country: values.country.trim(),
    description: nullableText(values.description),
    district: nullableText(values.district),
    ward: nullableText(values.ward),
    checkInTime: nullableText(values.checkInTime),
    checkOutTime: nullableText(values.checkOutTime),
    starRating: values.starRating ? Number(values.starRating) : null,
    // businessType là enum bắt buộc hợp lệ ở BE → chỉ gửi khi có chọn
    ...(values.businessType
      ? { businessType: values.businessType as UpdateHotelDto['businessType'] }
      : {}),
    // ----- Chi tiết bổ sung (Pha 1) -----
    postalCode: nullableText(values.postalCode),
    phone: nullableText(values.phone),
    email: nullableText(values.email),
    totalFloors: numOrNull(values.totalFloors),
    builtYear: numOrNull(values.builtYear),
    renovationYear: numOrNull(values.renovationYear),
    isSmokingAllowed: values.isSmokingAllowed,
    petsPolicy: (values.petsPolicy || null) as UpdateHotelDto['petsPolicy'],
    cancellationPolicy: nullableText(values.cancellationPolicy),
    childrenPolicy: nullableText(values.childrenPolicy),
    minGuestAge: numOrNull(values.minGuestAge),
    securityDepositAmount: numOrNull(values.securityDepositAmount),
    maxLengthOfStay: numOrNull(values.maxLengthOfStay),
    languagesSpoken: values.languagesSpoken
      ? values.languagesSpoken.split(',').map(s => s.trim()).filter(Boolean)
      : [],
  };
}

/** Form chỉnh sửa hồ sơ khách sạn (`PATCH /hotels/:id`). Toạ độ bản đồ tách riêng, không sửa ở đây. */
export function HotelProfileFormModal({ open, onClose, hotel }: HotelProfileFormModalProps) {
  const updateHotel = useUpdateHotel(hotel.id);

  const methods = useForm<HotelProfileFormValues>({
    resolver: zodResolver(hotelProfileFormSchema),
    values: {
      name: hotel.name ?? '',
      description: hotel.description ?? '',
      address: hotel.address ?? '',
      city: hotel.city ?? '',
      country: hotel.country ?? '',
      district: hotel.district ?? '',
      ward: hotel.ward ?? '',
      starRating: hotel.starRating ? String(hotel.starRating) : '',
      businessType: hotel.businessType ?? '',
      checkInTime: hotel.checkInTime ?? '',
      checkOutTime: hotel.checkOutTime ?? '',
      postalCode: hotel.postalCode ?? '',
      phone: hotel.phone ?? '',
      email: hotel.email ?? '',
      totalFloors: hotel.totalFloors != null ? String(hotel.totalFloors) : '',
      builtYear: hotel.builtYear != null ? String(hotel.builtYear) : '',
      renovationYear: hotel.renovationYear != null ? String(hotel.renovationYear) : '',
      isSmokingAllowed: hotel.isSmokingAllowed ?? false,
      petsPolicy: hotel.petsPolicy ?? '',
      cancellationPolicy: hotel.cancellationPolicy ?? '',
      childrenPolicy: hotel.childrenPolicy ?? '',
      minGuestAge: hotel.minGuestAge != null ? String(hotel.minGuestAge) : '',
      securityDepositAmount:
        hotel.securityDepositAmount != null ? String(Number(hotel.securityDepositAmount)) : '',
      maxLengthOfStay: hotel.maxLengthOfStay != null ? String(hotel.maxLengthOfStay) : '',
      languagesSpoken: (hotel.languagesSpoken ?? []).join(', '),
    },
  });

  const onSubmit = methods.handleSubmit(async values => {
    try {
      await updateHotel.mutateAsync(toDto(values));
      toast.success('Hotel profile updated');
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to update hotel profile'));
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit hotel profile"
      description={hotel.name}
      icon={Building2}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={updateHotel.isPending}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={updateHotel.isPending}
            className="bg-role-partner-primary hover:bg-role-partner-secondary text-white"
          >
            {updateHotel.isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
            Save changes
          </Button>
        </>
      }
    >
      <FormProvider {...methods}>
        <form onSubmit={onSubmit} className="space-y-4">
          <TextField<HotelProfileFormValues>
            name="name"
            label="Hotel name"
            required
            placeholder="e.g. SmartStay Hà Nội Old Quarter"
          />

          <TextField<HotelProfileFormValues>
            name="address"
            label="Address"
            required
            placeholder="Street, number..."
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField<HotelProfileFormValues> name="city" label="City / Province" required placeholder="Hà Nội" />
            <TextField<HotelProfileFormValues> name="country" label="Country" required placeholder="Vietnam" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField<HotelProfileFormValues> name="district" label="District" placeholder="Hoàn Kiếm" />
            <TextField<HotelProfileFormValues> name="ward" label="Ward" placeholder="Hàng Bạc" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectField<HotelProfileFormValues>
              name="starRating"
              label="Star rating"
              options={STAR_OPTIONS}
              placeholder="Select rating"
            />
            <SelectField<HotelProfileFormValues>
              name="businessType"
              label="Business type"
              options={BUSINESS_TYPE_OPTIONS}
              placeholder="Select type"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField<HotelProfileFormValues>
              name="checkInTime"
              label="Check-in time"
              placeholder="14:00"
              hint="24h format (HH:mm)"
            />
            <TextField<HotelProfileFormValues>
              name="checkOutTime"
              label="Check-out time"
              placeholder="12:00"
              hint="24h format (HH:mm)"
            />
          </div>

          <TextareaField<HotelProfileFormValues>
            name="description"
            label="Description"
            rows={4}
            placeholder="Describe your hotel, location highlights, services..."
          />

          {/* ----- Contact & location ----- */}
          <div className="border-t border-slate-100 pt-4">
            <p className="text-sm font-semibold text-slate-800 mb-3">Contact & location</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <TextField<HotelProfileFormValues> name="phone" label="Phone" type="tel" placeholder="+84 24 1234 5678" />
              <TextField<HotelProfileFormValues> name="email" label="Email" type="email" placeholder="info@hotel.com" />
              <TextField<HotelProfileFormValues> name="postalCode" label="Postal code" placeholder="100000" />
            </div>
          </div>

          {/* ----- Property details ----- */}
          <div className="border-t border-slate-100 pt-4">
            <p className="text-sm font-semibold text-slate-800 mb-3">Property details</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <TextField<HotelProfileFormValues> name="totalFloors" label="Total floors" type="number" placeholder="12" />
              <TextField<HotelProfileFormValues> name="builtYear" label="Built year" type="number" placeholder="2015" />
              <TextField<HotelProfileFormValues> name="renovationYear" label="Renovation year" type="number" placeholder="2022" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-4">
              <TextField<HotelProfileFormValues> name="minGuestAge" label="Min guest age" type="number" placeholder="18" />
              <TextField<HotelProfileFormValues>
                name="securityDepositAmount"
                label="Security deposit (VND)"
                type="number"
                placeholder="500000"
              />
              <TextField<HotelProfileFormValues>
                name="maxLengthOfStay"
                label="Max length of stay (nights)"
                type="number"
                placeholder="30"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
              <SelectField<HotelProfileFormValues>
                name="petsPolicy"
                label="Pets policy"
                options={PETS_POLICY_OPTIONS}
                placeholder="Select policy"
              />
              <TextField<HotelProfileFormValues>
                name="languagesSpoken"
                label="Languages spoken"
                placeholder="Vietnamese, English, French"
                hint="Separate with commas"
              />
            </div>
            <div className="mt-4">
              <ToggleField<HotelProfileFormValues>
                name="isSmokingAllowed"
                label="Smoking allowed"
                description="Whether smoking is allowed on the property"
              />
            </div>
          </div>

          {/* ----- Policies ----- */}
          <div className="border-t border-slate-100 pt-4">
            <p className="text-sm font-semibold text-slate-800 mb-3">Policies</p>
            <div className="space-y-4">
              <TextareaField<HotelProfileFormValues>
                name="cancellationPolicy"
                label="Cancellation policy"
                rows={3}
                placeholder="Describe your cancellation terms..."
              />
              <TextareaField<HotelProfileFormValues>
                name="childrenPolicy"
                label="Children policy"
                rows={3}
                placeholder="Describe your children / extra-bed terms..."
              />
            </div>
          </div>
        </form>
      </FormProvider>
    </Modal>
  );
}
