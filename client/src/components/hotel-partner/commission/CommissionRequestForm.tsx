import { useMemo } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Clock, Loader2, Lock, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  TextField,
  TextareaField,
} from '@/components/hotel-partner/shared/form-controls';
import { Pill } from '@/components/hotel-partner/shared/Pill';
import { formatRate } from '@/components/shared/commission-labels';
import { useCreateCommissionRequest } from '@/hooks/commission-rate';
import { errorMessage } from '@/utils/errorMessage';
import { formatDate } from '@/utils/formatDate';
import {
  AGREEMENT_MONTHS,
  HARD_FLOOR_RATE,
  REASON_MAX,
  REASON_MIN,
  createCommissionRequestFormSchema,
  type CommissionRequestFormValues,
} from '@/validations/commission-rate.validation';
import type { HotelCommissionSummary } from '@/types/commission-rate.types';

interface CommissionRequestFormProps {
  hotelId: string;
  summary: HotelCommissionSummary;
}

/**
 * Khối nộp đơn xin giảm hoa hồng.
 *
 * Khi backend không cho nộp thì hiện `canRequest.reason` NGUYÊN VĂN thay vì disable câm —
 * bốn điều kiện chặn (đơn pending / cooldown 7 ngày / cửa sổ gia hạn / biên mức) đều có thể
 * đổi ở backend nên client không tự suy luận (xem §6.3 tài liệu bàn giao).
 */
export function CommissionRequestForm({
  hotelId,
  summary,
}: CommissionRequestFormProps) {
  const { canRequest, pendingRequest, agreement, currentRate } = summary;
  const createRequest = useCreateCommissionRequest();

  /**
   * Mức để đối chiếu trong hint. Đơn gia hạn phải thấp hơn mức SẼ ÁP SAU KHI ưu đãi hiện tại
   * hết hạn (`rateAfterExpiry`), không phải mức đang hưởng — mức đó có thể CAO HƠN mức
   * đang hưởng mà vẫn là "xin giảm". Backend dùng đúng con số này để chấm đơn.
   */
  const benchmarkRate =
    canRequest.isRenewal && agreement ? agreement.rateAfterExpiry : currentRate;
  const benchmark = Number(benchmarkRate);

  /** Mức gợi ý: số nguyên gần nhất còn nằm dưới mức đối chiếu và không phá sàn cứng. */
  const suggestedRate = Math.max(
    HARD_FLOOR_RATE,
    Math.floor(benchmark - 1) || HARD_FLOOR_RATE
  );

  // Schema phụ thuộc mức đối chiếu ⇒ dựng lại khi con số đó đổi (PM lên lịch mức nền mới,
  // hoặc đổi giữa đơn thường và đơn gia hạn), không cache theo lần mount đầu.
  const schema = useMemo(
    () => createCommissionRequestFormSchema(benchmark),
    [benchmark]
  );

  const methods = useForm<CommissionRequestFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { requestedRate: '', reason: '' },
    mode: 'onBlur',
  });

  const reason = useWatch({ control: methods.control, name: 'reason' }) ?? '';

  const onSubmit = methods.handleSubmit(async values => {
    try {
      await createRequest.mutateAsync({
        hotelId,
        dto: {
          requestedRate: Number(values.requestedRate),
          reason: values.reason.trim(),
        },
      });
      toast.success('Request submitted — waiting for the Platform Manager');
      methods.reset({ requestedRate: '', reason: '' });
    } catch (err) {
      // Message 400 của backend là tiếng Việt, hiển thị nguyên văn (xem chú thích ở cuối file).
      toast.error(errorMessage(err, 'Could not submit this request'));
    }
  });

  if (pendingRequest) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-6">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-600" />
          <h2 className="font-semibold text-slate-900">
            Request awaiting review
          </h2>
          {pendingRequest.isRenewal && <Pill tone="blue">Renewal</Pill>}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Stat
            label="Proposed rate"
            value={formatRate(pendingRequest.requestedRate)}
          />
          <Stat
            label="Compared against"
            value={formatRate(pendingRequest.currentRate)}
          />
          <Stat
            label="Submitted"
            value={formatDate(pendingRequest.createdAt)}
          />
        </div>
        <div className="mt-4 rounded-lg border border-amber-200 bg-white px-3.5 py-3">
          <p className="text-xs font-medium text-slate-500">Reason submitted</p>
          <p className="mt-1 text-sm text-slate-700">{pendingRequest.reason}</p>
        </div>
        <p className="mt-3 text-xs text-amber-800">
          {canRequest.reason ??
            'You can only submit a new request once this one has been reviewed.'}
        </p>
      </div>
    );
  }

  // ─── Không được nộp đơn ───────────────────────────────────────────────────
  if (!canRequest.allowed) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
            <Lock className="h-4 w-4 text-slate-500" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">
              Requests are not open right now
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {canRequest.reason ??
                'This hotel is not currently eligible to request a lower commission rate.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Đã chạm sàn cứng ─────────────────────────────────────────────────────
  // Mức đối chiếu bằng (hoặc dưới) sàn cứng thì KHÔNG có con số nào vừa thấp hơn nó vừa hợp lệ.
  // Bày form ra là mời đối tác gõ vào một ô không bao giờ gửi được, nên nói thẳng lý do.
  if (Number.isFinite(benchmark) && benchmark <= HARD_FLOOR_RATE) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
            <Lock className="h-4 w-4 text-slate-500" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">
              Already at the lowest rate we can offer
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              This hotel is on {formatRate(benchmarkRate)}, which is the
              platform floor of {HARD_FLOOR_RATE}%. No rate below it can be
              approved, so there is nothing to request.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Form nộp đơn ─────────────────────────────────────────────────────────
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-2">
        <h2 className="font-semibold text-slate-900">
          {canRequest.isRenewal
            ? 'Request a renewal'
            : 'Request a lower commission rate'}
        </h2>
        {canRequest.isRenewal && <Pill tone="blue">Renewal</Pill>}
      </div>
      <p className="mt-1 text-sm text-slate-500">
        {canRequest.isRenewal
          ? `The new rate starts the day after your current one expires and runs for ${AGREEMENT_MONTHS} months. The time you are still enjoying is not cut short.`
          : `If approved, the new rate applies immediately for ${AGREEMENT_MONTHS} months and cannot be changed until it expires.`}
      </p>

      <FormProvider {...methods}>
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <TextField<CommissionRequestFormValues>
            name="requestedRate"
            label="Proposed commission rate (%)"
            type="number"
            step="0.01"
            min={HARD_FLOOR_RATE}
            max={100}
            required
            // Placeholder là MỘT con số, không phải khoảng "10-15": input number bỏ qua chuỗi
            // không parse được, nên gõ theo mẫu khoảng sẽ ra ô rỗng trong khi màn hình vẫn hiện
            // chữ vừa gõ — trông như form tự xoá dữ liệu.
            placeholder={`e.g. ${suggestedRate}`}
            hint={`Must be below ${formatRate(benchmarkRate)} and not under ${HARD_FLOOR_RATE}%`}
            className="max-w-xs"
          />

          <TextareaField<CommissionRequestFormValues>
            name="reason"
            label="Why are you requesting this?"
            rows={4}
            placeholder="e.g. Highly competitive area — we commit to driving more bookings through the platform."
            hint={`${reason.trim().length}/${REASON_MAX} characters · at least ${REASON_MIN}`}
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={createRequest.isPending}
              className="bg-role-partner-primary text-white hover:bg-role-partner-secondary"
            >
              {createRequest.isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-1.5 h-4 w-4" />
              )}
              Submit request
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-white px-3.5 py-2.5">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}
