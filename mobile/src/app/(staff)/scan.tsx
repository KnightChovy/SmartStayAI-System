import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Input, InputField } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { StaffButton, StaffEmptyState } from '@/components/staff';
import { useLookupBooking, useStaffHotelId } from '@/hooks/staff';

/**
 * QR e-voucher mã hoá dạng `SMARTSTAY|<voucherCode>|<bookingCode>` (xem
 * `BookingVoucher.qrData` ở backend). Tách lấy voucherCode; nếu không đúng
 * định dạng thì coi nguyên chuỗi quét được là voucherCode (mã cũ/ảnh ngoài).
 */
function extractVoucherCode(scanned: string): string {
  const parts = scanned.trim().split('|');
  if (parts.length === 3 && parts[0] === 'SMARTSTAY') return parts[1];
  return scanned.trim();
}

export default function StaffScanScreen() {
  const router = useRouter();
  const hotelId = useStaffHotelId();
  const lookup = useLookupBooking(hotelId ?? '');
  const [code, setCode] = useState('');
  const [permission, requestPermission] = useCameraPermissions();
  const [scanLocked, setScanLocked] = useState(false);

  function runLookup(voucher: string, onDone: () => void) {
    lookup.mutate(voucher, {
      onSuccess: (booking) => {
        setCode('');
        onDone();
        router.push({
          pathname: '/(staff)/bookings/[id]',
          params: { id: booking.id },
        });
      },
      onError: () => {
        Alert.alert('Không tìm thấy', 'Mã voucher không khớp booking nào của khách sạn.', [
          { text: 'OK', onPress: onDone },
        ]);
      },
    });
  }

  function handleLookup() {
    const voucher = code.trim();
    if (!voucher) return;
    runLookup(voucher, () => {});
  }

  function handleBarcodeScanned(result: BarcodeScanningResult) {
    if (scanLocked || lookup.isPending) return;
    setScanLocked(true);
    runLookup(extractVoucherCode(result.data), () => setScanLocked(false));
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

        {/* Camera quét QR */}
        <View className="mt-8 aspect-square rounded-3xl overflow-hidden border-2 border-white/30">
          {!permission ? (
            <View className="flex-1 items-center justify-center bg-staff-700">
              <Spinner color="#FFFFFF" />
            </View>
          ) : !permission.granted ? (
            <Pressable
              onPress={requestPermission}
              className="flex-1 items-center justify-center bg-staff-700 px-6"
            >
              <Ionicons name="camera-outline" size={56} color="rgba(255,255,255,0.7)" />
              <Text size="sm" bold className="text-white mt-3 text-center">
                Cho phép dùng camera để quét QR
              </Text>
              <Text size="xs" className="text-staff-100 mt-1 text-center">
                Chạm để cấp quyền
              </Text>
            </Pressable>
          ) : (
            <View className="flex-1">
              <CameraView
                className="flex-1"
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={handleBarcodeScanned}
              />
              {(scanLocked || lookup.isPending) && (
                <View className="absolute inset-0 items-center justify-center bg-black/40">
                  <Spinner color="#FFFFFF" size="large" />
                </View>
              )}
            </View>
          )}
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
