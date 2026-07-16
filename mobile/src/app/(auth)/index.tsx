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
import { LanguageSwitcher, LuxButton } from '@/components/guest';
import { AUTH_IMAGES, GUEST_COLORS } from '@/constants/guestTheme';

/** Bóng chữ giữ chữ trắng đọc được trên ảnh sáng. */
const TEXT_ON_IMAGE = {
  textShadowColor: 'rgba(0,0,0,0.45)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 8,
} as const;

/** Trang 1/2 của onboarding — trang 2 là `(auth)/features`. */
export default function IntroScreen() {
  const router = useRouter();
  const { t } = useTranslation(['auth', 'common']);

  return (
    <View className="flex-1 bg-canvas">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ height: 400 }}>
          <Image source={AUTH_IMAGES.register} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
          <LinearGradient
            colors={['rgba(28,27,27,0.7)', 'rgba(28,27,27,0.35)', 'rgba(28,27,27,0.9)']}
            locations={[0, 0.4, 1]}
            style={StyleSheet.absoluteFill}
          />
          <SafeAreaView edges={['top']} className="flex-1 justify-between px-6 pb-14 pt-4">
            <View className="flex-row items-center justify-between">
              <Text className="font-bevi-extrabold uppercase tracking-[3px] text-white" size="lg" style={TEXT_ON_IMAGE}>
                {t('common:appName')}
              </Text>
              <View className="flex-row items-center gap-3">
                <LanguageSwitcher tone="light" />
                <Pressable onPress={() => router.push('/(auth)/login')} hitSlop={8} className="py-1">
                <Text className="font-bevi-semibold text-white/90" size="sm" style={TEXT_ON_IMAGE}>
                  {t('common:skip')}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View>
              <Text
                className="mb-2 font-bevi-bold uppercase tracking-[2px] text-premium-gold"
                size="xs"
                style={TEXT_ON_IMAGE}
              >
                {t('auth:intro.welcomeTo')}
              </Text>
              <Heading className="font-bevi-bold text-white" size="4xl" style={TEXT_ON_IMAGE}>
                {t('auth:intro.title')}
              </Heading>
              <Text className="mt-3 font-bevi text-white/85" size="md" style={TEXT_ON_IMAGE}>
                {t('auth:intro.subtitle')}
              </Text>
            </View>
          </SafeAreaView>
        </View>

        <View className="flex-1 rounded-t-sheet bg-surface px-6 pt-7" style={{ marginTop: -32 }}>
          <View className="rounded-card border border-hairline/30 bg-surface-low p-5">
            <View className="mb-3 flex-row items-center gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-field bg-bronze/15">
                <Ionicons name="rocket-outline" size={20} color={GUEST_COLORS.bronze} />
              </View>
              <Heading className="font-bevi-bold text-on-surface" size="lg">
                {t('auth:intro.missionTitle')}
              </Heading>
            </View>
            <Text className="font-bevi leading-[22px] text-on-surface-variant" size="sm">
              {t('auth:intro.missionBody')}
            </Text>
          </View>

          <View className="absolute bottom-8 left-0 right-0 ml-10 mr-10 flex-row items-center justify-between">
            <PageDots current={0} />
            <LuxButton
              label={t('common:next')}
              icon="arrow-forward"
              onPress={() => router.push('/(auth)/features')}
              className="px-7"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
