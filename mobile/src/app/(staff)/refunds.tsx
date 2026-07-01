import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';

export default function StaffRefundsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="flex-1 px-4 pt-4">
        <Heading size="xl" className="text-navy">Refunds</Heading>
        <Text className="text-gray-500 mt-1">
          Xử lý hoàn tiền: kiểm tra chính sách & duyệt yêu cầu. (TODO)
        </Text>
      </View>
    </SafeAreaView>
  );
}
