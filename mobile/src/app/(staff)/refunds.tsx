import { View } from 'react-native';
import { StaffScreenHeader, StaffEmptyState } from '@/components/staff';

/**
 * Hoàn tiền — backend hiện CHƯA có API riêng cho staff (Refund chỉ sinh tự động khi
 * huỷ booking). Màn giữ chỗ tới khi có endpoint list/duyệt hoàn tiền.
 */
export default function StaffRefundsScreen() {
  return (
    <View className="flex-1 bg-gray-50">
      <StaffScreenHeader title="Hoàn tiền" subtitle="Xử lý yêu cầu hoàn tiền" />
      <StaffEmptyState
        icon="cash-outline"
        tone="brand"
        title="Sắp ra mắt"
        subtitle="Chức năng duyệt hoàn tiền đang chờ API từ backend. Hiện hoàn tiền được xử lý tự động theo chính sách khi huỷ booking."
      />
    </View>
  );
}
