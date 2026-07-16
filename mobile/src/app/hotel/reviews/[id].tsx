import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { ReviewCard } from '@/components/guest/ReviewCard';
import { StarRating } from '@/components/shared/StarRating';
import { useGetReviews, useHotelReviewStats } from '@/hooks/reviews';
import { GUEST_COLORS } from '@/constants/guestTheme';

/** BE chặn limit tối đa 100 — lấy full trang rồi phân trang bằng nút "tải thêm". */
const PAGE_SIZE = 20;

/**
 * Xem TẤT CẢ đánh giá của một khách sạn — màn này trước không tồn tại, nên nút
 * "View all" ở trang chi tiết là nút chết (không có `onPress`).
 */
export default function HotelReviewsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation(['hotel', 'common']);
  const [page, setPage] = useState(1);

  const { data: stats } = useHotelReviewStats(id);
  const { data, isLoading, isError, refetch, isRefetching } = useGetReviews({
    hotelId: id,
    limit: PAGE_SIZE * page,
    sortBy: 'createdAt:desc',
  });

  const reviews = data?.results ?? [];
  const total = stats?.total ?? data?.totalResults ?? 0;
  const overall = stats?.average.overall ?? null;
  const hasMore = reviews.length < total;

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <View className="flex-row items-center gap-3 border-b border-hairline/30 bg-surface px-4 pb-3 pt-2">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('common:back')}
          className="h-9 w-9 items-center justify-center"
        >
          <Ionicons name="arrow-back" size={22} color={GUEST_COLORS.onSurface} />
        </Pressable>
        <View className="flex-1">
          <Heading size="lg" className="font-bevi-bold text-on-surface">
            {t('hotel:reviews.allTitle')}
          </Heading>
          {total > 0 && (
            <View className="mt-0.5 flex-row items-center gap-2">
              {overall != null && (
                <>
                  <StarRating count={Math.round(overall)} size={11} />
                  <Text className="font-bevi-bold text-on-surface" size="xs">
                    {overall.toFixed(1)}
                  </Text>
                </>
              )}
              <Text className="font-bevi text-muted" size="xs">
                {t('hotel:reviews.count', { count: total })}
              </Text>
            </View>
          )}
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={GUEST_COLORS.brand} />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <Ionicons name="cloud-offline-outline" size={44} color={GUEST_COLORS.hairline} />
          <Text className="text-center font-bevi text-muted">{t('hotel:reviews.error')}</Text>
          <Pressable onPress={() => refetch()} className="rounded-field bg-on-surface px-5 py-2.5">
            <Text className="font-bevi-bold text-white">{t('common:retry')}</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={r => r.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          onRefresh={refetch}
          refreshing={isRefetching}
          renderItem={({ item }) => <ReviewCard review={item} />}
          ListEmptyComponent={
            <View className="mt-24 items-center gap-2">
              <Ionicons name="chatbubble-outline" size={48} color={GUEST_COLORS.hairline} />
              <Text className="font-bevi text-muted">{t('hotel:reviews.empty')}</Text>
            </View>
          }
          ListFooterComponent={
            hasMore ? (
              <Pressable
                onPress={() => setPage(p => p + 1)}
                className="min-h-12 items-center justify-center rounded-full border border-hairline bg-surface"
              >
                <Text className="font-bevi-bold text-on-surface" size="sm">
                  {t('hotel:reviews.seeAllCount', { count: total })}
                </Text>
              </Pressable>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
