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
              label="Area (m²)"
              type="number"
              step="0.01"
              placeholder="28.5"
            />
            <TextField<RoomTypeFormValues> name="bedType" label="Bed type" placeholder="Double / King" />
          </div>

          <TextField<RoomTypeFormValues> name="viewType" label="View" placeholder="Sea view / City view" />

          <TextareaField<RoomTypeFormValues>
            name="description"
            label="Description"
            placeholder="Short description of this room type..."
          />

          <ToggleField<RoomTypeFormValues>
            name="isActive"
            label="Active"
            description="Turn off to hide this room type from booking"
          />
        </form>
      </FormProvider>
    </Modal>
  );
}
