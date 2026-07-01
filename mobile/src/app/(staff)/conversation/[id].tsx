import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';

/** Mở một hội thoại để theo dõi / tiếp quản từ AI. */
export default function StaffConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="flex-1 px-4 pt-4">
        <Heading size="lg" className="text-navy">Conversation #{id}</Heading>
        <Text className="text-gray-500 mt-1">Theo dõi & tiếp quản chat. (TODO)</Text>
      </View>
    </SafeAreaView>
  );
}
