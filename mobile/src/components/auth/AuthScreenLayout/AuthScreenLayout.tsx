import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { LanguageSwitcher } from '@/components/guest/LanguageSwitcher';
import { GUEST_COLORS } from '@/constants/guestTheme';

/**
 * Bóng chữ cho text trắng nằm trên ảnh. Gradient lo phần lớn, nhưng ảnh do khách sạn
 * upload thì không kiểm soát được độ sáng — bóng chữ giữ chữ luôn đọc được.
 */
const TEXT_ON_IMAGE = {
  textShadowColor: 'rgba(0,0,0,0.45)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 8,
} as const;

interface AuthScreenLayoutProps {
  /** Ảnh khách sạn nền hero (xem `AUTH_IMAGES`). */
  image: string;
  /** Câu dẫn chữ trắng đè trên ảnh — vai trò như tagline panel ảnh bên client. */
  tagline: string;
  children: ReactNode;
  /** Hiện mũi tên quay lại ở góc trên ảnh. */
  onBack?: () => void;
  /** Chiều cao ảnh hero. Màn nhiều ô nhập (đăng ký) nên để thấp hơn. */
  heroHeight?: number;
}

/**
 * Khung dùng chung cho các màn auth: ảnh khách sạn ở trên, form nằm trong sheet bo
 * góc đè lên ảnh.
 *
 * Vì sao không bê thẳng client: client dùng panel ảnh 50/50 nhưng panel đó `hidden`
 * dưới breakpoint md — tức trên điện thoại web KHÔNG có ảnh nào. Nên bố cục này là
 * bản dịch cho mobile: giữ nguyên các thành phần của panel (ảnh KS, phủ tối dần,
 * logo chữ trắng, tagline) nhưng xếp dọc để còn chỗ cho bàn phím.
 */
export function AuthScreenLayout({ image, tagline, children, onBack, heroHeight = 300 }: AuthScreenLayoutProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('common');

  return (
    <View className="flex-1 bg-canvas">
      {/* Ảnh sáng nên chữ/status bar phải là trắng mới đọc được. */}
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View style={{ height: heroHeight }}>
            <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
            {/*
              Ảnh khách sạn thường sáng (hồ bơi, tường trắng) nên chữ trắng dễ chìm.
              Phủ đậm ở HAI đầu — nơi thật sự có chữ — và nhạt ở giữa để vẫn thấy ảnh.
              Kèm bóng chữ bên dưới làm lớp bảo hiểm cho những ảnh sáng bất thường.
            */}
            <LinearGradient
              colors={['rgba(28,27,27,0.75)', 'rgba(28,27,27,0.35)', 'rgba(28,27,27,0.9)']}
              locations={[0, 0.45, 1]}
              style={StyleSheet.absoluteFill}
            />

            <View className="flex-1 justify-between px-6" style={{ paddingTop: insets.top + 12, paddingBottom: 44 }}>
              <View className="flex-row items-center justify-between">
                {onBack ? (
                  <Pressable
                    onPress={onBack}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={t('back')}
                    className="h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/15"
                  >
                    <Ionicons name="arrow-back" size={20} color={GUEST_COLORS.white} />
                  </Pressable>
                ) : (
                  <Text
                    className="font-bevi-extrabold uppercase tracking-[3px] text-white"
                    size="lg"
                    style={TEXT_ON_IMAGE}
                  >
                    {t('appName')}
                  </Text>
                )}
                {/* Đổi ngôn ngữ ngay ở màn đăng nhập: khách chưa vào được app thì
                    không có chỗ nào khác để đổi. */}
                <LanguageSwitcher tone="light" />
              </View>

              <Text className="font-bevi-semibold text-white" size="2xl" style={TEXT_ON_IMAGE}>
                {tagline}
              </Text>
            </View>
          </View>

          {/* Sheet đè lên ảnh 32px — mép bo lộ ra một dải ảnh, giống cách client cho
              thẻ nổi trên nền ấm. */}
          <View
            className="flex-1 rounded-t-sheet bg-surface px-6 pt-7"
            style={{ marginTop: -32, paddingBottom: insets.bottom + 28 }}
          >
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
