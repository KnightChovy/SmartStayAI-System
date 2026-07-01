import { Alert, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { useAuthStore } from '@/stores/authStore';

export default function StaffProfileScreen() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  function handleLogout() {
    Alert.alert('Đăng xuất', 'Bạn chắc chắn muốn đăng xuất?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => {
          clearAuth();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="flex-1 px-4 pt-4">
        <Heading size="xl" className="text-navy">Account</Heading>
        <Text className="text-gray-500 mt-1">
          {user?.fullName ?? 'Staff'} · {user?.role}
        </Text>

        <Pressable
          onPress={handleLogout}
          className="mt-6 bg-navy rounded-2xl py-4 items-center"
        >
          <Text bold className="text-white">Đăng xuất</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
