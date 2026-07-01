import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';

export default function StaffInboxScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="flex-1 px-4 pt-4">
        <Heading size="xl" className="text-navy">Inbox</Heading>
        <Text className="text-gray-500 mt-1">
          Theo dõi hội thoại AI, tiếp quản chat & xử lý khiếu nại của khách. (TODO)
        </Text>
      </View>
    </SafeAreaView>
  );
}
