import { View, Pressable, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { MenuList } from '@/components/shared/MenuList';
import { useAuthStore } from '@/stores/authStore';

const GOLD = '#F5A623';
const NAVY = '#0B1D45';

const BENEFIT_ITEMS = [
  { icon: 'gift-outline' as const, label: 'My Offers', sub: '3 offers available' },
  { icon: 'star-outline' as const, label: 'Reward Points', sub: '1,240 points' },
];

const FINANCE_ITEMS = [
  { icon: 'card-outline' as const, label: 'Payment Methods', sub: 'Add card/wallet' },
  { icon: 'receipt-outline' as const, label: 'Transaction History', sub: 'View all' },
];

const SETTING_ITEMS = [
  { icon: 'notifications-outline' as const, label: 'Notifications' },
  { icon: 'shield-checkmark-outline' as const, label: 'Security & Privacy' },
  { icon: 'help-circle-outline' as const, label: 'Help & Support' },
  { icon: 'information-circle-outline' as const, label: 'About' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  const initials = user?.fullName
    ?.split(' ')
    .map((w) => w[0])
    .slice(-2)
    .join('')
    .toUpperCase() ?? '?';

  const completionSteps = [
    !!user?.fullName,
    !!user?.email,
    true,
    false,
  ];
  const completedCount = completionSteps.filter(Boolean).length;
  const completionPct = (completedCount / completionSteps.length) * 100;

  function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          clearAuth();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  return (
    <View className="flex-1 bg-gray-100">
      {/* Navy header bg */}
      <SafeAreaView edges={['top']} className="bg-navy">
        <View className="flex-row items-center justify-center px-5 pt-2 pb-4">
          <Text bold className="text-white text-lg">
            Account
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* User info card — overlaps navy header */}
        <View className="bg-navy px-5 pb-4">
          <View className="flex-row items-center">
            {/* Avatar */}
            <View className="w-[68px] h-[68px] rounded-full bg-gold items-center justify-center mr-4">
              <Text bold className="text-navy text-2xl">
                {initials}
              </Text>
            </View>

            {/* Name + email */}
            <View className="flex-1">
              <View className="flex-row items-center gap-1.5">
                <Text bold className="text-white text-base">
                  {user?.fullName ?? 'Guest'}
                </Text>
                <Ionicons name="shield-checkmark" size={16} color={GOLD} />
              </View>
              <Text size="sm" className="text-white/70 mt-0.5">
                {user?.email ?? ''}
              </Text>
              <Pressable className="mt-1.5 self-start bg-white/15 rounded-full px-3 py-1">
                <Text size="xs" bold className="text-white">
                  Add occupation/position
                </Text>
              </Pressable>
            </View>

            {/* Edit */}
            <Pressable className="w-9 h-9 rounded-full bg-white/10 items-center justify-center">
              <Ionicons name="pencil-outline" size={16} color="#fff" />
            </Pressable>
          </View>

          {/* Profile completion */}
          <View className="mt-4">
            <View className="flex-row items-center justify-between mb-1.5">
              <Text size="xs" className="text-white/70">
                Profile completion
              </Text>
              <Text size="xs" bold className="text-white">
                {completedCount}/{completionSteps.length}
              </Text>
            </View>
            <View className="h-2 bg-white/20 rounded-full overflow-hidden">
              <View
                className="h-full bg-gold rounded-full"
                style={{ width: `${completionPct}%` }}
              />
            </View>
          </View>
        </View>

        {/* Completion prompt card */}
        {completedCount < completionSteps.length && (
          <View className="mx-4 -mt-1 mb-1">
            <View className="bg-blue-700 rounded-2xl p-4 flex-row items-center gap-3">
              <View className="flex-1">
                <Text bold className="text-white text-sm">
                  Complete your profile
                </Text>
                <Text size="xs" className="text-white/70 mt-1 leading-4">
                  Add more details to unlock offers tailored just for you.
                </Text>
              </View>
              <Pressable className="bg-white rounded-xl px-3 py-2">
                <Text bold className="text-navy text-xs">
                  Update
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        <View className="px-4">
          {/* Quick actions */}
          <View className="flex-row gap-3 mt-4">
            <Pressable className="flex-1 bg-white rounded-2xl p-4 items-start gap-2">
              <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center">
                <Ionicons name="calendar-outline" size={20} color={NAVY} />
              </View>
              <Text bold className="text-navy text-sm">
                Bookings
              </Text>
              <Text size="xs" className="text-gray-400">
                View history
              </Text>
            </Pressable>
            <Pressable className="flex-1 bg-white rounded-2xl p-4 items-start gap-2">
              <View className="w-10 h-10 rounded-xl bg-amber-50 items-center justify-center">
                <Ionicons name="diamond-outline" size={20} color={GOLD} />
              </View>
              <Text bold className="text-navy text-sm">
                SmartStay Plus
              </Text>
              <Text size="xs" className="text-gray-400">
                Silver Member
              </Text>
            </Pressable>
          </View>

          {/* Benefits */}
          <SectionHeader title="Offers" />
          <MenuList items={BENEFIT_ITEMS} />

          {/* Finance */}
          <SectionHeader title="Finance" actionLabel="See more" />
          <MenuList items={FINANCE_ITEMS} />

          {/* Settings */}
          <SectionHeader title="Settings" />
          <MenuList items={SETTING_ITEMS} />

          {/* Logout */}
          <Pressable
            onPress={handleLogout}
            className="flex-row items-center justify-center gap-2 mt-4 bg-red-50 rounded-2xl py-3.5"
          >
            <Ionicons name="log-out-outline" size={20} color="#DC2626" />
            <Text bold className="text-red-600 text-base">
              Sign Out
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
