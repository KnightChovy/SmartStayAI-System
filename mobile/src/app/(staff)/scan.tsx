import { useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from 'expo-camera';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { StaffButton, StaffEmptyState } from '@/components/staff';
import { STAFF_GRADIENT } from '@/constants/staffTheme';
import { useLookupBooking, useStaffHotelId } from '@/hooks/staff';

/**
 * Extract the voucher code from QR content.
 * Backend QR is `SMARTSTAY|<voucherCode>|<bookingCode>` → take the middle segment;
 * a bare voucher code is used as-is.
 */
function parseVoucherCode(raw: string): string {
  const value = raw.trim();
  if (value.startsWith('SMARTSTAY|')) {
    const parts = value.split('|');
    return parts[1]?.trim() ?? value;
  }
  return value;
}

export default function StaffScanScreen() {
  const router = useRouter();
  const hotelId = useStaffHotelId();
  const lookup = useLookupBooking(hotelId ?? '');
  const [permission, requestPermission] = useCameraPermissions();
  const [code, setCode] = useState('');
  const handlingRef = useRef(false);

  function doLookup(voucher: string) {
    const value = voucher.trim();
    if (!value) return;
    lookup.mutate(value, {
      onSuccess: (booking) => {
        setCode('');
        router.push({
          pathname: '/(staff)/bookings/[id]',
          params: { id: booking.id },
        });
      },
      onError: () => {
        handlingRef.current = false;
        Alert.alert('Not found', 'No booking at this hotel matches that voucher code.');
      },
    });
  }

  function handleScanned(result: BarcodeScanningResult) {
    if (handlingRef.current || lookup.isPending) return;
    handlingRef.current = true;
    doLookup(parseVoucherCode(result.data));
  }

  if (!hotelId) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <StaffEmptyState
          icon="business-outline"
          title="No hotel assigned"
          subtitle="You can't look up bookings until the account is linked to a hotel."
        />
      </SafeAreaView>
    );
  }

  const granted = permission?.granted ?? false;

  return (
    <LinearGradient colors={STAFF_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
        >
          <Heading size="2xl" className="text-white">
            Check-in
          </Heading>
          <Text className="text-teal-50/90 mt-1">
            Scan the guest QR or enter the e-voucher code to pull up their booking.
          </Text>

          {/* Camera / QR scanner — khung vuông nhỏ, căn giữa */}
          <View className="mt-8 items-center">
            <View
              style={{ width: 260, height: 260 }}
              className="overflow-hidden rounded-[28px] border-2 border-white/80 bg-black/25"
            >
              {granted ? (
                <CameraView
                  style={StyleSheet.absoluteFill}
                  facing="back"
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                  onBarcodeScanned={lookup.isPending ? undefined : handleScanned}
                />
              ) : (
                <View className="flex-1 items-center justify-center px-4">
                  <Ionicons name="camera-outline" size={52} color="rgba(255,255,255,0.7)" />
                  <Text size="xs" className="text-teal-50 text-center mt-2 leading-4">
                    {permission && !permission.canAskAgain
                      ? 'Camera is blocked. Enable it in Settings.'
                      : 'Camera access is needed to scan QR codes.'}
                  </Text>
                  {(!permission || permission.canAskAgain) && (
                    <StaffButton
                      label="Allow camera"
                      icon="camera-outline"
                      variant="outline"
                      size="sm"
                      onPress={requestPermission}
                      className="mt-3 px-6"
                    />
                  )}
                </View>
              )}
            </View>
            <Text size="sm" className="text-white/90 mt-3">
              Point the QR into the frame
            </Text>
          </View>

          {/* Manual entry */}
          <View className="mt-7 bg-white rounded-3xl p-4">
            <Text bold className="text-gray-900 mb-2">
              Enter voucher code
            </Text>
            <TextInput
              autoCapitalize="characters"
              placeholder="e.g. VC1A2B3C"
              placeholderTextColor="#9CA3AF"
              value={code}
              onChangeText={setCode}
              onSubmitEditing={() => doLookup(code)}
              returnKeyType="search"
              className="border border-gray-200 rounded-xl px-3.5 h-11 text-gray-900 text-base"
            />
            <StaffButton
              label="Look up booking"
              icon="search-outline"
              loading={lookup.isPending}
              disabled={!code.trim()}
              onPress={() => doLookup(code)}
              className="mt-3"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
