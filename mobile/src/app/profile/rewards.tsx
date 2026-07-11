import { View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { useAuthStore } from '@/stores/authStore';

const NAVY = '#0B1D45';
const GOLD = '#F5A623';

/**
 * [MOCK] Loyalty program (tier + points). Backend chưa có endpoint loyalty
 * (`LoyaltyAccount`/`LoyaltyTransaction` mới chỉ có ở Prisma schema, chưa có
 * service/route) — giữ nguyên số liệu tĩnh giống bên web (`LoyaltyPage`) cho
 * tới khi backend triển khai thật.
 */
const CURRENT_TIER = 'silver' as const;
const TOTAL_POINTS = 1240;
const NEXT_TIER = 'gold';
const NEXT_THRESHOLD = 5000;

const POINTS_HISTORY = [
  { id: 'h1', label: 'Stay at SmartStay Hanoi Old Quarter', points: 420, date: '2026-06-18' },
  { id: 'h2', label: 'Stay at Pearl Bay Resort', points: 380, date: '2026-05-22' },
  { id: 'h3', label: 'Welcome bonus', points: 200, date: '2026-04-02' },
  { id: 'h4', label: 'Redeemed for late checkout', points: -100, date: '2026-06-25' },
];

export default function RewardsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const progressPct = Math.min(100, Math.round((TOTAL_POINTS / NEXT_THRESHOLD) * 100));

  return (
    <SafeAreaView className="flex-1 bg-navy" edges={['top']}>
      <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 bg-white border-b border-gray-100">
        <Pressable onPress={() => router.back()} hitSlop={8} className="w-9 h-9 items-center justify-center">
          <Ionicons name="arrow-back" size={22} color={NAVY} />
        </Pressable>
        <Heading size="lg" className="text-navy">SmartStay Plus</Heading>
      </View>

      <ScrollView className="flex-1 bg-gray-100" contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        <View className="rounded-3xl p-6 bg-navy">
          <View className="flex-row items-center justify-between">
            <View>
              <Text bold className="text-white/80 text-xs uppercase tracking-wider">
                {CURRENT_TIER} member
              </Text>
              <Text bold className="text-white text-4xl mt-1.5">{TOTAL_POINTS.toLocaleString()}</Text>
              <Text size="sm" className="text-white/70">points available</Text>
            </View>
            <Ionicons name="gift-outline" size={44} color={GOLD} />
          </View>

          <View className="mt-6">
            <View className="flex-row items-center justify-between mb-1.5">
              <Text size="xs" className="text-white/70 capitalize">{CURRENT_TIER}</Text>
              <Text size="xs" bold className="text-white">
                {NEXT_THRESHOLD - TOTAL_POINTS} pts to {NEXT_TIER}
              </Text>
            </View>
            <View className="h-2 bg-white/20 rounded-full overflow-hidden">
              <View className="h-full rounded-full" style={{ width: `${progressPct}%`, backgroundColor: GOLD }} />
            </View>
          </View>

          {user?.fullName ? (
            <Text size="xs" className="text-white/60 mt-4">Member: {user.fullName}</Text>
          ) : null}
        </View>

        <Heading size="md" className="text-navy mt-6 mb-2 px-1">Points history</Heading>
        <View className="bg-white rounded-2xl overflow-hidden">
          {POINTS_HISTORY.map((tx, index) => {
            const positive = tx.points >= 0;
            return (
              <View
                key={tx.id}
                className={`flex-row items-center justify-between px-4 py-3.5 ${
                  index < POINTS_HISTORY.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <View className="flex-row items-center gap-3 flex-1 pr-3">
                  <View
                    className="w-9 h-9 rounded-full items-center justify-center"
                    style={{ backgroundColor: positive ? '#DCFCE7' : '#FEE2E2' }}
                  >
                    <Ionicons
                      name={positive ? 'trending-up' : 'trending-down'}
                      size={16}
                      color={positive ? '#16A34A' : '#DC2626'}
                    />
                  </View>
                  <View className="flex-1">
                    <Text bold size="sm" className="text-navy">{tx.label}</Text>
                    <Text size="xs" className="text-gray-400 mt-0.5">{tx.date}</Text>
                  </View>
                </View>
                <Text bold size="sm" style={{ color: positive ? '#16A34A' : '#DC2626' }}>
                  {positive ? '+' : ''}{tx.points.toLocaleString()}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
