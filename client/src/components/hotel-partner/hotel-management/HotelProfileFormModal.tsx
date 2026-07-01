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

/** '' -> null để BE xoá field; ngược lại trim. */
function nullableText(value?: string): string | null {
  const v = value?.trim();
  return v ? v : null;
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
        </form>
      </FormProvider>
    </Modal>
  );
}
