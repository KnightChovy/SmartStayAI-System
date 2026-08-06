import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, RotateCcw, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { TextareaField } from '@/components/hotel-partner/shared/form-controls';
import { ManagerModal } from '@/components/manager/shared/ManagerModal';
import { useSetPartnerStatus } from '@/hooks/platform-manager';
import { errorMessage } from '@/utils/errorMessage';
import {
  suspendPartnerFormSchema,
  type SuspendPartnerFormValues,
} from '@/validations/commission-rate.validation';
import type { PlatformPartner } from '@/types/platform-manager.types';

interface PartnerStatusModalProps {
  partner: PlatformPartner;
  action: 'suspend' | 'reactivate';
  onClose: () => void;
}

/**
 * Đình chỉ / khôi phục một đối tác.
 *
 * Platform Manager KHÔNG có nút sửa mức hoa hồng tự do — vi phạm nghiêm trọng được xử lý
 * bằng đình chỉ. Hệ quả phải nói rõ trước khi bấm vì nó gỡ niêm yết toàn bộ khách sạn
 * của đối tác. Booking đã đặt KHÔNG bị huỷ.
 */
export function PartnerStatusModal({
  partner,
  action,
  onClose,
}: PartnerStatusModalProps) {
  const setStatus = useSetPartnerStatus();
  const isPending = setStatus.isPending;
  const isSuspend = action === 'suspend';

  const methods = useForm<SuspendPartnerFormValues>({
    resolver: zodResolver(suspendPartnerFormSchema),
    defaultValues: { reason: '' },
  });

  const submitSuspend = methods.handleSubmit(async values => {
    try {
      const res = await setStatus.mutateAsync({
        partnerId: partner.id,
        dto: { action: 'suspend', reason: values.reason.trim() },
      });
      toast.success(
        `${res.partner.businessName} suspended. ${res.unlistedHotels} hotel${
          res.unlistedHotels === 1 ? '' : 's'
        } removed from sale.`
      );
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not suspend this partner'));
    }
  });

  const submitReactivate = async () => {
    try {
      const res = await setStatus.mutateAsync({
        partnerId: partner.id,
        // `reason` bị CẤM khi reactivate (Joi khai `forbidden`) — payload chỉ có `action`.
        dto: { action: 'reactivate' },
      });
      toast.success(
        `${res.partner.businessName} reactivated. They must re-list each hotel themselves.`
      );
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not reactivate this partner'));
    }
  };

  return (
    <ManagerModal
      open
      onClose={onClose}
      title={isSuspend ? 'Suspend partner' : 'Reactivate partner'}
      description={partner.businessName}
      icon={isSuspend ? ShieldOff : RotateCcw}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={isSuspend ? submitSuspend : submitReactivate}
            disabled={isPending}
            className={
              isSuspend
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }
          >
            {isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            {isSuspend ? 'Suspend partner' : 'Reactivate partner'}
          </Button>
        </>
      }
    >
      {isSuspend ? (
        <FormProvider {...methods}>
          <form onSubmit={submitSuspend} className="space-y-4">
            <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3">
              <p className="text-xs text-red-800">
                Suspending{' '}
                <strong>removes all of this partner&apos;s hotels</strong> from
                sale ({partner._count.hotels} hotel
                {partner._count.hotels === 1 ? '' : 's'}) and blocks every
                management action they can take. Existing bookings are{' '}
                <strong>not cancelled</strong> — those guests still get their
                stay. On reactivation the partner must{' '}
                <strong>re-list each hotel themselves</strong>.
              </p>
            </div>

            <TextareaField<SuspendPartnerFormValues>
              name="reason"
              label="Reason for suspension"
              rows={4}
              placeholder="e.g. Fake bookings created to exploit the commission agreement."
              hint="Required · max 500 characters. The reason is stored and sent to the partner's owner."
            />
          </form>
        </FormProvider>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-3">
            <p className="text-xs text-emerald-900">
              The partner goes back to <strong>active</strong> and regains every
              management action. The suspension reason is cleared.
            </p>
          </div>
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs text-amber-900">
            <strong>Listings are NOT switched back on.</strong> That is
            deliberate — the partner has to re-list each hotel themselves after
            reviewing it.
          </p>
        </div>
      )}
    </ManagerModal>
  );
}
