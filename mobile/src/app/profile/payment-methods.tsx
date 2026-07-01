import { View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';

const NAVY = '#0B1D45';

/**
 * Chưa có backend cho "saved payment methods" (không có model/endpoint nào,
 * cả server lẫn web đều chưa có). Thanh toán hiện đi qua VNPay ngay lúc
 * checkout (`useCreateVnpayPayment`), không lưu thẻ/ví — nên trang này chỉ
 * giải thích rõ thay vì bịa dữ liệu thẻ giả.
 */
export default function PaymentMethodsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-navy" edges={['top']}>
      <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 bg-white border-b border-gray-100">
        <Pressable onPress={() => router.back()} hitSlop={8} className="w-9 h-9 items-center justify-center">
          <Ionicons name="arrow-back" size={22} color={NAVY} />
        </Pressable>
        <Heading size="lg" className="text-navy">Payment Methods</Heading>
      </View>

      <View className="flex-1 bg-gray-100 items-center justify-center gap-3 px-8">
        <View className="w-16 h-16 rounded-full bg-white items-center justify-center">
          <Ionicons name="card-outline" size={32} color="#D1D5DB" />
        </View>
        <Text bold className="text-navy text-base text-center">No saved payment methods</Text>
        <Text size="sm" className="text-gray-400 text-center">
          SmartStay doesn't store your card yet. You'll pay securely through VNPay each time you confirm a
          booking.
        </Text>
      </View>
    </SafeAreaView>
  );
}
