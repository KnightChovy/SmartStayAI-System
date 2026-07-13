import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import { BookingStatusBadge } from '@/components/shared/BookingStatusBadge';
import { formatVnd } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import type { StaffBooking } from '@/types/staff.type';

export interface StaffBookingCardProps {
  booking: StaffBooking;
  onPress?: () => void;
}

/** Thẻ booking cho danh sách vận hành staff — khách + kỳ ở + phòng đã gán + tổng tiền. */
export function StaffBookingCard({ booking, onPress }: StaffBookingCardProps) {
  const rooms = booking.bookingRooms
    ?.map((br) => br.room?.roomNumber)
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-2xl p-4 border border-gray-100 active:bg-gray-50"
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1 pr-2">
          <Text bold className="text-gray-900 text-base" numberOfLines={1}>
            {booking.customer?.fullName ?? 'Khách'}
          </Text>
          <Text size="xs" className="text-gray-400 mt-0.5">
            #{booking.bookingCode}
          </Text>
        </View>
        <BookingStatusBadge status={booking.status} />
      </View>

      <View className="flex-row items-center gap-1.5 mb-1.5">
        <Ionicons name="bed-outline" size={14} color="#6B7280" />
        <Text size="sm" className="text-gray-600" numberOfLines={1}>
          {booking.roomType?.name ?? 'Phòng'}
          {rooms ? ` · Phòng ${rooms}` : ''}
        </Text>
      </View>

      <View className="flex-row items-center gap-1.5 mb-1.5">
        <Ionicons name="calendar-outline" size={14} color="#6B7280" />
        <Text size="sm" className="text-gray-600">
          {formatDate(booking.checkInDate)} → {formatDate(booking.checkOutDate)} ·{' '}
          {booking.numNights} đêm
        </Text>
      </View>

      <View className="flex-row items-center justify-between border-t border-gray-100 pt-3 mt-1.5">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="people-outline" size={14} color="#6B7280" />
          <Text size="sm" className="text-gray-600">
            {booking.numGuests} khách
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Text bold className="text-staff-700 text-base">
            {formatVnd(booking.totalAmount)}
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
        </View>
      </View>
    </Pressable>
  );
}
