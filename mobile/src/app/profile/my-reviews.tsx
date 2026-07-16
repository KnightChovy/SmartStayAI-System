import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { StarRating } from '@/components/shared/StarRating';
import { ReviewSheet } from '@/components/guest';
import { useMyReviews } from '@/hooks/reviews';
import { formatDateShort } from '@/utils/formatDate';
import { GUEST_COLORS } from '@/constants/guestTheme';
import type { MyReview } from '@/types/reviews.type';

/** Chỉ `pending`/`hidden` mới cần gắn nhãn — `published` là trạng thái bình thường. */
const STATUS_STYLE: Record<string, { bg: string; text: string; labelKey: 'pendingReview' | 'hidden' }> = {
  pending: { bg: '#FEF3C7', text: '#B45309', labelKey: 'pendingReview' },
  hidden: { bg: '#F3F4F6', text: '#6B7280', labelKey: 'hidden' },
};

/**
 * "Đánh giá của tôi" — xem + sửa (không viết mới ở đây; viết từ chi tiết booking sau khi
 * trả phòng), giống hệt `MyReviewsPage` của client.
 */
export default function MyReviewsScreen() {
  const router = useRouter();
  const { t } = useTranslation(['account', 'common']);
  const { data, isLoading, isError, refetch, isRefetching } = useMyReviews();
  const [editing, setEditing] = useState<MyReview | null>(null);

  const reviews = data?.results ?? [];

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
        <Heading size="lg" className="font-bevi-bold text-on-surface">
          {t('account:reviews.title')}
        </Heading>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={GUEST_COLORS.brand} />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <Ionicons name="cloud-offline-outline" size={44} color={GUEST_COLORS.hairline} />
          <Text className="text-center font-bevi text-muted">{t('account:reviews.error')}</Text>
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
          ListHeaderComponent={
            reviews.length > 0 ? (
              <Text className="font-bevi text-on-surface-variant" size="xs">
                {t('account:reviews.subtitle')}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <View className="mt-24 items-center gap-2 px-8">
              <Ionicons name="star-outline" size={52} color={GUEST_COLORS.hairline} />
              <Text className="font-bevi-bold text-muted" size="md">
                {t('account:reviews.emptyTitle')}
              </Text>
              <Text className="text-center font-bevi text-muted" size="sm">
                {t('account:reviews.emptyDesc')}
              </Text>
              <Pressable
                onPress={() => router.push('/(tabs)/bookings')}
                className="mt-2 rounded-field bg-on-surface px-5 py-2.5"
              >
                <Text className="font-bevi-bold text-white">{t('account:quick.bookings')}</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => {
            const badge = STATUS_STYLE[item.status];
            return (
              <View className="rounded-card border border-hairline/30 bg-surface p-4">
                <View className="mb-2 flex-row items-start justify-between gap-2">
                  <View className="flex-1">
                    <Text className="font-bevi-bold text-on-surface" size="sm" numberOfLines={1}>
                      {item.hotel?.name ?? t('common:hotel')}
                    </Text>
                    <Text className="mt-0.5 font-bevi text-muted" size="xs">
                      {item.booking?.bookingCode ? `#${item.booking.bookingCode} · ` : ''}
                      {formatDateShort(item.createdAt)}
                    </Text>
                  </View>
                  {badge && (
                    <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: badge.bg }}>
                      <Text className="font-bevi-bold" size="2xs" style={{ color: badge.text }}>
                        {t(`account:reviews.${badge.labelKey}`)}
                      </Text>
                    </View>
                  )}
                </View>

                <StarRating count={item.overallRating} size={14} />

                {item.title ? (
                  <Text className="mb-1 mt-2 font-bevi-bold text-on-surface" size="sm">
                    {item.title}
                  </Text>
                ) : null}
                <Text className="mt-1 font-bevi leading-5 text-on-surface-variant" size="sm">
                  {item.content}
                </Text>

                {item.images?.length > 0 && (
                  <View className="mt-3 flex-row flex-wrap gap-2">
                    {item.images.map(img => (
                      <Image
                        key={img.id}
                        source={{ uri: img.url }}
                        style={{ width: 72, height: 72, borderRadius: 12 }}
                        contentFit="cover"
                      />
                    ))}
                  </View>
                )}

                {item.managerResponse ? (
                  <View className="mt-3 rounded-field bg-surface-low p-3">
                    <View className="mb-1 flex-row items-center gap-1.5">
                      <Ionicons name="chatbubble-ellipses-outline" size={13} color={GUEST_COLORS.bronze} />
                      <Text className="font-bevi-bold uppercase tracking-[1px] text-bronze" size="xs">
                        {t('account:reviews.responseFromProperty')}
                      </Text>
                    </View>
                    <Text className="font-bevi leading-5 text-on-surface-variant" size="xs">
                      {item.managerResponse}
                    </Text>
                  </View>
                ) : null}

                <Pressable
                  onPress={() => setEditing(item)}
                  className="mt-3 min-h-11 flex-row items-center justify-center gap-1.5 rounded-full border border-hairline bg-surface"
                >
                  <Ionicons name="create-outline" size={15} color={GUEST_COLORS.onSurface} />
                  <Text className="font-bevi-bold text-on-surface" size="sm">
                    {t('account:reviews.editFeedback')}
                  </Text>
                </Pressable>
              </View>
            );
          }}
        />
      )}

      {editing && (
        <ReviewSheet
          visible={!!editing}
          onClose={() => setEditing(null)}
          bookingId={editing.bookingId}
          hotelName={editing.hotel?.name ?? t('common:hotel')}
          bookingCode={editing.booking?.bookingCode ?? ''}
          existingReview={editing}
        />
      )}
    </SafeAreaView>
  );
}
