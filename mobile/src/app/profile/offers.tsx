import { View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { GUEST_COLORS } from '@/constants/guestTheme';


/**
 * [MOCK] Ưu đãi / voucher. Backend chưa có endpoint promotions (`Promotion`
 * mới chỉ có ở Prisma schema) — dữ liệu tĩnh giống bên web (`MyVouchersPage`)
 * cho tới khi backend triển khai thật.
 */
const OFFERS = [
  {
    id: 'o1',
    code: 'SUMMER25',
    title: 'Summer getaway',
    description: '25% off stays of 3 nights or more.',
    validUntil: '2026-08-31',
  },
  {
    id: 'o2',
    code: 'WEEKEND10',
    title: 'Weekend flash deal',
    description: '10% off any weekend stay.',
    validUntil: '2026-07-31',
  },
  {
    id: 'o3',
    code: 'PLUS50K',
    title: 'SmartStay Plus bonus',
    description: '50,000đ off your next booking as a Plus member.',
    validUntil: '2026-09-30',
  },
];

export default function OffersScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-on-surface" edges={['top']}>
      <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 bg-surface border-b border-hairline/30">
        <Pressable onPress={() => router.back()} hitSlop={8} className="w-9 h-9 items-center justify-center">
          <Ionicons name="arrow-back" size={22} color={GUEST_COLORS.onSurface} />
        </Pressable>
        <Heading size="lg" className="font-bevi-bold text-on-surface">My Offers</Heading>
      </View>

      <ScrollView className="flex-1 bg-canvas" contentContainerStyle={{ padding: 16, gap: 12 }} showsVerticalScrollIndicator={false}>
        <Text size="sm" className="font-bevi text-on-surface-variant px-1 mb-1">
          Apply a code at checkout to redeem your discount.
        </Text>
        {OFFERS.map((offer) => (
          <View key={offer.id} className="bg-surface rounded-card p-4">
            <View className="flex-row items-center gap-2">
              <Ionicons name="pricetag-outline" size={18} color={GUEST_COLORS.onSurface} />
              <Text bold className="font-bevi-bold text-on-surface text-base">{offer.title}</Text>
            </View>
            <Text size="sm" className="font-bevi text-on-surface-variant mt-1">{offer.description}</Text>
            <Text size="xs" className="font-bevi text-muted mt-1.5">Valid until {offer.validUntil}</Text>

            <View className="mt-3 flex-row items-center justify-between rounded-field border border-dashed border-gray-300 bg-surface-low px-4 py-2.5">
              <Text bold className="font-bevi-bold text-on-surface tracking-wider">{offer.code}</Text>
              <Text size="xs" className="font-bevi text-muted">Enter at checkout</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
