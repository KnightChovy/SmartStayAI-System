import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';

/** Chi tiết booking cho staff: confirm / check-out / xem để xử lý khiếu nại. */
export default function StaffBookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="flex-1 px-4 pt-4">
        <Heading size="lg" className="text-navy">Booking #{id}</Heading>
        <Text className="text-gray-500 mt-1">Chi tiết & thao tác booking. (TODO)</Text>
      </View>
    </SafeAreaView>
  );
}
