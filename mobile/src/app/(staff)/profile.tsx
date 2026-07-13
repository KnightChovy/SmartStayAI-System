import { Alert, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { StaffScreenHeader, StaffButton, Card } from '@/components/staff';
import { useMyStaffHotels, useStaffHotelId } from '@/hooks/staff';
import { useAuthStore } from '@/stores/authStore';

/** One account info row. */
function Row({
  icon,
  label,
  value,
  last,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center gap-3 py-3.5 ${last ? '' : 'border-b border-gray-100'}`}
    >
      <View className="h-9 w-9 rounded-xl bg-staff-50 items-center justify-center">
        <Ionicons name={icon} size={16} color="#0F766E" />
      </View>
      <Text size="sm" className="text-gray-400 flex-1">
        {label}
      </Text>
      <Text size="sm" bold className="text-gray-800 max-w-[55%] text-right" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export default function StaffProfileScreen() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const hotelId = useStaffHotelId();
  const { data: hotels } = useMyStaffHotels(!!user);

  const hotelName =
    hotels?.find((h) => h.id === hotelId)?.name ?? (hotelId ? hotelId : 'Not assigned');

  function handleLogout() {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
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
      <StaffScreenHeader title="Account" />

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Staff card */}
        <Card className="p-6 items-center">
          <View className="h-20 w-20 rounded-3xl bg-staff-700 items-center justify-center">
            <Text bold className="text-white text-3xl">
              {(user?.fullName ?? 'S').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text bold className="text-gray-900 text-xl mt-4">
            {user?.fullName ?? 'Staff'}
          </Text>
          <View className="flex-row items-center gap-1.5 bg-staff-50 rounded-full px-3 py-1 mt-2">
            <Ionicons name="shield-checkmark" size={13} color="#0F766E" />
            <Text size="xs" bold className="text-staff-800">
              Hotel staff
            </Text>
          </View>
        </Card>

        {/* Details */}
        <Card className="px-4 py-1">
          <Row icon="mail-outline" label="Email" value={user?.email ?? '—'} />
          <Row icon="call-outline" label="Phone" value={user?.phone ?? '—'} />
          <Row icon="business-outline" label="Hotel" value={hotelName} last />
        </Card>

        <StaffButton
          label="Log out"
          variant="danger"
          icon="log-out-outline"
          onPress={handleLogout}
        />
      </ScrollView>
    </View>
  );
}
