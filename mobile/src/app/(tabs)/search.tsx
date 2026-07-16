import { useState } from 'react';
import { View, ScrollView, Pressable, FlatList, TextInput, ActivityIndicator, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { StarRating } from '@/components/shared/StarRating';
import { useDebounce } from '@/hooks/ui/use-debounce';
import { useGetHotels } from '@/hooks/hotels';
import { getPrimaryImageUrl, getHotelLocation } from '@/utils/hotel';
import { formatVnd } from '@/utils/formatCurrency';
import type { HotelSearchResult } from '@/types/hotels.type';
import { GUEST_COLORS } from '@/constants/guestTheme';

/** Union chứ không phải `string`: để `t()` kiểm được key `search:filterOptions.*` lúc build. */
type FilterId = '5star' | '4plus' | 'under1m' | 'under3m' | 'hasPrice';

interface HotelFilter {
  id: FilterId;
  test: (h: HotelSearchResult) => boolean;
}

/** Bộ lọc lọc trên field có thật từ API (starRating, minPrice). */
const FILTERS: HotelFilter[] = [
  { id: '5star', test: (h) => h.starRating === 5 },
  { id: '4plus', test: (h) => (h.starRating ?? 0) >= 4 },
  { id: 'under1m', test: (h) => h.minPrice != null && Number(h.minPrice) < 1_000_000 },
  { id: 'under3m', test: (h) => h.minPrice != null && Number(h.minPrice) < 3_000_000 },
  { id: 'hasPrice', test: (h) => h.minPrice != null },
];

const SORT_OPTIONS = ['recommended', 'lowestPrice', 'highestRated'] as const;
type SortOption = typeof SORT_OPTIONS[number];

function sortHotels(list: HotelSearchResult[], sort: SortOption): HotelSearchResult[] {
  const copy = [...list];
  if (sort === 'lowestPrice') {
    return copy.sort((a, b) => Number(a.minPrice ?? Infinity) - Number(b.minPrice ?? Infinity));
  }
  if (sort === 'highestRated') {
    return copy.sort((a, b) => (b.starRating ?? 0) - (a.starRating ?? 0));
  }
  return copy;
}

export default function SearchScreen() {
  const router = useRouter();
  const { t } = useTranslation(['search', 'common']);
  const { city, checkIn, checkOut, guests } = useLocalSearchParams<{
    city?: string; checkIn?: string; checkOut?: string; guests?: string;
  }>();
  const { bottom } = useSafeAreaInsets();
  const [sort, setSort] = useState<SortOption>('recommended');
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
    <View className="flex-1 bg-canvas">
      <SafeAreaView edges={['top']} className="bg-on-surface">
        {/* Search input */}
        <View className="px-4 pt-3 pb-2">
          <View className="flex-row items-center bg-canvas rounded-card px-3 h-11">
            <Ionicons name="search" size={18} color={GUEST_COLORS.muted} />
            <TextInput
              className="flex-1 font-bevi text-sm text-on-surface ml-2"
              placeholder={t('search:placeholder')}
              placeholderTextColor={GUEST_COLORS.muted}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={GUEST_COLORS.muted} />
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
              <Ionicons name="options-outline" size={14} color={GUEST_COLORS.white} />
              <Text size="sm" bold className="font-bevi-bold text-white">
                {activeFilters.length > 0 ? t('search:clearFilters', { count: activeFilters.length }) : t('search:filters')}
              </Text>
            </Pressable>
            {FILTERS.map((f) => {
              const active = activeFilters.includes(f.id);
              return (
                <Pressable
                  key={f.id}
                  onPress={() => toggleFilter(f.id)}
                  className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 ${active ? 'bg-surface' : 'bg-surface/20'}`}
                >
                  <Text size="sm" bold className={`font-bevi-bold ${active ? 'text-on-surface' : 'text-white'}`}>{t(`search:filterOptions.${f.id}`)}</Text>
                  <Ionicons name={active ? 'checkmark' : 'add'} size={13} color={active ? GUEST_COLORS.onSurface : GUEST_COLORS.white} />
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
              className={`px-3 py-2 rounded-field ${sort === opt ? 'bg-surface' : 'bg-surface/10'}`}
            >
              <Text size="xs" bold className={`font-bevi-bold ${sort === opt ? 'text-on-surface' : 'text-white'}`}>{t(`search:sort.${opt}`)}</Text>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>

      {/* Results */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={GUEST_COLORS.onSurface} />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <Ionicons name="cloud-offline-outline" size={48} color={GUEST_COLORS.hairline} />
          <Text className="font-bevi text-muted text-center">{t('search:error')}</Text>
          <Pressable onPress={() => refetch()} className="bg-on-surface rounded-field px-5 py-2.5">
            <Text bold className="font-bevi-bold text-white">{t('common:retry')}</Text>
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
            <Text size="xs" bold className="font-bevi-bold text-on-surface-variant uppercase mb-1">
              {t('search:resultCount', { count: filtered.length, place: city ?? t('search:defaultPlace') })}
            </Text>
          }
          ListEmptyComponent={
            <View className="py-16 items-center gap-2">
              <Ionicons name="bed-outline" size={44} color={GUEST_COLORS.hairline} />
              <Text className="font-bevi text-muted">{t('search:empty')}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const imageUrl = getPrimaryImageUrl(item.images);
            return (
              <Pressable
                onPress={() => router.push({ pathname: '/hotel/[id]', params: { id: item.id, ...(checkIn ? { checkIn } : {}), ...(checkOut ? { checkOut } : {}), ...(guests ? { guests } : {}) } })}
                className="bg-surface rounded-panel overflow-hidden"
              >
                {/* Image */}
                <View className="h-44 bg-surface-container overflow-hidden">
                  {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
                  ) : (
                    <View className="flex-1 items-center justify-center">
                      <Ionicons name="bed-outline" size={48} color="rgba(0,0,0,0.15)" />
                    </View>
                  )}
                  {item.starRating ? (
                    <View className="absolute bottom-3 left-3 bg-bronze rounded-md px-2 py-1 flex-row items-center gap-1">
                      <Ionicons name="star" size={11} color={GUEST_COLORS.onSurface} />
                      <Text size="xs" bold className="font-bevi-bold text-on-surface">{t('common:stars', { count: item.starRating })}</Text>
                    </View>
                  ) : null}
                  <Pressable
                    onPress={() => setSaved((s) => ({ ...s, [item.id]: !s[item.id] }))}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-surface items-center justify-center"
                  >
                    <Ionicons
                      name={saved[item.id] ? 'heart' : 'heart-outline'}
                      size={18}
                      color={saved[item.id] ? '#EF4444' : GUEST_COLORS.muted}
                    />
                  </Pressable>
                </View>

                {/* Info */}
                <View className="p-3.5">
                  <Text bold className="font-bevi-bold text-on-surface text-base" numberOfLines={1}>{item.name}</Text>
                  {item.starRating ? <View className="mt-1"><StarRating count={item.starRating} size={11} /></View> : null}
                  <View className="flex-row items-center mt-1 gap-1">
                    <Ionicons name="location-outline" size={12} color={GUEST_COLORS.onSurfaceVariant} />
                    <Text size="xs" className="font-bevi text-on-surface-variant flex-1" numberOfLines={1}>{getHotelLocation(item)}</Text>
                  </View>

                  {/* Price */}
                  <View className="flex-row items-end justify-between mt-3">
                    <View>
                      {item.minPrice ? (
                        <>
                          <Text size="xs" className="font-bevi text-on-surface-variant">{t('common:from')}</Text>
                          <Text bold className="font-bevi-bold text-on-surface text-lg">{formatVnd(item.minPrice)}</Text>
                          <Text size="xs" className="font-bevi text-on-surface-variant">{t('common:perNight')}</Text>
                        </>
                      ) : (
                        <Text size="sm" className="font-bevi text-muted">{t('common:contactForPrice')}</Text>
                      )}
                    </View>
                    <Pressable
                      onPress={() => router.push({ pathname: '/hotel/[id]', params: { id: item.id, ...(checkIn ? { checkIn } : {}), ...(checkOut ? { checkOut } : {}), ...(guests ? { guests } : {}) } })}
                      className="bg-bronze rounded-field px-4 py-2.5"
                    >
                      <Text bold className="font-bevi-bold text-on-surface text-sm">{t('search:viewRoom')}</Text>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            );
          }}
          ListFooterComponent={<View style={{ height: bottom + 80 }} />}
        />
      )}
    </View>
  );
}
