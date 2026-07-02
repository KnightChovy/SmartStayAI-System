import { useState } from 'react';
import { Alert, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Input, InputField } from '@/components/ui/input';
import { StaffButton, StaffEmptyState } from '@/components/staff';
import { useLookupBooking, useStaffHotelId } from '@/hooks/staff';

export default function StaffScanScreen() {
  const router = useRouter();
  const hotelId = useStaffHotelId();
  const lookup = useLookupBooking(hotelId ?? '');
  const [code, setCode] = useState('');

  function handleLookup() {
    const voucher = code.trim();
    if (!voucher) return;
    lookup.mutate(voucher, {
      onSuccess: (booking) => {
        setCode('');
        router.push({
          pathname: '/(staff)/bookings/[id]',
          params: { id: booking.id },
        });
      },
      onError: () => {
        Alert.alert('Không tìm thấy', 'Mã voucher không khớp booking nào của khách sạn.');
      },
    });
  }

  if (!hotelId) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <StaffEmptyState
          icon="business-outline"
          title="Chưa gán khách sạn"
          subtitle="Không thể tra cứu khi tài khoản chưa liên kết khách sạn."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-staff-800" edges={['top']}>
      <View className="flex-1 px-6 pt-8">
        <Heading size="2xl" className="text-white">
          Check-in
        </Heading>
        <Text className="text-staff-100 mt-1">
          Quét QR hoặc nhập mã e-voucher để tra booking của khách.
        </Text>

        {/* Vùng camera (placeholder — sẽ tích hợp expo-camera sau) */}
        <View className="mt-8 aspect-square rounded-3xl border-2 border-dashed border-white/30 items-center justify-center">
          <Ionicons name="qr-code-outline" size={72} color="rgba(255,255,255,0.5)" />
          <Text size="sm" className="text-staff-100 mt-3">
            Máy quét QR sẽ hiển thị ở đây
          </Text>
        </View>

        {/* Nhập tay */}
        <View className="mt-8 bg-white rounded-2xl p-4">
          <Text bold className="text-staff-800 mb-2">
            Nhập mã voucher
          </Text>
          <Input>
            <InputField
              autoCapitalize="characters"
              placeholder="VD: EVC-8842-2210"
              value={code}
              onChangeText={setCode}
              onSubmitEditing={handleLookup}
              returnKeyType="search"
            />
          </Input>
          <StaffButton
            label="Tra cứu booking"
            icon="search-outline"
            loading={lookup.isPending}
            disabled={!code.trim()}
            onPress={handleLookup}
            className="mt-3"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
