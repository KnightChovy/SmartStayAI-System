import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { ReviewCard } from '@/components/guest/ReviewCard';
import { useGetReviews, useHotelReviewStats } from '@/hooks/reviews';
import { REVIEW_SCORE_MAX, scoreLabelKey } from '@/utils/reviewScore';
import { GUEST_COLORS } from '@/constants/guestTheme';
import type { ReviewStats } from '@/types/reviews.type';

/** Số review hiện ngay tại trang chi tiết; còn lại xem ở màn "tất cả". */
const RECENT_COUNT = 3;

const SUBSCORES = [
  { key: 'cleanliness', labelKey: 'reviews.cleanliness' },
  { key: 'service', labelKey: 'reviews.service' },
  { key: 'location', labelKey: 'reviews.locationScore' },
  { key: 'value', labelKey: 'reviews.value' },
] as const;

function SubScoreBar({ label, value }: { label: string; value: number | null }) {
  return (
    <View className="mb-2.5 flex-row items-center gap-3">
      <Text className="w-20 font-bevi text-on-surface-variant" size="xs">
        {label}
      </Text>
      <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-container">
        <View className="h-full rounded-full bg-bronze" style={{ width: `${((value ?? 0) / REVIEW_SCORE_MAX) * 100}%` }} />
      </View>
      <Text className="w-7 text-right font-bevi-bold text-on-surface" size="xs">
        {value != null ? value.toFixed(1) : '—'}
      </Text>
    </View>
  );
}

/**
 * Khối "Đánh giá của khách" ở trang chi tiết khách sạn — bám theo `HotelReviews` của client:
 * điểm tổng + nhãn, 4 thanh điểm thành phần, vài đánh giá mới nhất, link xem tất cả.
 *
 * Điểm/tổng số lấy từ `GET /hotels/:id/review-stats` (tính trên toàn bộ đánh giá đã duyệt),
 * KHÔNG tự trung bình mấy review đang hiện.
 */
export function HotelReviews({ hotelId }: { hotelId: string }) {
  const { t } = useTranslation('hotel');
  const router = useRouter();
  const { data: stats } = useHotelReviewStats(hotelId);
  const { data } = useGetReviews({ hotelId, limit: RECENT_COUNT, sortBy: 'createdAt:desc' });

  const reviews = data?.results ?? [];
  const total = stats?.total ?? 0;
  const average: ReviewStats['average'] | undefined = stats?.average;
  const overall = average?.overall ?? null;

  // Chưa có đánh giá → nói thật, không bịa điểm (giống client).
  if (stats && total === 0) {
    return (
      <View className="mb-4 rounded-card border border-hairline/30 bg-surface p-5">
        <Heading size="lg" className="mb-2 font-bevi-bold text-on-surface">
          {t('reviews.title')}
        </Heading>
        <View className="flex-row items-start gap-3">
          <Ionicons name="sparkles-outline" size={20} color={GUEST_COLORS.bronze} />
          <View className="flex-1">
            <Text className="font-bevi-bold text-on-surface" size="sm">
              {t('reviews.newTitle')}
            </Text>
            <Text className="mt-1 font-bevi leading-5 text-on-surface-variant" size="xs">
              {t('reviews.newDesc')}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  if (!stats) return null;

  return (
    <View className="mb-4">
      <View className="mb-3 flex-row items-center justify-between">
        <Heading size="lg" className="font-bevi-bold text-on-surface">
          {t('reviews.title')}
        </Heading>
        {total > reviews.length && (
          <Pressable
            onPress={() => router.push({ pathname: '/hotel/reviews/[id]', params: { id: hotelId } })}
            hitSlop={8}
          >
            <Text className="font-bevi-bold text-bronze" size="sm">
              {t('reviews.viewAll')}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Điểm tổng + 4 thanh điểm thành phần */}
      <View className="mb-3 rounded-card border border-hairline/30 bg-surface p-4">
        <View className="mb-4 flex-row items-center gap-3">
          <View className="h-14 w-14 items-center justify-center rounded-field bg-on-surface">
            <Text className="font-bevi-bold text-white" size="md">
              {overall != null ? overall.toFixed(1) : '—'}
            </Text>
            <Text className="font-bevi text-white/70" size="2xs">
              /{REVIEW_SCORE_MAX}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="font-bevi-bold text-on-surface" size="md">
              {overall != null ? t(scoreLabelKey(overall)) : t('reviews.score')}
            </Text>
            <Text className="font-bevi text-on-surface-variant" size="xs">
              {t('reviews.count', { count: total })}
            </Text>
          </View>
        </View>

        {SUBSCORES.map(s => (
          <SubScoreBar key={s.key} label={t(s.labelKey)} value={average?.[s.key] ?? null} />
        ))}
      </View>

      {reviews.map(review => (
        <ReviewCard key={review.id} review={review} className="mb-3" />
      ))}

      {total > reviews.length && (
        <Pressable
          onPress={() => router.push({ pathname: '/hotel/reviews/[id]', params: { id: hotelId } })}
          className="min-h-12 flex-row items-center justify-center gap-1.5 rounded-full border border-hairline bg-surface"
        >
          <Text className="font-bevi-bold text-on-surface" size="sm">
            {t('reviews.seeAllCount', { count: total })}
          </Text>
          <Ionicons name="chevron-forward" size={15} color={GUEST_COLORS.onSurface} />
        </Pressable>
      )}
    </View>
  );
}
