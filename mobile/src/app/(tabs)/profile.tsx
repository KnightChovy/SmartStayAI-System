import { View, Pressable, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { LanguageSwitcher } from '@/components/guest';
import { useTranslation } from 'react-i18next';
import { MenuList } from '@/components/shared/MenuList';
import { useAuthStore } from '@/stores/authStore';
import { useMyWallet } from '@/hooks/wallet';
import { formatVnd } from '@/utils/formatCurrency';
import { GUEST_COLORS } from '@/constants/guestTheme';


export default function ProfileScreen() {
  const { t } = useTranslation(['account', 'common']);
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const { data: wallet } = useMyWallet();

  const benefitItems = [
    { icon: 'gift-outline' as const, label: t('account:menu.myOffers'), sub: t('account:menu.myOffersSub'), onPress: () => router.push('/profile/offers') },
    { icon: 'star-outline' as const, label: t('account:menu.rewards'), sub: t('account:menu.rewardsSub'), onPress: () => router.push('/profile/rewards') },
    { icon: 'chatbubble-ellipses-outline' as const, label: t('account:menu.reviews'), onPress: () => router.push('/profile/my-reviews') },
  ];

  const financeItems = [
    {
      icon: 'wallet-outline' as const,
      label: t('account:menu.wallet'),
      sub: wallet ? formatVnd(wallet.balanceAvailable) : t('account:menu.walletSub'),
      onPress: () => router.push('/profile/wallet'),
    },
    { icon: 'receipt-outline' as const, label: t('account:menu.transactions'), sub: t('account:menu.transactionsSub'), onPress: () => router.push('/profile/transactions') },
  ];

  const settingItems = [
    { icon: 'chatbubbles-outline' as const, label: t('account:menu.messages'), sub: t('account:menu.messagesSub'), onPress: () => router.push('/profile/messages') },
    { icon: 'notifications-outline' as const, label: t('account:menu.notifications'), onPress: () => router.push('/notifications') },
    { icon: 'shield-checkmark-outline' as const, label: t('account:menu.security'), onPress: () => router.push('/profile/security') },
    { icon: 'help-circle-outline' as const, label: t('account:menu.help'), onPress: () => router.push('/profile/help-support') },
    { icon: 'information-circle-outline' as const, label: t('account:menu.about'), onPress: () => router.push('/profile/about') },
  ];

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
    Alert.alert(t('account:signOut'), t('account:signOutConfirm'), [
      { text: t('common:cancel'), style: 'cancel' },
      {
        text: t('account:signOut'),
        style: 'destructive',
        onPress: () => {
          clearAuth();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  return (
    <View className="flex-1 bg-canvas">
      {/* Navy header bg */}
      <SafeAreaView edges={['top']} className="bg-on-surface">
        <View className="flex-row items-center justify-center px-5 pt-2 pb-4">
          <Text bold className="font-bevi-bold text-white text-lg">
            {t('account:title')}
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* User info card — overlaps navy header */}
        <View className="bg-on-surface px-5 pb-4">
          <View className="flex-row items-center">
            {/* Avatar */}
            <View className="w-[68px] h-[68px] rounded-full bg-bronze items-center justify-center mr-4">
              <Text bold className="font-bevi-bold text-on-surface text-2xl">
                {initials}
              </Text>
            </View>

            {/* Name + email */}
            <View className="flex-1">
              <View className="flex-row items-center gap-1.5">
                <Text bold className="font-bevi-bold text-white text-base">
                  {user?.fullName ?? t('account:guest')}
                </Text>
                <Ionicons name="shield-checkmark" size={16} color={GUEST_COLORS.bronze} />
              </View>
              <Text size="sm" className="font-bevi text-white/70 mt-0.5">
                {user?.email ?? ''}
              </Text>
              <Pressable onPress={() => router.push('/profile/edit')} className="mt-1.5 self-start bg-surface/15 rounded-full px-3 py-1">
                <Text size="xs" bold className="font-bevi-bold text-white">
                  {t('account:editProfile')}
                </Text>
              </Pressable>
            </View>

            {/* Edit */}
            <Pressable onPress={() => router.push('/profile/edit')} className="w-9 h-9 rounded-full bg-surface/10 items-center justify-center">
              <Ionicons name="pencil-outline" size={16} color={GUEST_COLORS.white} />
            </Pressable>
          </View>

          {/* Profile completion */}
          <View className="mt-4">
            <View className="flex-row items-center justify-between mb-1.5">
              <Text size="xs" className="font-bevi text-white/70">
                {t('account:completion')}
              </Text>
              <Text size="xs" bold className="font-bevi-bold text-white">
                {completedCount}/{completionSteps.length}
              </Text>
            </View>
            <View className="h-2 bg-surface/20 rounded-full overflow-hidden">
              <View
                className="h-full bg-bronze rounded-full"
                style={{ width: `${completionPct}%` }}
              />
            </View>
          </View>
        </View>

        {/* Completion prompt card */}
        {completedCount < completionSteps.length && (
          <View className="mx-4 -mt-1 mb-1">
            <View className="bg-blue-700 rounded-card p-4 flex-row items-center gap-3">
              <View className="flex-1">
                <Text bold className="font-bevi-bold text-white text-sm">
                  {t('account:completeTitle')}
                </Text>
                <Text size="xs" className="font-bevi text-white/70 mt-1 leading-4">
                  {t('account:completeBody')}
                </Text>
              </View>
              <Pressable onPress={() => router.push('/profile/edit')} className="bg-surface rounded-field px-3 py-2">
                <Text bold className="font-bevi-bold text-on-surface text-xs">
                  {t('account:update')}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        <View className="px-4">
          {/* Quick actions */}
          <View className="flex-row gap-3 mt-4">
            <Pressable onPress={() => router.push('/(tabs)/bookings')} className="flex-1 bg-surface rounded-card p-4 items-start gap-2">
              <View className="w-10 h-10 rounded-field bg-brand/10 items-center justify-center">
                <Ionicons name="calendar-outline" size={20} color={GUEST_COLORS.onSurface} />
              </View>
              <Text bold className="font-bevi-bold text-on-surface text-sm">
                {t('account:quick.bookings')}
              </Text>
              <Text size="xs" className="font-bevi text-muted">
                {t('account:quick.bookingsSub')}
              </Text>
            </Pressable>
            <Pressable onPress={() => router.push('/profile/rewards')} className="flex-1 bg-surface rounded-card p-4 items-start gap-2">
              <View className="w-10 h-10 rounded-field bg-bronze/10 items-center justify-center">
                <Ionicons name="diamond-outline" size={20} color={GUEST_COLORS.bronze} />
              </View>
              <Text bold className="font-bevi-bold text-on-surface text-sm">
                {t('account:quick.plus')}
              </Text>
              <Text size="xs" className="font-bevi text-muted">
                {t('account:quick.plusSub')}
              </Text>
            </Pressable>
          </View>

          {/* Benefits */}
          <SectionHeader title={t('account:sections.offers')} />
          <MenuList items={benefitItems} />

          {/* Finance */}
          <SectionHeader title={t('account:sections.finance')} actionLabel={t('account:sections.seeMore')} onAction={() => router.push('/profile/transactions')} />
          <MenuList items={financeItems} />

          {/* Settings */}
          <SectionHeader title={t('account:sections.settings')} />
          <MenuList items={settingItems} />

          {/* Đổi ngôn ngữ cho khách đã đăng nhập — bản ở màn auth chỉ tới được khi chưa vào app. */}
          <View className="mt-3 flex-row items-center justify-between rounded-card border border-hairline/30 bg-surface px-4 py-3.5">
            <View className="flex-row items-center gap-3">
              <View className="h-9 w-9 items-center justify-center rounded-field bg-brand/10">
                <Ionicons name="language-outline" size={18} color={GUEST_COLORS.brand} />
              </View>
              <Text className="font-bevi-medium text-on-surface" size="sm">
                {t('common:language')}
              </Text>
            </View>
            <LanguageSwitcher />
          </View>

          {/* Logout */}
          <Pressable
            onPress={handleLogout}
            className="flex-row items-center justify-center gap-2 mt-4 bg-red-50 rounded-card py-3.5 border border-red-500"
          >
            <Ionicons name="log-out-outline" size={20} color="#DC2626" />
            <Text bold className="font-bevi-bold text-red-600 text-base">
              {t('account:signOut')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
