import { useState } from 'react';
import { View, ScrollView, Pressable, FlatList, TextInput, ActivityIndicator, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui/text';
import { StarRating } from '@/components/shared/StarRating';
import { useDebounce } from '@/hooks/ui/use-debounce';
import { useGetHotels } from '@/hooks/hotels';
import { getPrimaryImageUrl, getHotelLocation } from '@/utils/hotel';
import { formatVnd } from '@/utils/formatCurrency';
import type { HotelSearchResult } from '@/types/hotels.type';

interface HotelFilter {
  id: string;
  label: string;
  test: (h: HotelSearchResult) => boolean;
}

/** Bộ lọc lọc trên field có thật từ API (starRating, minPrice). */
const FILTERS: HotelFilter[] = [
  { id: '5star', label: '5 stars', test: (h) => h.starRating === 5 },
  { id: '4plus', label: '4+ stars', test: (h) => (h.starRating ?? 0) >= 4 },
  { id: 'under1m', label: 'Under 1M', test: (h) => h.minPrice != null && Number(h.minPrice) < 1_000_000 },
  { id: 'under3m', label: 'Under 3M', test: (h) => h.minPrice != null && Number(h.minPrice) < 3_000_000 },
  { id: 'hasPrice', label: 'Available now', test: (h) => h.minPrice != null },
];

const SORT_OPTIONS = ['Recommended', 'Lowest price', 'Highest rated'] as const;
type SortOption = typeof SORT_OPTIONS[number];

function sortHotels(list: HotelSearchResult[], sort: SortOption): HotelSearchResult[] {
  const copy = [...list];
  if (sort === 'Lowest price') {
    return copy.sort((a, b) => Number(a.minPrice ?? Infinity) - Number(b.minPrice ?? Infinity));
  }
  if (sort === 'Highest rated') {
    return copy.sort((a, b) => (b.starRating ?? 0) - (a.starRating ?? 0));
  }
  return copy;
}

export default function SearchScreen() {
  const router = useRouter();
  const { city, checkIn, checkOut, guests } = useLocalSearchParams<{
    city?: string; checkIn?: string; checkOut?: string; guests?: string;
  }>();
  const { bottom } = useSafeAreaInsets();
  const [sort, setSort] = useState<SortOption>('Recommended');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 400);

  const { data, isLoading, isError, refetch, isRefetching } = useGetHotels({
    city,
    checkIn,
    checkOut,
    guests: guests ? Number(guests) : undefined,
  });
  const results = data?.results ?? [];

  function toggleFilter(id: string) {
    setActiveFilters((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  }

  const q = debouncedQuery.trim().toLowerCase();
  const activeTests = FILTERS.filter((f) => activeFilters.includes(f.id));
  const filtered = sortHotels(
    results.filter(
      (h) =>
        (q === '' ||
          h.name.toLowerCase().includes(q) ||
          getHotelLocation(h).toLowerCase().includes(q)) &&
        activeTests.every((f) => f.test(h)),
    ),
    sort,
  );

  return (
    <View className="flex-1 bg-gray-100">
      <SafeAreaView edges={['top']} className="bg-navy">
        {/* Search input */}
        <View className="px-4 pt-3 pb-2">
          <View className="flex-row items-center bg-gray-100 rounded-2xl px-3 h-11">
            <Ionicons name="search" size={18} color="#9CA3AF" />
            <TextInput
              className="flex-1 text-sm text-navy ml-2"
              placeholder="Search hotels, destinations..."
              placeholderTextColor="#9CA3AF"
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Filter chips */}
        <View className="px-4 pt-2 pb-1.5">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            <Pressable
              onPress={() => setActiveFilters([])}
              className="flex-row items-center gap-1.5 border border-white/30 rounded-full px-3 py-1.5"
            >
              <Ionicons name="options-outline" size={14} color="#fff" />
              <Text size="sm" bold className="text-white">
                {activeFilters.length > 0 ? `Clear (${activeFilters.length})` : 'Filters'}
              </Text>
            </Pressable>
            {FILTERS.map((f) => {
              const active = activeFilters.includes(f.id);
              return (
                <Pressable
                  key={f.id}
                  onPress={() => toggleFilter(f.id)}
                  className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 ${active ? 'bg-white' : 'bg-white/20'}`}
                >
                  <Text size="sm" bold className={active ? 'text-navy' : 'text-white'}>{f.label}</Text>
                  <Ionicons name={active ? 'checkmark' : 'add'} size={13} color={active ? '#0B1D45' : '#fff'} />
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Sort tabs */}
        <View className="flex-row px-4 gap-2 pb-2.5">
          {SORT_OPTIONS.map((opt) => (
            <Pressable
              key={opt}
              onPress={() => setSort(opt)}
              className={`px-3 py-2 rounded-xl ${sort === opt ? 'bg-white' : 'bg-white/10'}`}
            >
              <Text size="xs" bold className={sort === opt ? 'text-navy' : 'text-white'}>{opt}</Text>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>

      {/* Results */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0B1D45" />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <Ionicons name="cloud-offline-outline" size={48} color="#D1D5DB" />
          <Text className="text-gray-400 text-center">Couldn't load hotels. Please try again.</Text>
          <Pressable onPress={() => refetch()} className="bg-navy rounded-xl px-5 py-2.5">
            <Text bold className="text-white">Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(h) => h.id}
          contentContainerStyle={{ padding: 16, gap: 16 }}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListHeaderComponent={
            <Text size="xs" bold className="text-gray-500 uppercase mb-1">
              {filtered.length} stays in {city ?? 'Vietnam'}
            </Text>
          }
          ListEmptyComponent={
            <View className="py-16 items-center gap-2">
              <Ionicons name="bed-outline" size={44} color="#D1D5DB" />
              <Text className="text-gray-400">No hotels found</Text>
            </View>
          }
          renderItem={({ item }) => {
            const imageUrl = getPrimaryImageUrl(item.images);
            return (
              <Pressable
                onPress={() => router.push({ pathname: '/hotel/[id]', params: { id: item.id, ...(checkIn ? { checkIn } : {}), ...(checkOut ? { checkOut } : {}), ...(guests ? { guests } : {}) } })}
                className="bg-white rounded-3xl overflow-hidden shadow-hard-5"
              >
                {/* Image */}
                <View className="h-44 bg-gray-200 overflow-hidden">
                  {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
                  ) : (
                    <View className="flex-1 items-center justify-center">
                      <Ionicons name="bed-outline" size={48} color="rgba(0,0,0,0.15)" />
                    </View>
                  )}
                  {item.starRating ? (
                    <View className="absolute bottom-3 left-3 bg-gold rounded-md px-2 py-1 flex-row items-center gap-1">
                      <Ionicons name="star" size={11} color="#0B1D45" />
                      <Text size="xs" bold className="text-navy">{item.starRating}-star</Text>
                    </View>
                  ) : null}
                  <Pressable
                    onPress={() => setSaved((s) => ({ ...s, [item.id]: !s[item.id] }))}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white items-center justify-center"
                  >
                    <Ionicons
                      name={saved[item.id] ? 'heart' : 'heart-outline'}
                      size={18}
                      color={saved[item.id] ? '#EF4444' : '#9CA3AF'}
                    />
                  </Pressable>
                </View>

                {/* Info */}
                <View className="p-3.5">
                  <Text bold className="text-navy text-base" numberOfLines={1}>{item.name}</Text>
                  {item.starRating ? <View className="mt-1"><StarRating count={item.starRating} size={11} /></View> : null}
                  <View className="flex-row items-center mt-1 gap-1">
                    <Ionicons name="location-outline" size={12} color="#6B7280" />
                    <Text size="xs" className="text-gray-500 flex-1" numberOfLines={1}>{getHotelLocation(item)}</Text>
                  </View>

                  {/* Price */}
                  <View className="flex-row items-end justify-between mt-3">
                    <View>
                      {item.minPrice ? (
                        <>
                          <Text size="xs" className="text-gray-500">from</Text>
                          <Text bold className="text-navy text-lg">{formatVnd(item.minPrice)}</Text>
                          <Text size="xs" className="text-gray-500">per night</Text>
                        </>
                      ) : (
                        <Text size="sm" className="text-gray-400">Contact for price</Text>
                      )}
                    </View>
                    <Pressable
                      onPress={() => router.push({ pathname: '/hotel/[id]', params: { id: item.id, ...(checkIn ? { checkIn } : {}), ...(checkOut ? { checkOut } : {}), ...(guests ? { guests } : {}) } })}
                      className="bg-gold rounded-xl px-4 py-2.5"
                    >
                      <Text bold className="text-navy text-sm">View room</Text>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            );
          }}
          ListFooterComponent={<View style={{ height: bottom + 80 }} />}
        />
      )}

      {/* Map FAB */}
      <Pressable className="absolute bottom-6 self-center flex-row items-center gap-1.5 bg-navy rounded-full px-5 py-3 shadow-hard-2">
        <Ionicons name="map-outline" size={18} color="#fff" />
        <Text bold className="text-white">Map</Text>
      </Pressable>
    </View>
  );
}
