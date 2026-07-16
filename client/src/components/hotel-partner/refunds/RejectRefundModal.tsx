import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/hotel-partner/shared/Modal';
import { TextareaField } from '@/components/hotel-partner/shared/form-controls';
import { useReviewRefund } from '@/hooks/refunds';
import { errorMessage } from '@/utils/errorMessage';
import { formatCurrency } from '@/utils/formatCurrency';
import {
  rejectRefundFormSchema,
  type RejectRefundFormValues,
} from '@/validations/refund.validation';
import type { Refund } from '@/types/refund.types';

interface RejectRefundModalProps {
  open: boolean;
  onClose: () => void;
  hotelId: string;
  refund: Refund;
}

/**
 * Từ chối một yêu cầu hoàn tiền — lý do BẮT BUỘC (BE cũng chặn, đây là lớp đầu để
 * người dùng không thấy message Joi tiếng Anh). Lý do sẽ hiển thị cho khách.
 */
export function RejectRefundModal({ open, onClose, hotelId, refund }: RejectRefundModalProps) {
  const reviewMutation = useReviewRefund();
  const isPending = reviewMutation.isPending;

  const methods = useForm<RejectRefundFormValues>({
    resolver: zodResolver(rejectRefundFormSchema),
    defaultValues: { rejectionReason: '' },
  });

  const close = () => {
    methods.reset();
    onClose();
  };

  const onSubmit = methods.handleSubmit(async values => {
    try {
      await reviewMutation.mutateAsync({
        hotelId,
        refundId: refund.id,
        // Gửi ĐÚNG 2 field — BE cấm `rejectionReason` khi approve nên payload phải dựng tay,
        // không spread cả form values.
        dto: { decision: 'reject', rejectionReason: values.rejectionReason.trim() },
      });
      toast.success('Refund request rejected');
      close();
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to reject this refund request'));
      close();
    }
  });

  return (
    <Modal
      open={open}
      onClose={close}
      title="Reject refund request"
      description={`${formatCurrency(refund.amount)} · booking ${refund.payment.booking.bookingCode}`}
      icon={XCircle}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={close} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isPending}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Reject refund
          </Button>
        </>
      }
    >
      <FormProvider {...methods}>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3">
            <p className="text-xs text-amber-800">
              The refund amount was calculated from your own cancellation policy, so the guest is
              normally entitled to it. Only reject when this case is a genuine exception — the
              reason below is shown to the guest.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3.5 py-3">
            <p className="text-xs font-medium text-slate-500">Guest&apos;s reason for cancelling</p>
            <p className="mt-1 text-sm text-slate-700">{refund.reason}</p>
          </div>

          <TextareaField<RejectRefundFormValues>
            name="rejectionReason"
            label="Reason for rejection"
            rows={4}
            placeholder="e.g. Guest cancelled after the free-cancellation window and the room was held overnight."
            hint="Required · max 500 characters. The guest will see this."
          />
        </form>
      </FormProvider>
    </Modal>
  );
}
