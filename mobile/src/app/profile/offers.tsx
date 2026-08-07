import { View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { GUEST_COLORS } from '@/constants/guestTheme';


/**
 * [MOCK] Ưu đãi / voucher. Backend chưa có endpoint promotions (`Promotion`
 * mới chỉ có ở Prisma schema) — dữ liệu tĩnh giống bên web (`MyVouchersPage`)
 * cho tới khi backend triển khai thật. `titleKey`/`descKey` trỏ vào i18n để
 * chữ hiển thị theo đúng ngôn ngữ đang chọn.
 */
const OFFERS = [
  { id: 'o1', code: 'SUMMER25', titleKey: 'summer', validUntil: '2026-08-31' },
  { id: 'o2', code: 'WEEKEND10', titleKey: 'weekend', validUntil: '2026-07-31' },
  { id: 'o3', code: 'PLUS50K', titleKey: 'plusBonus', validUntil: '2026-09-30' },
] as const;

export default function OffersScreen() {
  const router = useRouter();
  const { t } = useTranslation(['account', 'common']);

  return (
    <SafeAreaView className="flex-1 bg-on-surface" edges={['top']}>
      <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 bg-surface border-b border-hairline/30">
        <Pressable onPress={() => router.back()} hitSlop={8} className="w-9 h-9 items-center justify-center">
          <Ionicons name="arrow-back" size={22} color={GUEST_COLORS.onSurface} />
        </Pressable>
        <Heading size="lg" className="font-bevi-bold text-on-surface">{t('account:offers.title')}</Heading>
      </View>

      <ScrollView className="flex-1 bg-canvas" contentContainerStyle={{ padding: 16, gap: 12 }} showsVerticalScrollIndicator={false}>
        <Text size="sm" className="font-bevi text-on-surface-variant px-1 mb-1">
          {t('account:offers.hint')}
        </Text>
        {OFFERS.map((offer) => (
          <View key={offer.id} className="bg-surface rounded-card p-4">
            <View className="flex-row items-center gap-2">
              <Ionicons name="pricetag-outline" size={18} color={GUEST_COLORS.onSurface} />
              <Text bold className="font-bevi-bold text-on-surface text-base">
                {t(`account:offers.items.${offer.titleKey}.title`)}
              </Text>
            </View>
            <Text size="sm" className="font-bevi text-on-surface-variant mt-1">
              {t(`account:offers.items.${offer.titleKey}.description`)}
            </Text>
            <Text size="xs" className="font-bevi text-muted mt-1.5">
              {t('account:offers.validUntil', { date: offer.validUntil })}
            </Text>

            <View className="mt-3 flex-row items-center justify-between rounded-field border border-dashed border-gray-300 bg-surface-low px-4 py-2.5">
              <Text bold className="font-bevi-bold text-on-surface tracking-wider">{offer.code}</Text>
              <Text size="xs" className="font-bevi text-muted">{t('account:offers.enterAtCheckout')}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
