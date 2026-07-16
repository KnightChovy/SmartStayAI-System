import { Pressable, ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { PageDots } from '@/components/shared/PageDots';
import { LuxButton, LanguageSwitcher } from '@/components/guest';
import { AUTH_IMAGES, GUEST_COLORS } from '@/constants/guestTheme';

const FEATURES = [
  { key: 'ai', icon: 'sparkles-outline' },
  { key: 'ops', icon: 'flash-outline' },
  { key: 'price', icon: 'shield-checkmark-outline' },
] as const;

/** Trang 2/2 của onboarding — trang 1 là `(auth)/index`. */
export default function FeaturesScreen() {
  const router = useRouter();
  const { t } = useTranslation(['auth', 'common']);

  return (
    <View className="flex-1 bg-canvas">
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={['top']} className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          <View className="flex-row items-center justify-between px-6 pt-2">
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('common:back')}
              className="-ml-2 h-11 w-11 items-center justify-center"
            >
              <Ionicons name="arrow-back" size={22} color={GUEST_COLORS.onSurface} />
            </Pressable>
            <View className="flex-row items-center gap-3">
              <LanguageSwitcher />
              <Pressable onPress={() => router.push('/(auth)/login')} hitSlop={8} className="py-1">
              <Text className="font-bevi-semibold text-on-surface-variant" size="sm">
                {t('common:skip')}
                </Text>
              </Pressable>
            </View>
          </View>

          <View className="px-6 pt-3">
            <View className="mb-5 flex-row items-center">
              <View className="mr-3 h-[22px] w-1 rounded-sm bg-premium-gold" />
              <Heading className="font-bevi-bold text-on-surface" size="xl">
                {t('auth:intro.whyTitle')}
              </Heading>
            </View>

            {FEATURES.map(feature => (
              <View key={feature.key} className="mb-3 rounded-card border border-hairline/30 bg-surface p-4">
                <View className="mb-2.5 flex-row items-start justify-between">
                  <View className="h-10 w-10 items-center justify-center rounded-field bg-brand/10">
                    <Ionicons name={feature.icon} size={19} color={GUEST_COLORS.brand} />
                  </View>
                  <View className="rounded-full bg-bronze/10 px-3 py-1">
                    <Text className="font-bevi-bold uppercase tracking-[1px] text-bronze" size="xs">
                      {t(`auth:intro.features.${feature.key}.badge`)}
                    </Text>
                  </View>
                </View>
                <Text className="mb-1 font-bevi-bold text-on-surface" size="sm">
                  {t(`auth:intro.features.${feature.key}.title`)}
                </Text>
                <Text className="font-bevi leading-[18px] text-on-surface-variant" size="xs">
                  {t(`auth:intro.features.${feature.key}.description`)}
                </Text>
              </View>
            ))}
          </View>

          <View className="mx-6 mt-3 items-center overflow-hidden rounded-card">
            <Image source={AUTH_IMAGES.verifyOtp} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
            <LinearGradient colors={['rgba(28,27,27,0.78)', 'rgba(28,27,27,0.92)']} style={StyleSheet.absoluteFill} />
            <View className="w-full items-center p-6">
              <Ionicons name="people-outline" size={30} color={GUEST_COLORS.premiumGold} />
              <Heading className="mb-1 mt-2 font-bevi-bold text-white" size="lg">
                {t('auth:intro.joinTitle')}
              </Heading>
              <Text className="mb-6 text-center font-bevi leading-5 text-white/80" size="sm">
                {t('auth:intro.joinSubtitle')}
              </Text>

              {/* Nền sáng trên nền ảnh tối → dùng variant outline nhưng ép nền surface. */}
              <LuxButton
                label={t('auth:intro.getStarted')}
                variant="outline"
                onPress={() => router.push('/(auth)/register')}
                className="w-full border-transparent bg-surface"
              />
              <Pressable
                onPress={() => router.push('/(auth)/login')}
                className="mt-3 min-h-14 w-full items-center justify-center rounded-full border border-white/35"
              >
                <Text className="font-bevi-bold uppercase tracking-[1.5px] text-white" size="sm">
                  {t('auth:login.submit')}
                </Text>
              </Pressable>
            </View>
          </View>

          <View className="mt-6 items-center">
            <PageDots current={1} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
