import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/hotel-partner/shared/Modal';
import { TextField } from '@/components/hotel-partner/shared/form-controls';
import { useCheckOut } from '@/hooks/staff';
import { errorMessage } from '@/utils/errorMessage';
import { formatCurrency } from '@/utils/formatCurrency';
import {
  checkOutFormSchema,
  type CheckOutFormValues,
} from '@/validations/hotel-booking.validation';
import type { HotelBookingDetail, CheckOutPayload } from '@/types/staff.types';

interface CheckOutModalProps {
  open: boolean;
  onClose: () => void;
  hotelId: string;
  booking: HotelBookingDetail;
}

/** Form trả phòng: nhập phụ thu (nếu có) rồi xuất hoá đơn. */
export function CheckOutModal({ open, onClose, hotelId, booking }: CheckOutModalProps) {
  const checkOut = useCheckOut(hotelId);

  const methods = useForm<CheckOutFormValues>({
    resolver: zodResolver(checkOutFormSchema),
    defaultValues: { extraCharge: '' },
  });

  const close = () => {
    methods.reset();
    onClose();
  };

  const onSubmit = methods.handleSubmit(async values => {
    const payload: CheckOutPayload = {};
    const extra = values.extraCharge?.trim();
    if (extra) payload.extraCharge = Number(extra);
    try {
      const res = await checkOut.mutateAsync({ bookingId: booking.id, payload });
      toast.success(`Guest checked out · Invoice ${res.invoice.invoiceNumber}`);
      close();
    } catch (err) {
      toast.error(errorMessage(err, 'Check-out failed'));
    }
  });

  return (
    <Modal
      open={open}
      onClose={close}
      title="Check out guest"
      description={`${booking.customer.fullName} · ${booking.bookingCode}`}
      icon={LogOut}
      footer={
        <>
          <Button variant="outline" onClick={close} disabled={checkOut.isPending}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={checkOut.isPending}
            className="bg-role-partner-primary hover:bg-role-partner-secondary text-white"
          >
            {checkOut.isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
            Confirm check-out
          </Button>
        </>
      }
    >
      <FormProvider {...methods}>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3.5 py-2.5 text-sm">
            <span className="text-slate-500">Booking total</span>
            <span className="font-semibold text-slate-900">
              {formatCurrency(booking.totalAmount)}
            </span>
          </div>
          <TextField<CheckOutFormValues>
            name="extraCharge"
            label="Extra charge (VND)"
            type="number"
            step="1000"
            placeholder="0"
            hint="Additional fees (minibar, damages…). Added to the invoice total."
          />
        </form>
      </FormProvider>
    </Modal>
  );
}
