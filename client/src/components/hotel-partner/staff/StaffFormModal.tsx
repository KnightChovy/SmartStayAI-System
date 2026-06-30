import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/hotel-partner/shared/Modal';
import { TextField, SelectField } from '@/components/hotel-partner/shared/form-controls';
import { STAFF_ROLE_OPTIONS } from './labels';
import {
  addStaffFormSchema,
  type AddStaffFormValues,
} from '@/validations/hotel-staff.validation';
import { useAddHotelStaff } from '@/hooks/hotel-staff';
import { errorMessage } from '@/utils/errorMessage';
import type { AddStaffDto } from '@/types/hotel-staff.types';

interface StaffFormModalProps {
  open: boolean;
  onClose: () => void;
  hotelId: string;
  hotelName: string;
}

/** Modal tạo tài khoản + gán nhân viên cho khách sạn (chỉ tạo mới — BE không có update). */
export function StaffFormModal({ open, onClose, hotelId, hotelName }: StaffFormModalProps) {
  const addMutation = useAddHotelStaff(hotelId);
  const isPending = addMutation.isPending;

  const methods = useForm<AddStaffFormValues>({
    resolver: zodResolver(addStaffFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      phone: '',
      assignedRole: 'staff',
    },
  });

  const close = () => {
    methods.reset();
    onClose();
  };

  const onSubmit = methods.handleSubmit(async values => {
    const dto: AddStaffDto = {
      name: values.name.trim(),
      email: values.email.trim(),
      password: values.password,
      phone: values.phone?.trim() ? values.phone.trim() : null,
      assignedRole: values.assignedRole,
    };
    try {
      await addMutation.mutateAsync(dto);
      toast.success('Staff member added');
      close();
    } catch (err) {
      // Surface BE message (e.g. "Email already taken") when present.
      toast.error(errorMessage(err, 'Failed to add staff member'));
    }
  });

  return (
    <Modal
      open={open}
      onClose={close}
      title="Add staff member"
      description={`A new account will be created for ${hotelName}`}
      icon={UserPlus}
      footer={
        <>
          <Button variant="outline" onClick={close} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isPending}
            className="bg-role-partner-primary hover:bg-role-partner-secondary text-white"
          >
            {isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
            Create &amp; assign
          </Button>
        </>
      }
    >
      <FormProvider {...methods}>
        <form onSubmit={onSubmit} className="space-y-4">
          <TextField<AddStaffFormValues>
            name="name"
            label="Full name"
            required
            placeholder="Nguyen Van A"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField<AddStaffFormValues>
              name="email"
              label="Email"
              type="email"
              required
              placeholder="staff@example.com"
            />
            <TextField<AddStaffFormValues>
              name="phone"
              label="Phone"
              type="tel"
              placeholder="0901234567"
            />
          </div>
          <TextField<AddStaffFormValues>
            name="password"
            label="Password"
            type="password"
            required
            placeholder="At least 8 characters"
            hint="Minimum 8 characters, including at least one letter and one number."
          />
          <SelectField<AddStaffFormValues>
            name="assignedRole"
            label="Role"
            required
            options={STAFF_ROLE_OPTIONS}
            hint="Staff handle front desk & housekeeping; marketers manage content."
          />
        </form>
      </FormProvider>
    </Modal>
  );
}
