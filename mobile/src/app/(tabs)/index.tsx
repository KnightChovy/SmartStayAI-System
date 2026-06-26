import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { Card } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { useSearchHotels } from '@/hooks/hotels';
export default function HomeScreen() {
  const { data, isLoading, isError } = useSearchHotels({ limit: 6 });
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      className="flex-1 bg-background-50"
    >
      <View className="px-5 py-6 gap-6">
        <View className="gap-2">
          <Text className="text-primary-600 font-semibold">SMARTSTAY AI</Text>
          <Heading size="2xl">Where would you like to go?</Heading>
          <Text className="text-typography-600">
            Discover standout destinations across Vietnam.
          </Text>
        </View>
        <Card className="bg-primary-600 border-primary-600 gap-3">
          <Text className="text-white text-lg" bold>
            Weekend getaway offers
          </Text>
          <Text className="text-primary-100">
            Find a stay that fits in seconds.
          </Text>
          <Button
            variant="secondary"
            onPress={() => router.push('/search' as never)}
          >
            <ButtonText>Find a room</ButtonText>
          </Button>
        </Card>
        <Heading size="lg">Recommended destinations</Heading>
        {isLoading ? <Text>Loading destinations...</Text> : null}
        {isError ? (
          <Text className="text-error-600">
            Unable to load hotels.
          </Text>
        ) : null}
        {data?.results.map(h => (
          <Card key={h.id} className="gap-2">
            <Text bold>{h.name}</Text>
            <Text className="text-typography-600">
              {h.city} · {h.address}
            </Text>
            <Text className="text-primary-600" bold>
              {h.minPrice
                ? `From ${Number(h.minPrice).toLocaleString('en-US')} VND/night`
                : 'View room rates'}
            </Text>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}


