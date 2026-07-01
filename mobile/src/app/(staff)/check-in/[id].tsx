import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';

/** Màn gán phòng sau khi quét mã booking. */
export default function StaffCheckInScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="flex-1 px-4 pt-4">
        <Heading size="lg" className="text-navy">Check-in #{id}</Heading>
        <Text className="text-gray-500 mt-1">Gán phòng cho booking. (TODO)</Text>
      </View>
    </SafeAreaView>
  );
}
