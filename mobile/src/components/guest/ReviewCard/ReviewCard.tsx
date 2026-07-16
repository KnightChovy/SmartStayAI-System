import { View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { StarRating } from '@/components/shared/StarRating';
import { getInitials } from '@/utils/hotel';
import { formatDateShort } from '@/utils/formatDate';
import { GUEST_COLORS } from '@/constants/guestTheme';
import type { Review } from '@/types/reviews.type';

const AVATAR_COLORS = ['#0D9488', '#B45309', '#1D4ED8', '#7C3AED', '#DC2626', '#059669'];

/** Màu avatar suy từ tên — cùng tên thì luôn ra cùng màu. */
export function avatarColor(seed: string): string {
  let sum = 0;
  for (const ch of seed) sum += ch.charCodeAt(0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

interface ReviewCardProps {
  review: Review;
  className?: string;
}

/**
 * Một đánh giá của khách — dùng chung ở chi tiết KS, màn xem tất cả và "Đánh giá của tôi".
 * Render đủ những gì BE trả: sao, tiêu đề, nội dung, **ảnh** và **phản hồi của khách sạn**
 * (bản cũ bỏ qua 2 thứ cuối nên khách không thấy ảnh lẫn lời đáp của KS).
 */
export function ReviewCard({ review, className }: ReviewCardProps) {
  const { t } = useTranslation('hotel');
  const name = review.customer?.fullName ?? t('reviews.guest');

  return (
    <View className={`rounded-card border border-hairline/30 bg-surface p-4 ${className ?? ''}`}>
      <View className="mb-2.5 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2.5">
          <View
            className="h-[38px] w-[38px] items-center justify-center rounded-full"
            style={{ backgroundColor: avatarColor(name) }}
          >
            <Text size="sm" className="font-bevi-bold text-white">
              {getInitials(name)}
            </Text>
          </View>
          <View>
            <Text className="font-bevi-bold text-on-surface" size="sm">
              {name}
            </Text>
            <View className="mt-0.5 flex-row items-center gap-1.5">
              <StarRating count={review.overallRating} size={11} />
              <Text className="font-bevi text-muted" size="xs">
                {formatDateShort(review.createdAt)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {review.title ? (
        <Text className="mb-1 font-bevi-bold text-on-surface" size="sm">
          {review.title}
        </Text>
      ) : null}
      <Text className="font-bevi leading-5 text-on-surface-variant" size="sm">
        {review.content}
      </Text>

      {review.images?.length > 0 && (
        <View className="mt-3 flex-row flex-wrap gap-2">
          {review.images.map(img => (
            <Image
              key={img.id}
              source={{ uri: img.url }}
              style={{ width: 76, height: 76, borderRadius: 12 }}
              contentFit="cover"
              transition={150}
              accessibilityLabel={t('reviews.photoAlt')}
            />
          ))}
        </View>
      )}

      {review.managerResponse ? (
        <View className="mt-3 rounded-field bg-surface-low p-3">
          <View className="mb-1 flex-row items-center gap-1.5">
            <Ionicons name="chatbubble-ellipses-outline" size={13} color={GUEST_COLORS.bronze} />
            <Text className="font-bevi-bold uppercase tracking-[1px] text-bronze" size="xs">
              {t('reviews.responseFromProperty')}
            </Text>
          </View>
          <Text className="font-bevi leading-5 text-on-surface-variant" size="xs">
            {review.managerResponse}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
