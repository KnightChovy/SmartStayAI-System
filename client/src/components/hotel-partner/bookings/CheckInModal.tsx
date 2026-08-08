import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/hotel-partner/shared/Modal';
import { TextField, SelectField } from '@/components/hotel-partner/shared/form-controls';
import { useCheckIn } from '@/hooks/staff';
import { errorMessage } from '@/utils/errorMessage';
import {
  checkInFormSchema,
  type CheckInFormValues,
} from '@/validations/hotel-booking.validation';
import type { HotelBookingDetail, StaffRoom, CheckInPayload } from '@/types/staff.types';

interface CheckInModalProps {
  open: boolean;
  onClose: () => void;
  hotelId: string;
  booking: HotelBookingDetail;
  /** Phòng trống đúng loại để bàn giao (rỗng = BE tự chọn). */
  availableRooms: StaffRoom[];
}

const AUTO = 'auto';

/** Form nhận phòng: chọn phòng vật lý (hoặc để tự gán) + đối chiếu voucher. */
export function CheckInModal({ open, onClose, hotelId, booking, availableRooms }: CheckInModalProps) {
  const checkIn = useCheckIn(hotelId);

  const methods = useForm<CheckInFormValues>({
    resolver: zodResolver(checkInFormSchema),
    defaultValues: { roomId: AUTO, voucherCode: '' },
  });

  const close = () => {
    methods.reset();
    onClose();
  };

  const roomOptions = [
    { value: AUTO, label: 'Auto-select an available room' },
    ...availableRooms.map(r => ({
      value: r.id,
      label: `Room ${r.roomNumber}${r.floor ? ` · floor ${r.floor}` : ''}`,
    })),
  ];

  const onSubmit = methods.handleSubmit(async values => {
    const payload: CheckInPayload = {};
    if (values.roomId && values.roomId !== AUTO) payload.roomId = values.roomId;
    const vc = values.voucherCode?.trim();
    if (vc) payload.voucherCode = vc;
    try {
      await checkIn.mutateAsync({ bookingId: booking.id, payload });
      toast.success('Guest checked in successfully');
      close();
    } catch (err) {
      toast.error(errorMessage(err, 'Check-in failed'));
    }
  });

  return (
    <Modal
      open={open}
      onClose={close}
      title="Check in guest"
      description={`${booking.customer.fullName} · ${booking.bookingCode}`}
      icon={LogIn}
      footer={
        <>
          <Button variant="outline" onClick={close} disabled={checkIn.isPending}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={checkIn.isPending}
            className="bg-role-partner-primary hover:bg-role-partner-secondary text-white"
          >
            {checkIn.isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
            Confirm check-in
          </Button>
        </>
      }
    >
      <FormProvider {...methods}>
        <form onSubmit={onSubmit} className="space-y-4">
          <SelectField<CheckInFormValues>
            name="roomId"
            label="Assign room"
            options={roomOptions}
            hint={
              availableRooms.length === 0
                ? 'No available rooms of this type — the system will try to assign one automatically.'
                : 'Leave on auto to let the system pick a free room of this type.'
            }
          />
          <TextField<CheckInFormValues>
            name="voucherCode"
            label="QR check-in code (optional)"
            placeholder="VC…"
            hint="Enter the guest's QR check-in code to validate it on check-in."
          />
        </form>
      </FormProvider>
    </Modal>
  );
}
