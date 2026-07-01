import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';

export default function StaffBookingsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="flex-1 px-4 pt-4">
        <Heading size="xl" className="text-navy">Bookings</Heading>
        <Text className="text-gray-500 mt-1">
          Xác nhận & xem thông tin đặt phòng. (TODO: danh sách booking)
        </Text>
      </View>
    </SafeAreaView>
  );
}
