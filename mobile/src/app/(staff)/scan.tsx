import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';

/**
 * Check-in / Check-out bằng quét mã.
 * TODO: tích hợp camera (`npx expo install expo-camera`) → quét QR booking,
 * đọc trạng thái: confirmed → check-in (gán phòng); checked_in → check-out.
 */
export default function StaffScanScreen() {
  return (
    <SafeAreaView className="flex-1 bg-navy" edges={['top']}>
      <View className="flex-1 items-center justify-center px-6">
        <Heading size="xl" className="text-white">Check-in / Check-out</Heading>
        <Text className="text-blue-200 text-center mt-2">
          Quét mã QR booking để gán phòng / trả phòng. (TODO: camera scanner)
        </Text>
      </View>
    </SafeAreaView>
  );
}
