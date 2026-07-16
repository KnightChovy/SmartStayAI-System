import { View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { GUEST_COLORS } from '@/constants/guestTheme';


/**
 * Chưa có backend cho "saved payment methods" (không có model/endpoint nào,
 * cả server lẫn web đều chưa có). Thanh toán hiện đi qua VNPay ngay lúc
 * checkout (`useCreateVnpayPayment`), không lưu thẻ/ví — nên trang này chỉ
 * giải thích rõ thay vì bịa dữ liệu thẻ giả.
 */
export default function PaymentMethodsScreen() {
  const router = useRouter();
  const { t } = useTranslation(['account', 'common']);

  return (
    <SafeAreaView className="flex-1 bg-on-surface" edges={['top']}>
      <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 bg-surface border-b border-hairline/30">
        <Pressable onPress={() => router.back()} hitSlop={8} className="w-9 h-9 items-center justify-center">
          <Ionicons name="arrow-back" size={22} color={GUEST_COLORS.onSurface} />
        </Pressable>
        <Heading size="lg" className="font-bevi-bold text-on-surface">{t('account:paymentMethods.title')}</Heading>
      </View>

      <View className="flex-1 bg-canvas items-center justify-center gap-3 px-8">
        <View className="w-16 h-16 rounded-full bg-surface items-center justify-center">
          <Ionicons name="card-outline" size={32} color={GUEST_COLORS.hairline} />
        </View>
        <Text bold className="font-bevi-bold text-on-surface text-base text-center">{t('account:paymentMethods.empty')}</Text>
        <Text size="sm" className="font-bevi text-muted text-center">
          {t('account:paymentMethods.emptyBody')}
        </Text>
      </View>
    </SafeAreaView>
  );
}
