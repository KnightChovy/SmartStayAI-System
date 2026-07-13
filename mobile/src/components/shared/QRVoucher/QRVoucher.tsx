import { View } from 'react-native';
import { Image } from 'expo-image';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';

interface QRVoucherProps {
  /** Dữ liệu mã hóa vào QR — phải là `booking.voucher.qrData` (staff quét theo voucherCode). */
  data: string;
  label?: string;
  size?: number;
  className?: string;
}

/**
 * Hiển thị mã QR check-in cho booking. Dùng chung dịch vụ ảnh QR công khai
 * như bên web (`QRVoucher` client) để không cần thư viện QR native.
 */
export function QRVoucher({ data, label, size = 160, className }: QRVoucherProps) {
  const uri = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;

  return (
    <View className={cn('items-center gap-2', className)}>
      <View className="rounded-2xl border border-gray-200 bg-white p-3">
        <Image source={{ uri }} style={{ width: size, height: size }} contentFit="contain" />
      </View>
      {label ? (
        <Text size="xs" bold className="text-gray-500 tracking-wider">
          {label}
        </Text>
      ) : null}
    </View>
  );
}
