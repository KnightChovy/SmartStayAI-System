import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/staff/Card';
import { BookingStatusBadge } from '@/components/shared/BookingStatusBadge';
import { formatVnd } from '@/utils/formatCurrency';
import { formatDateShort } from '@/utils/formatDate';
import type { StaffBooking } from '@/types/staff.type';

export interface StaffBookingCardProps {
  booking: StaffBooking;
  onPress?: () => void;
}

/** Booking list card for staff operations — guest + stay + assigned rooms + total. */
export function StaffBookingCard({ booking, onPress }: StaffBookingCardProps) {
  const name = booking.customer?.fullName ?? 'Guest';
  const initial = name.charAt(0).toUpperCase();
  const rooms = booking.bookingRooms
    ?.map((br) => br.room?.roomNumber)
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable onPress={onPress} className="active:opacity-90">
      <Card className="p-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3 flex-1 pr-2">
            <View className="h-11 w-11 rounded-2xl bg-staff-50 items-center justify-center">
              <Text bold className="text-staff-700 text-base">
                {initial}
              </Text>
            </View>
            <View className="flex-1">
              <Text bold className="text-gray-900 text-base" numberOfLines={1}>
                {name}
              </Text>
              <Text size="xs" className="text-gray-400 mt-0.5">
                #{booking.bookingCode}
              </Text>
            </View>
          </View>
          <BookingStatusBadge status={booking.status} />
        </View>

        <View className="h-px bg-gray-100 my-3" />

        <View className="flex-row items-center gap-1.5 mb-2">
          <Ionicons name="bed-outline" size={15} color="#0F766E" />
          <Text size="sm" className="text-gray-600 flex-1" numberOfLines={1}>
            {booking.roomType?.name ?? 'Room'}
            {rooms ? ` · Room ${rooms}` : ''}
          </Text>
        </View>

        <View className="flex-row items-center gap-1.5">
          <Ionicons name="calendar-outline" size={15} color="#0F766E" />
          <Text size="sm" className="text-gray-600">
            {formatDateShort(booking.checkInDate)} →{' '}
            {formatDateShort(booking.checkOutDate)}
            {'  ·  '}
            {booking.numNights} night{booking.numNights > 1 ? 's' : ''}
          </Text>
        </View>

        <View className="flex-row items-center justify-between mt-3">
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="people-outline" size={15} color="#9CA3AF" />
            <Text size="xs" className="text-gray-400">
              {booking.numGuests} guest{booking.numGuests > 1 ? 's' : ''}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Text bold className="text-staff-700 text-base">
              {formatVnd(booking.totalAmount)}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </View>
        </View>
      </Card>
    </Pressable>
  );
}
