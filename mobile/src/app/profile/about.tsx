import { View, ScrollView, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Constants from 'expo-constants';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { GUEST_COLORS } from '@/constants/guestTheme';


/** Chỉ giữ key ở ngoài; dịch trong render để đổi ngôn ngữ ăn ngay. */
const LINKS = [
  { icon: 'globe-outline' as const, labelKey: 'website', url: 'https://smartstay.ai' },
  { icon: 'document-text-outline' as const, labelKey: 'terms', url: 'https://smartstay.ai/terms' },
  { icon: 'shield-outline' as const, labelKey: 'privacy', url: 'https://smartstay.ai/privacy' },
] as const;

export default function AboutScreen() {
  const router = useRouter();
  const { t } = useTranslation(['account', 'common']);
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView className="flex-1 bg-on-surface" edges={['top']}>
      <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 bg-surface border-b border-hairline/30">
        <Pressable onPress={() => router.back()} hitSlop={8} className="w-9 h-9 items-center justify-center">
          <Ionicons name="arrow-back" size={22} color={GUEST_COLORS.onSurface} />
        </Pressable>
        <Heading size="lg" className="font-bevi-bold text-on-surface">{t('account:about.title')}</Heading>
      </View>

      <ScrollView className="flex-1 bg-canvas" contentContainerStyle={{ padding: 16, gap: 12 }} showsVerticalScrollIndicator={false}>
        <View className="items-center bg-surface rounded-card p-6">
          <View className="w-16 h-16 rounded-card bg-on-surface items-center justify-center mb-3">
            <Ionicons name="bed" size={28} color={GUEST_COLORS.bronze} />
          </View>
          <Heading size="lg" className="font-bevi-bold text-on-surface">SmartStay AI</Heading>
          <Text size="sm" className="font-bevi text-muted mt-1">Version {version}</Text>
          <Text size="sm" className="font-bevi text-on-surface-variant text-center mt-3 leading-5">
            AI-powered hotel booking and customer engagement — find your stay, book in seconds, and check in
            with a tap.
          </Text>
        </View>

        <View className="bg-surface rounded-card overflow-hidden">
          {LINKS.map((link, index) => (
            <Pressable
              key={link.labelKey}
              onPress={() => Linking.openURL(link.url)}
              className={`flex-row items-center justify-between p-4 ${index < LINKS.length - 1 ? 'border-b border-hairline/30' : ''}`}
            >
              <View className="flex-row items-center gap-3">
                <Ionicons name={link.icon} size={18} color={GUEST_COLORS.onSurface} />
                <Text bold className="font-bevi-bold text-on-surface text-sm">{t(`account:about.${link.labelKey}`)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={GUEST_COLORS.hairline} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
