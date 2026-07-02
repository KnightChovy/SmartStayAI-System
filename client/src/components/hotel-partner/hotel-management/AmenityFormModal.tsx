import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/hotel-partner/shared/Modal';
import { TextField, SelectField } from '@/components/hotel-partner/shared/form-controls';
import { amenityFormSchema, type AmenityFormValues } from '@/validations/hotel-management.validation';
import { useCreateAmenity, useUpdateAmenity } from '@/hooks/hotel-management';
import { errorMessage } from '@/utils/errorMessage';
import type { Amenity } from '@/types/hotel.types';

interface AmenityFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Khi có giá trị → chế độ sửa; ngược lại là tạo mới. */
  amenity?: Amenity | null;
  /** Danh mục gợi ý sẵn khi tạo mới (vd 'hotel'). */
  defaultCategory?: Amenity['category'];
  /** Gọi sau khi TẠO xong — trả về amenity mới để nơi mở tự chọn luôn. */
  onCreated?: (amenity: Amenity) => void;
}

const CATEGORY_OPTIONS = [
  { value: 'hotel', label: 'Hotel' },
  { value: 'room', label: 'Room' },
  { value: 'service', label: 'Service' },
];

/** Form tạo / sửa một tiện nghi trong catalog dùng chung (`POST` / `PATCH /amenities`). */
export function AmenityFormModal({
  open,
  onClose,
  amenity,
  defaultCategory = 'hotel',
  onCreated,
}: AmenityFormModalProps) {
  const isEdit = !!amenity;
  const createAmenity = useCreateAmenity();
  const updateAmenity = useUpdateAmenity();
  const isPending = createAmenity.isPending || updateAmenity.isPending;

  const methods = useForm<AmenityFormValues>({
    resolver: zodResolver(amenityFormSchema),
    values: {
      name: amenity?.name ?? '',
      icon: amenity?.icon ?? '',
      category: amenity?.category ?? defaultCategory,
    },
  });

  const onSubmit = methods.handleSubmit(async values => {
    const dto = {
      name: values.name.trim(),
      icon: values.icon?.trim() ? values.icon.trim() : null,
      category: values.category,
    };
    try {
      if (isEdit && amenity) {
        await updateAmenity.mutateAsync({ amenityId: amenity.id, dto });
        toast.success('Amenity updated');
      } else {
        const created = await createAmenity.mutateAsync(dto);
        toast.success('Amenity created');
        methods.reset({ name: '', icon: '', category: values.category });
        onCreated?.(created);
      }
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, isEdit ? 'Failed to update amenity' : 'Failed to create amenity'));
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit amenity' : 'New amenity'}
      description={isEdit ? amenity?.name : 'Add a new amenity to the shared catalog'}
      icon={Sparkles}
      size="sm"
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
            {isEdit ? 'Save changes' : 'Create amenity'}
          </Button>
        </>
      }
    >
      <FormProvider {...methods}>
        <form onSubmit={onSubmit} className="space-y-4">
          <TextField<AmenityFormValues>
            name="name"
            label="Amenity name"
            required
            placeholder="e.g. Rooftop pool"
          />
          <SelectField<AmenityFormValues>
            name="category"
            label="Category"
            required
            options={CATEGORY_OPTIONS}
          />
          <TextField<AmenityFormValues>
            name="icon"
            label="Icon"
            placeholder="lucide icon name (optional), e.g. waves"
            hint="Optional — a lucide-react icon key used by the UI."
          />
        </form>
      </FormProvider>
    </Modal>
  );
}
