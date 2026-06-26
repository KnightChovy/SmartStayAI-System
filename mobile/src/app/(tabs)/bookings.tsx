import { ScrollView, View } from 'react-native';
import { Card } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { useMyBookings } from '@/hooks/bookings';
const labels = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  checked_in: 'Currently staying',
  checked_out: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No-show',
};
export default function BookingsScreen() {
  const { data, isLoading, isError } = useMyBookings();
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      className="flex-1 bg-background-50"
    >
      <View className="px-5 py-6 gap-5">
        <Heading size="2xl">Your bookings</Heading>
        {isLoading ? <Text>Loading bookings...</Text> : null}
        {isError ? (
          <Text className="text-error-600">
            Please sign in to view your bookings.
          </Text>
        ) : null}
        {data?.results.length === 0 ? (
          <Card>
            <Text bold>No bookings yet</Text>
            <Text className="text-typography-600">
              Your trip history will appear here after you make a reservation.
            </Text>
          </Card>
        ) : null}
        {data?.results.map(b => (
          <Card key={b.id} className="gap-2">
            <View className="flex-row justify-between gap-3">
              <Text bold>{b.hotel?.name ?? 'Hotel'}</Text>
              <Text className="text-primary-600" bold>
                {labels[b.status]}
              </Text>
            </View>
            <Text className="text-typography-600">
              {b.roomType?.name ?? 'Room'} ·{' '}
              {new Date(b.checkInDate).toLocaleDateString('en-US')} —{' '}
              {new Date(b.checkOutDate).toLocaleDateString('en-US')}
            </Text>
            <Text className="text-typography-600">Code: {b.bookingCode}</Text>
            <Text bold>{Number(b.totalAmount).toLocaleString('en-US')} VND</Text>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}


