import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { formatVnd } from '@/utils/formatCurrency';
import { formatDateShort } from '@/utils/formatDate';
import { GUEST_COLORS } from '@/constants/guestTheme';
import type { BookingRefund, RefundStatus } from '@/types/payments.type';

/** Ba bước tiền đi qua trước khi về tới khách. `rejected` nằm ngoài luồng này. */
const FLOW = ['pending', 'approved', 'processed'] as const;

const STATUS_STYLE: Record<RefundStatus, { bg: string; text: string }> = {
  pending: { bg: '#FEF3C7', text: '#92400E' },
  approved: { bg: '#DBEAFE', text: '#1D4ED8' },
  processed: { bg: '#D1FAE5', text: '#047857' },
  rejected: { bg: '#FEE2E2', text: '#DC2626' },
};

/**
 * Theo dõi yêu cầu hoàn tiền của khách — mirror `RefundStatusCard` bên client: chờ
 * khách sạn duyệt → khách sạn đã duyệt → đã chuyển khoản, hoặc bị từ chối kèm lý do.
 * Tiền KHÔNG về ngay khi huỷ.
 */
export function RefundStatusCard({ refund }: { refund: BookingRefund }) {
  const { t } = useTranslation('account');
  const currentStep = FLOW.indexOf(refund.status as (typeof FLOW)[number]);
  const isRejected = refund.status === 'rejected';
  const statusStyle = STATUS_STYLE[refund.status];

  const stepDate: Record<(typeof FLOW)[number], string | null | undefined> = {
    pending: refund.createdAt,
    approved: refund.reviewedAt,
    processed: refund.processedAt,
  };

  return (
    <View className="bg-surface rounded-card p-4 border border-hairline/30">
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-row items-center gap-2">
          <Ionicons name="cash-outline" size={16} color={GUEST_COLORS.onSurface} />
          <Text bold className="font-bevi-bold text-on-surface text-sm">{t('refund.title')}</Text>
        </View>
        <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: statusStyle.bg }}>
          <Text size="2xs" bold className="font-bevi-bold" style={{ color: statusStyle.text }}>
            {t(`refund.status.${refund.status}`)}
          </Text>
        </View>
      </View>

      <Text size="sm" className="font-bevi text-on-surface-variant mt-3">
        {t('refund.amountLabel')}
        <Text bold className="font-bevi-bold text-on-surface">{formatVnd(refund.amount)}</Text>
      </Text>
      {refund.reason ? (
        <Text size="sm" className="font-bevi text-on-surface-variant mt-1">
          {t('refund.reasonLabel', { reason: refund.reason })}
        </Text>
      ) : null}

      {isRejected ? (
        <View className="mt-3 bg-red-50 rounded-field p-3">
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="close-circle" size={15} color="#DC2626" />
            <Text bold size="sm" className="font-bevi-bold text-red-600">{t('refund.rejectedTitle')}</Text>
          </View>
          <Text size="sm" className="font-bevi text-red-600 mt-1">
            {refund.rejectionReason || t('refund.rejectedNoReason')}
          </Text>
        </View>
      ) : (
        <View className="mt-3 gap-3">
          {FLOW.map((step, index) => {
            const done = index < currentStep;
            const active = index === currentStep;
            const date = stepDate[step];
            return (
              <View key={step} className="flex-row gap-3">
                <View
                  className="w-6 h-6 rounded-full items-center justify-center mt-0.5"
                  style={{
                    backgroundColor: done ? '#D1FAE5' : active ? '#DBEAFE' : GUEST_COLORS.surfaceContainer,
                  }}
                >
                  {done ? (
                    <Ionicons name="checkmark" size={13} color="#047857" />
                  ) : active ? (
                    <Ionicons name="time-outline" size={13} color="#1D4ED8" />
                  ) : (
                    <View className="w-1.5 h-1.5 rounded-full bg-muted" />
                  )}
                </View>
                <View className="flex-1">
                  <Text
                    size="sm"
                    bold={done || active}
                    className={`font-bevi-bold ${done || active ? 'text-on-surface' : 'text-muted'}`}
                  >
                    {t(`refund.steps.${step}.title`)}
                  </Text>
                  <Text size="xs" className="font-bevi text-on-surface-variant mt-0.5">
                    {t(`refund.steps.${step}.desc`)}
                    {(done || active) && date ? ` · ${formatDateShort(date)}` : ''}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
