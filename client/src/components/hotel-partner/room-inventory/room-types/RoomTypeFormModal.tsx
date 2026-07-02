import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/hotel-partner/shared/Modal';
import {
  TextField,
  TextareaField,
  ToggleField,
  SelectField,
  type SelectOption,
} from '@/components/hotel-partner/shared/form-controls';
import {
  roomTypeFormSchema,
  type RoomTypeFormValues,
} from '@/validations/hotel-management.validation';
import { useCreateRoomType, useUpdateRoomType } from '@/hooks/hotel-management';
import type { CreateRoomTypeDto, ManagedRoomType } from '@/types/hotel-management.types';

interface RoomTypeFormModalProps {
  open: boolean;
  onClose: () => void;
  hotelId: string;
  /** When set, the modal is in edit mode. */
  roomType?: ManagedRoomType | null;
}

const SIZE_UNIT_OPTIONS: SelectOption[] = [
  { value: 'sqm', label: 'm² (sqm)' },
  { value: 'sqft', label: 'ft² (sqft)' },
];

/** '' -> null so the API can clear the field; otherwise trim. */
function nullableText(value?: string): string | null {
  const v = value?.trim();
  return v ? v : null;
}

function toDto(values: RoomTypeFormValues): CreateRoomTypeDto {
  return {
    name: values.name.trim(),
    maxOccupancy: Number(values.maxOccupancy),
    basePrice: Number(values.basePrice),
    isActive: values.isActive,
    description: nullableText(values.description),
    areaSqm: values.areaSqm?.trim() ? Number(values.areaSqm) : null,
    bedType: nullableText(values.bedType),
    viewType: nullableText(values.viewType),
    // ----- Chi tiết bổ sung (Pha 1) — chỉ gửi số khi có nhập -----
    ...(values.maxAdults?.trim() ? { maxAdults: Number(values.maxAdults) } : {}),
    ...(values.maxChildren?.trim() ? { maxChildren: Number(values.maxChildren) } : {}),
    ...(values.sizeUnit ? { sizeUnit: values.sizeUnit as CreateRoomTypeDto['sizeUnit'] } : {}),
    isNonSmoking: values.isNonSmoking,
    hasPrivateBathroom: values.hasPrivateBathroom,
    hasBalcony: values.hasBalcony,
  };
}

export function RoomTypeFormModal({ open, onClose, hotelId, roomType }: RoomTypeFormModalProps) {
  const isEdit = !!roomType;
  const createMutation = useCreateRoomType(hotelId);
  const updateMutation = useUpdateRoomType(hotelId);
  const isPending = createMutation.isPending || updateMutation.isPending;

  const methods = useForm<RoomTypeFormValues>({
    resolver: zodResolver(roomTypeFormSchema),
    values: {
      name: roomType?.name ?? '',
      maxOccupancy: roomType ? String(roomType.maxOccupancy) : '2',
      basePrice: roomType ? String(Number(roomType.basePrice)) : '',
      description: roomType?.description ?? '',
      areaSqm: roomType?.areaSqm ? String(Number(roomType.areaSqm)) : '',
      bedType: roomType?.bedType ?? '',
      viewType: roomType?.viewType ?? '',
      isActive: roomType?.isActive ?? true,
      maxAdults: roomType?.maxAdults != null ? String(roomType.maxAdults) : '',
      maxChildren: roomType?.maxChildren != null ? String(roomType.maxChildren) : '',
      sizeUnit: roomType?.sizeUnit ?? '',
      isNonSmoking: roomType?.isNonSmoking ?? false,
      hasPrivateBathroom: roomType?.hasPrivateBathroom ?? true,
      hasBalcony: roomType?.hasBalcony ?? false,
    },
  });

  const onSubmit = methods.handleSubmit(async values => {
    const dto = toDto(values);
    try {
      if (isEdit && roomType) {
        await updateMutation.mutateAsync({ roomTypeId: roomType.id, dto });
        toast.success('Room type updated');
      } else {
        await createMutation.mutateAsync(dto);
        toast.success('Room type created');
      }
      onClose();
    } catch {
      toast.error(isEdit ? 'Failed to update room type' : 'Failed to create room type');
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit room type' : 'Add room type'}
      description={isEdit ? roomType?.name : 'Create a new room type for this hotel'}
      icon={Layers}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isPending}
            className="bg-role-partner-primary hover:bg-role-partner-secondary text-white"
          >
            {isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
            {isEdit ? 'Save changes' : 'Create room type'}
          </Button>
        </>
      }
    >
      <FormProvider {...methods}>
        <form onSubmit={onSubmit} className="space-y-4">
          <TextField<RoomTypeFormValues> name="name" label="Room type name" required placeholder="e.g. Deluxe Double" />

          <div className="grid grid-cols-2 gap-4">
            <TextField<RoomTypeFormValues>
              name="basePrice"
              label="Base price / night (VND)"
              type="number"
              required
              placeholder="1200000"
            />
            <TextField<RoomTypeFormValues>
              name="maxOccupancy"
              label="Max occupancy"
              type="number"
              required
              placeholder="2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TextField<RoomTypeFormValues>
              name="areaSqm"
              label="Area"
              type="number"
              step="0.01"
              placeholder="28.5"
            />
            <SelectField<RoomTypeFormValues>
              name="sizeUnit"
              label="Area unit"
              options={SIZE_UNIT_OPTIONS}
              placeholder="m² / ft²"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TextField<RoomTypeFormValues>
              name="maxAdults"
              label="Max adults"
              type="number"
              placeholder="2"
            />
            <TextField<RoomTypeFormValues>
              name="maxChildren"
              label="Max children"
              type="number"
              placeholder="1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TextField<RoomTypeFormValues> name="bedType" label="Bed type" placeholder="Double / King" />
            <TextField<RoomTypeFormValues> name="viewType" label="View" placeholder="Sea view / City view" />
          </div>

          <TextareaField<RoomTypeFormValues>
            name="description"
            label="Description"
            placeholder="Short description of this room type..."
          />

          <div className="grid grid-cols-1 gap-2.5">
            <ToggleField<RoomTypeFormValues>
              name="hasPrivateBathroom"
              label="Private bathroom"
              description="Room has its own bathroom"
            />
            <ToggleField<RoomTypeFormValues>
              name="hasBalcony"
              label="Balcony"
              description="Room has a balcony"
            />
            <ToggleField<RoomTypeFormValues>
              name="isNonSmoking"
              label="Non-smoking"
              description="Smoking is not allowed in this room type"
            />
            <ToggleField<RoomTypeFormValues>
              name="isActive"
              label="Active"
              description="Turn off to hide this room type from booking"
            />
          </div>
        </form>
      </FormProvider>
    </Modal>
  );
}
