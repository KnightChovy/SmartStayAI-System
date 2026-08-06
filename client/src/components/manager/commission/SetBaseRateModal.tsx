import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Loader2, Percent } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DateField,
  TextField,
} from '@/components/hotel-partner/shared/form-controls';
import { ManagerModal } from '@/components/manager/shared/ManagerModal';
import {
  earliestBaseRateDate,
  formatRate,
} from '@/components/shared/commission-labels';
import { useSetBaseCommissionRate } from '@/hooks/platform-manager';
import { errorMessage } from '@/utils/errorMessage';
import { formatDate } from '@/utils/formatDate';
import {
  BASE_RATE_NOTICE_DAYS,
  baseRateFormSchema,
  type BaseRateFormValues,
} from '@/validations/commission-rate.validation';
import type { PlatformBaseRate } from '@/types/commission-rate.types';

interface SetBaseRateModalProps {
  open: boolean;
  onClose: () => void;
  baseRate: PlatformBaseRate;
}

/**
 * Đặt mức hoa hồng nền mới cho toàn sàn.
 *
 * Hai ràng buộc của backend được đẩy lên UI để người dùng không phải ăn lỗi 400:
 * biên `minRate`–`maxRate` và ngày hiệu lực phải cách hôm nay ít nhất 30 ngày
 * (`min` của DatePicker chặn thẳng trên lịch).
 */
export function SetBaseRateModal({
  open,
  onClose,
  baseRate,
}: SetBaseRateModalProps) {
  const setBaseRate = useSetBaseCommissionRate();
  const earliest = earliestBaseRateDate();

  const methods = useForm<BaseRateFormValues>({
    resolver: zodResolver(baseRateFormSchema),
    defaultValues: { rate: '', effectiveFrom: earliest },
    mode: 'onBlur',
  });

  const rate = useWatch({ control: methods.control, name: 'rate' });
  const effectiveFrom = useWatch({
    control: methods.control,
    name: 'effectiveFrom',
  });

  const close = () => {
    methods.reset({ rate: '', effectiveFrom: earliest });
    onClose();
  };

  const onSubmit = methods.handleSubmit(async values => {
    try {
      await setBaseRate.mutateAsync({
        rate: Number(values.rate),
        effectiveFrom: values.effectiveFrom,
      });
      toast.success(
        `Base rate ${formatRate(values.rate)} scheduled from ${formatDate(values.effectiveFrom)}`
      );
      close();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not set the base commission rate'));
    }
  });

  return (
    <ManagerModal
      open={open}
      onClose={close}
      title="Set a new base commission rate"
      description={`Currently ${formatRate(baseRate.currentRate)} · allowed range ${baseRate.minRate}%–${baseRate.maxRate}%`}
      icon={Percent}
      size="md"
      footer={
        <>
          <Button
            variant="outline"
            onClick={close}
            disabled={setBaseRate.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={setBaseRate.isPending}
            className="bg-role-manager-primary text-white hover:bg-role-manager-secondary"
          >
            {setBaseRate.isPending && (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            )}
            Schedule change
          </Button>
        </>
      }
    >
      <FormProvider {...methods}>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-xs text-amber-900">
              This applies to{' '}
              <strong>every hotel without its own agreement</strong>. Special
              rates still in force are <strong>not affected</strong> — they only
              fall back to the new base rate once they expire.{' '}
              <strong>Every partner will be notified.</strong>
            </p>
          </div>

          {baseRate.scheduled && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-3 text-xs text-blue-900">
              A change is already scheduled:{' '}
              <strong>{formatRate(baseRate.scheduled.rate)}</strong> from{' '}
              <strong>{formatDate(baseRate.scheduled.effectiveFrom)}</strong>.
              Saving a new rate <strong>replaces</strong> it.
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField<BaseRateFormValues>
              name="rate"
              label="Base commission rate (%)"
              type="number"
              step="0.01"
              min={baseRate.minRate}
              max={baseRate.maxRate}
              required
              placeholder="18"
              hint={`Between ${baseRate.minRate}% and ${baseRate.maxRate}%`}
            />
            <DateField<BaseRateFormValues>
              name="effectiveFrom"
              label="Effective from"
              required
              min={earliest}
              hint={`At least ${BASE_RATE_NOTICE_DAYS} days' notice — earliest is ${formatDate(earliest)}`}
            />
          </div>

          {rate && effectiveFrom && (
            <p className="rounded-lg border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs text-slate-600">
              From <strong>{formatDate(effectiveFrom)}</strong>, the base rate
              moves from <strong>{formatRate(baseRate.currentRate)}</strong> to{' '}
              <strong>{formatRate(rate)}</strong>.
            </p>
          )}
        </form>
      </FormProvider>
    </ManagerModal>
  );
}
