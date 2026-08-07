import { View, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { useMyWallet } from '@/hooks/wallet';
import { formatVnd } from '@/utils/formatCurrency';
import { formatDateShort } from '@/utils/formatDate';
import { GUEST_COLORS } from '@/constants/guestTheme';
import type { CustomerWalletTransaction, CustomerWalletTxnType } from '@/types/wallet.type';

/**
 * Ví của khách (`/profile/wallet`) — mirror `WalletPage` bên client. Số dư chỉ có
 * MỘT chiều "khả dụng" (không có "chờ tất toán" như ví khách sạn) và KHÔNG rút ra
 * ngân hàng được — tiền chỉ tiêu qua booking (`payment/checkout` + `PayNowAction`).
 */
export default function WalletScreen() {
  const router = useRouter();
  const { t } = useTranslation(['account', 'common']);
  const { data, isLoading, isError, refetch, isRefetching } = useMyWallet();
  const balance = data?.balanceAvailable;
  const hasBalance = Number(balance ?? 0) > 0;
  const txns = data?.transactions ?? [];

  return (
    <SafeAreaView className="flex-1 bg-on-surface" edges={['top']}>
      <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 bg-surface border-b border-hairline/30">
        <Pressable onPress={() => router.back()} hitSlop={8} className="w-9 h-9 items-center justify-center">
          <Ionicons name="arrow-back" size={22} color={GUEST_COLORS.onSurface} />
        </Pressable>
        <Heading size="lg" className="font-bevi-bold text-on-surface">{t('account:wallet.title')}</Heading>
      </View>

      <View className="flex-1 bg-surface">
        {isLoading && !data ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={GUEST_COLORS.onSurface} />
          </View>
        ) : isError ? (
          <View className="flex-1 items-center justify-center gap-3 px-8">
            <Ionicons name="cloud-offline-outline" size={48} color={GUEST_COLORS.hairline} />
            <Text className="font-bevi text-muted text-center">{t('account:wallet.loadError')}</Text>
            <Pressable onPress={() => refetch()} className="bg-on-surface rounded-field px-5 py-2.5">
              <Text bold className="font-bevi-bold text-white">{t('common:retry')}</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={txns}
            keyExtractor={(txn) => txn.id}
            contentContainerStyle={{ padding: 16, gap: 10 }}
            onRefresh={refetch}
            refreshing={isRefetching}
            ListHeaderComponent={
              <View className="bg-canvas rounded-card p-5 mb-2 border border-hairline/30">
                <View className="flex-row items-center gap-1.5">
                  <Ionicons name="wallet-outline" size={16} color={GUEST_COLORS.onSurfaceVariant} />
                  <Text size="sm" className="font-bevi text-on-surface-variant">{t('account:wallet.balanceLabel')}</Text>
                </View>
                <Text bold className="font-bevi-bold text-green-600 text-3xl mt-1">{formatVnd(balance)}</Text>
                <Text size="xs" className="font-bevi text-muted mt-2">{t('account:wallet.balanceHint')}</Text>

                {hasBalance && (
                  <Pressable
                    onPress={() => router.push('/(tabs)/bookings')}
                    className="bg-bronze rounded-field px-4 py-2.5 self-start mt-4"
                  >
                    <Text bold className="font-bevi-bold text-on-surface text-sm">{t('account:wallet.useOnBooking')}</Text>
                  </Pressable>
                )}

                <Heading size="md" className="font-bevi-bold text-on-surface mt-6 mb-1">{t('account:wallet.historyTitle')}</Heading>
              </View>
            }
            ListEmptyComponent={
              <View className="items-center justify-center gap-3 mt-6">
                <Ionicons name="wallet-outline" size={56} color={GUEST_COLORS.hairline} />
                <Text bold className="font-bevi-bold text-muted text-base">{t('account:wallet.emptyTitle')}</Text>
                <Text size="sm" className="font-bevi text-hairline text-center">{t('account:wallet.emptyDesc')}</Text>
              </View>
            }
            ListFooterComponent={
              // BE trả tối đa 50 dòng và KHÔNG phân trang endpoint này — nói rõ khi chạm
              // trần thay vì cắt trong im lặng (khách sẽ tưởng giao dịch cũ biến mất).
              txns.length >= 50 ? (
                <View className="flex-row items-start gap-1.5 px-1 mt-2">
                  <Ionicons name="information-circle-outline" size={14} color={GUEST_COLORS.muted} />
                  <Text size="xs" className="font-bevi text-muted flex-1">{t('account:wallet.historyLimit')}</Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <WalletTxnRow
                txn={item}
                onOpenBooking={() => {
                  if (item.bookingId) router.push({ pathname: '/booking/[id]', params: { id: item.bookingId } });
                }}
              />
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const TXN_META: Partial<
  Record<CustomerWalletTxnType, { icon: React.ComponentProps<typeof Ionicons>['name']; labelKey: 'refund' | 'spend' | 'adjustment' }>
> = {
  refund: { icon: 'arrow-down-circle-outline', labelKey: 'refund' },
  spend: { icon: 'arrow-up-circle-outline', labelKey: 'spend' },
  adjustment: { icon: 'sync-circle-outline', labelKey: 'adjustment' },
};

function WalletTxnRow({ txn, onOpenBooking }: { txn: CustomerWalletTransaction; onOpenBooking: () => void }) {
  const { t } = useTranslation('account');
  const meta = TXN_META[txn.type];
  // `amount` của BE đã mang sẵn dấu → suy chiều tiền từ chính nó, không suy từ `type`
  // (`adjustment` đi cả hai chiều).
  const isCredit = Number(txn.amount) >= 0;

  return (
    <View className="flex-row items-start gap-3 bg-surface rounded-card p-4 border border-hairline/30">
      <View
        className="w-9 h-9 rounded-full items-center justify-center mt-0.5"
        style={{ backgroundColor: isCredit ? '#ECFDF5' : GUEST_COLORS.surfaceContainer }}
      >
        <Ionicons
          name={meta?.icon ?? 'sync-circle-outline'}
          size={18}
          color={isCredit ? '#16A34A' : GUEST_COLORS.onSurfaceVariant}
        />
      </View>

      <View className="flex-1">
        <Text bold className="font-bevi-bold text-on-surface text-sm">
          {meta ? t(`wallet.txn.${meta.labelKey}`) : txn.type}
        </Text>
        {txn.description ? (
          <Text size="sm" className="font-bevi text-on-surface-variant mt-0.5">{txn.description}</Text>
        ) : null}
        <View className="flex-row items-center gap-1 mt-1">
          <Text size="xs" className="font-bevi text-muted">{formatDateShort(txn.createdAt)}</Text>
          {txn.bookingId ? (
            <Pressable onPress={onOpenBooking} hitSlop={6}>
              <Text size="xs" bold className="font-bevi-bold text-bronze"> · {t('wallet.viewBooking')}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View className="items-end">
        <Text bold className={`font-bevi-bold text-sm ${isCredit ? 'text-green-600' : 'text-on-surface'}`}>
          {isCredit ? '+' : ''}{formatVnd(txn.amount)}
        </Text>
        <Text size="2xs" className="font-bevi text-muted mt-0.5">
          {t('wallet.balanceAfter', { amount: formatVnd(txn.balanceAfter) })}
        </Text>
      </View>
    </View>
  );
}
