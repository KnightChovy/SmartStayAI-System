import { Alert, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { StaffScreenHeader, StaffButton } from '@/components/staff';
import { useStaffHotelId } from '@/hooks/staff';
import { useAuthStore } from '@/stores/authStore';

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-center gap-3 py-3 border-b border-gray-50">
      <View className="h-9 w-9 rounded-full bg-staff-50 items-center justify-center">
        <Ionicons name={icon} size={16} color="#0F766E" />
      </View>
      <Text size="sm" className="text-gray-400 flex-1">
        {label}
      </Text>
      <Text
        size="sm"
        bold
        className="text-gray-800 max-w-[55%]"
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

export default function StaffProfileScreen() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const hotelId = useStaffHotelId();

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
    <View className="flex-1 bg-gray-50">
      <StaffScreenHeader title="Tài khoản" />

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Thẻ nhân viên */}
        <View className="bg-white rounded-2xl p-5 border border-gray-100 items-center">
          <View className="h-20 w-20 rounded-full bg-staff-700 items-center justify-center">
            <Text bold className="text-white text-2xl">
              {(user?.fullName ?? 'S').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text bold className="text-gray-900 text-lg mt-3">
            {user?.fullName ?? 'Nhân viên'}
          </Text>
          <View className="bg-staff-100 rounded-full px-3 py-1 mt-1.5">
            <Text size="xs" bold className="text-staff-800">
              Nhân viên khách sạn
            </Text>
          </View>
        </View>

        {/* Thông tin */}
        <View className="bg-white rounded-2xl px-4 py-1 border border-gray-100">
          <Row icon="mail-outline" label="Email" value={user?.email ?? '—'} />
          <Row
            icon="call-outline"
            label="Số điện thoại"
            value={user?.phone ?? '—'}
          />
          <Row
            icon="business-outline"
            label="Khách sạn"
            value={hotelId ? hotelId : 'Chưa gán'}
          />
        </View>

        <StaffButton
          label="Đăng xuất"
          variant="danger"
          icon="log-out-outline"
          onPress={handleLogout}
        />
      </ScrollView>
    </View>
  );
}
