import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Button, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { Input, InputField } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useSearchHotels } from '@/hooks/hotels';
import { useSearchStore } from '@/stores/search-store';
export default function SearchScreen() {
  const [city, setCity] = useState('');
  const [query, setQuery] = useState('');
  const history = useSearchStore(s => s.history);
  const add = useSearchStore(s => s.add);
  const clear = useSearchStore(s => s.clear);
  const { data, isLoading, isFetching } = useSearchHotels({
    city: query || undefined,
    limit: 20,
  });
  const search = () => {
    const next = city.trim();
    setQuery(next);
    if (next) add(next);
  };
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      className="flex-1 bg-background-50"
    >
      <View className="px-5 py-6 gap-5">
        <Heading size="2xl">Find a room</Heading>
        <View className="gap-3">
          <Input>
            <InputField
              placeholder="Enter a city, e.g. Da Nang"
              value={city}
              onChangeText={setCity}
              onSubmitEditing={search}
            />
          </Input>
          <Button onPress={search}>
            <ButtonText>{isFetching ? 'Searching...' : 'Search'}</ButtonText>
          </Button>
        </View>
        {history.length > 0 ? (
          <View className="gap-2">
            <View className="flex-row justify-between">
              <Text bold>Recent searches</Text>
              <Pressable onPress={clear}>
                <Text className="text-primary-600">Clear</Text>
              </Pressable>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {history.map(item => (
                <Pressable
                  key={item}
                  onPress={() => {
                    setCity(item);
                    setQuery(item);
                  }}
                  className="rounded-full bg-primary-50 px-3 py-2"
                >
                  <Text className="text-primary-700">{item}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
        <Heading size="lg">Results</Heading>
        {isLoading ? <Text>Loading stays...</Text> : null}
        {data?.results.length === 0 ? (
          <Text className="text-typography-600">
            No matching stays found.
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
                : 'Contact us for rates'}
            </Text>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}


