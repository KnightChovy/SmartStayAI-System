import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/hotel-partner/shared/Modal';
import {
  TextField,
  SelectField,
  ToggleField,
  DateField,
  FieldShell,
} from '@/components/hotel-partner/shared/form-controls';
import {
  RULE_TYPE_OPTIONS,
  ADJUSTMENT_TYPE_OPTIONS,
  DAY_OF_WEEK_LABELS,
} from '@/components/hotel-partner/shared/labels';
import {
  pricingRuleFormSchema,
  type PricingRuleFormValues,
} from '@/validations/hotel-management.validation';
import { useCreatePricingRule, useUpdatePricingRule } from '@/hooks/hotel-management';
import type {
  ManagedRoomType,
  PricingRule,
  CreatePricingRuleDto,
} from '@/types/hotel-management.types';

interface PricingRuleFormModalProps {
  open: boolean;
  onClose: () => void;
  hotelId: string;
  roomTypes: ManagedRoomType[];
  rule?: PricingRule | null;
}

/** Sentinel for the "whole hotel" option (Radix Select rejects empty values). */
const WHOLE_HOTEL = '__hotel__';

/** ISO datetime -> 'YYYY-MM-DD' cho DatePicker (value dạng ngày). */
function toDateInput(value?: string | null): string {
  if (!value) return '';
  return value.slice(0, 10);
}

export function PricingRuleFormModal({
  open,
  onClose,
  hotelId,
  roomTypes,
  rule,
}: PricingRuleFormModalProps) {
  const isEdit = !!rule;
  const createMutation = useCreatePricingRule(hotelId);
  const updateMutation = useUpdatePricingRule(hotelId);
  const isPending = createMutation.isPending || updateMutation.isPending;

  const methods = useForm<PricingRuleFormValues>({
    resolver: zodResolver(pricingRuleFormSchema),
    values: {
      name: rule?.name ?? '',
      ruleType: rule?.ruleType ?? 'seasonal',
      roomTypeId: rule?.roomTypeId ?? WHOLE_HOTEL,
      startDate: toDateInput(rule?.startDate),
      endDate: toDateInput(rule?.endDate),
      adjustmentType: rule?.adjustmentType ?? 'percentage',
      adjustmentValue: rule ? String(Number(rule.adjustmentValue)) : '',
      dayOfWeek: rule?.dayOfWeek ?? [],
      occupancyThreshold: rule?.occupancyThreshold != null ? String(rule.occupancyThreshold) : '',
      priority: rule?.priority != null ? String(rule.priority) : '0',
      isActive: rule?.isActive ?? true,
    },
  });

  const ruleType = methods.watch('ruleType');
  const startDate = methods.watch('startDate');
  const endDate = methods.watch('endDate');

  const onSubmit = methods.handleSubmit(async values => {
    const dto: CreatePricingRuleDto = {
      name: values.name.trim(),
      ruleType: values.ruleType,
      startDate: values.startDate,
      endDate: values.endDate,
      adjustmentType: values.adjustmentType,
      adjustmentValue: Number(values.adjustmentValue),
      roomTypeId: values.roomTypeId === WHOLE_HOTEL ? null : values.roomTypeId,
      dayOfWeek: values.dayOfWeek ?? [],
      occupancyThreshold: values.occupancyThreshold?.trim() ? Number(values.occupancyThreshold) : null,
      priority: values.priority?.trim() ? Number(values.priority) : 0,
      isActive: values.isActive,
    };
    try {
      if (isEdit && rule) {
        await updateMutation.mutateAsync({ ruleId: rule.id, dto });
        toast.success('Pricing rule updated');
      } else {
        await createMutation.mutateAsync(dto);
        toast.success('Pricing rule created');
      }
      onClose();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (isEdit ? 'Failed to update rule' : 'Failed to create rule');
      toast.error(message);
    }
  });

  const roomTypeOptions = [
    { value: WHOLE_HOTEL, label: 'Whole hotel' },
    ...roomTypes.map(rt => ({ value: rt.id, label: rt.name })),
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit pricing rule' : 'Add pricing rule'}
      description={isEdit ? rule?.name : 'Configure conditional price adjustments'}
      icon={Tag}
      size="lg"
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
            {isEdit ? 'Save changes' : 'Create rule'}
          </Button>
        </>
      }
    >
      <FormProvider {...methods}>
        <form onSubmit={onSubmit} className="space-y-4">
          <TextField<PricingRuleFormValues>
            name="name"
            label="Rule name"
            required
            placeholder="e.g. Summer weekends"
          />

          <div className="grid grid-cols-2 gap-4">
            <SelectField<PricingRuleFormValues>
              name="ruleType"
              label="Rule type"
              required
              options={RULE_TYPE_OPTIONS}
            />
            <SelectField<PricingRuleFormValues>
              name="roomTypeId"
              label="Applies to"
              options={roomTypeOptions}
              hint="Keep 'Whole hotel' to apply to every room type"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DateField<PricingRuleFormValues>
              name="startDate"
              label="Start date"
              required
              max={endDate || undefined}
              placeholder="Chọn ngày bắt đầu"
            />
            <DateField<PricingRuleFormValues>
              name="endDate"
              label="End date"
              required
              min={startDate || undefined}
              placeholder="Chọn ngày kết thúc"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SelectField<PricingRuleFormValues>
              name="adjustmentType"
              label="Adjustment type"
              required
              options={ADJUSTMENT_TYPE_OPTIONS}
            />
            <TextField<PricingRuleFormValues>
              name="adjustmentValue"
              label="Adjustment value"
              type="number"
              step="0.01"
              required
              hint="Negative = discount (e.g. -15)"
            />
          </div>

          {ruleType === 'occupancy' && (
            <TextField<PricingRuleFormValues>
              name="occupancyThreshold"
              label="Occupancy threshold (%)"
              type="number"
              required
              hint="Applies when occupancy reaches this threshold (1-100)"
            />
          )}

          {/* Day of week */}
          <FieldShell
            label="Days of week"
            hint="Leave empty to apply every day"
            error={methods.formState.errors.dayOfWeek?.message as string | undefined}
          >
            <Controller
              control={methods.control}
              name="dayOfWeek"
              render={({ field }) => {
                const set = new Set(field.value ?? []);
                return (
                  <div className="flex flex-wrap gap-2">
                    {DAY_OF_WEEK_LABELS.map((label, day) => {
                      const active = set.has(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            const next = new Set(set);
                            if (next.has(day)) next.delete(day);
                            else next.add(day);
                            field.onChange(Array.from(next).sort((a, b) => a - b));
                          }}
                          className={cn(
                            'w-11 h-9 rounded-lg border text-sm font-medium transition-colors',
                            active
                              ? 'border-role-partner-primary bg-role-partner-light text-role-partner-primary'
                              : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                          )}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                );
              }}
            />
          </FieldShell>

          <div className="grid grid-cols-2 gap-4 items-start">
            <TextField<PricingRuleFormValues>
              name="priority"
              label="Priority"
              type="number"
              hint="Higher applies first (0-1000)"
            />
            <ToggleField<PricingRuleFormValues> name="isActive" label="Active" />
          </div>
        </form>
      </FormProvider>
    </Modal>
  );
}
