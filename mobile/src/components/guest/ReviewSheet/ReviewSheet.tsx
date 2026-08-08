import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { StarRating } from '@/components/shared/StarRating';
import { LuxButton } from '@/components/guest/LuxButton';
import { REVIEW_SCORE_MAX } from '@/utils/reviewScore';
import { useCreateReview, useUpdateReview } from '@/hooks/reviews';
import { GUEST_COLORS, PLACEHOLDER } from '@/constants/guestTheme';
import { errorMessage } from '@/utils/errorMessage';
import type { MyReview } from '@/types/reviews.type';

/** 4 tiêu chí BE bắt buộc — điểm tổng suy ra từ đây, khách không tự chấm. */
const SUBSCORES = [
  { key: 'cleanlinessRating', labelKey: 'cleanliness' },
  { key: 'serviceRating', labelKey: 'service' },
  { key: 'locationRating', labelKey: 'location' },
  { key: 'valueRating', labelKey: 'value' },
] as const;

interface RatingForm {
  cleanlinessRating: number;
  serviceRating: number;
  locationRating: number;
  valueRating: number;
  title: string;
  content: string;
  images: string[];
}

const EMPTY: RatingForm = {
  cleanlinessRating: REVIEW_SCORE_MAX,
  serviceRating: REVIEW_SCORE_MAX,
  locationRating: REVIEW_SCORE_MAX,
  valueRating: REVIEW_SCORE_MAX,
  title: '',
  content: '',
  images: [],
};

interface ReviewSheetProps {
  visible: boolean;
  onClose: () => void;
  bookingId: string;
  /** Chỉ để hiển thị — BE tự suy khách sạn từ `bookingId`. */
  hotelName: string;
  bookingCode: string;
  /** Có = chế độ sửa (PATCH), không = viết mới (POST). */
  existingReview?: MyReview | null;
}

/**
 * Sheet viết/sửa đánh giá — bám đúng `ReviewModal` của client (thang /10):
 * khách chấm 4 tiêu chí trên thang 10, **điểm tổng là trung bình làm tròn** (1..10),
 * ảnh nhập bằng URL (BE chỉ nhận URI, không nhận `file://`).
 */
export function ReviewSheet({
  visible,
  onClose,
  bookingId,
  hotelName,
  bookingCode,
  existingReview,
}: ReviewSheetProps) {
  const { t } = useTranslation(['account', 'common']);
  const insets = useSafeAreaInsets();
  const createReview = useCreateReview();
  const updateReview = useUpdateReview();

  const isEdit = !!existingReview;
  const [form, setForm] = useState<RatingForm>(EMPTY);
  const [imageDraft, setImageDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Nạp lại mỗi lần mở: sửa thì điền bản cũ, viết mới thì về mặc định.
  useEffect(() => {
    if (!visible) return;
    setError(null);
    setImageDraft('');
    setForm(
      existingReview
        ? {
            cleanlinessRating: existingReview.cleanlinessRating,
            serviceRating: existingReview.serviceRating,
            locationRating: existingReview.locationRating,
            valueRating: existingReview.valueRating,
            title: existingReview.title ?? '',
            content: existingReview.content,
            images: existingReview.images?.map(img => img.url) ?? [],
          }
        : EMPTY
    );
  }, [visible, existingReview]);

  const avg =
    (form.cleanlinessRating + form.serviceRating + form.locationRating + form.valueRating) / 4;
  const overallRating = Math.round(avg);
  const isPending = createReview.isPending || updateReview.isPending;

  function addImage() {
    const url = imageDraft.trim();
    if (!url) return;
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('unsupported protocol');
    } catch {
      setError(t('account:review.photoUrlInvalid'));
      return;
    }
    // BE chặn tối đa 10 ảnh — chặn sẵn ở đây thay vì để 400 dội về.
    if (form.images.length >= 10) {
      setError(t('account:review.photoMax'));
      return;
    }
    if (form.images.includes(url)) {
      setError(t('account:review.photoDuplicate'));
      return;
    }
    setError(null);
    setForm(f => ({ ...f, images: [...f.images, url] }));
    setImageDraft('');
  }

  async function handleSubmit() {
    if (!form.content.trim()) {
      setError(t('account:review.contentRequired'));
      return;
    }
    setError(null);
    try {
      if (isEdit && existingReview) {
        await updateReview.mutateAsync({
          reviewId: existingReview.id,
          payload: {
            overallRating,
            cleanlinessRating: form.cleanlinessRating,
            serviceRating: form.serviceRating,
            locationRating: form.locationRating,
            valueRating: form.valueRating,
            // Gửi cả khi rỗng: chuỗi rỗng để BE xoá tiêu đề, mảng rỗng để xoá hết ảnh.
            title: form.title.trim(),
            content: form.content.trim(),
            images: form.images,
          },
        });
        Alert.alert(t('account:review.updated'));
      } else {
        await createReview.mutateAsync({
          bookingId,
          overallRating,
          cleanlinessRating: form.cleanlinessRating,
          serviceRating: form.serviceRating,
          locationRating: form.locationRating,
          valueRating: form.valueRating,
          title: form.title.trim() || undefined,
          content: form.content.trim(),
          images: form.images.length ? form.images : undefined,
        });
        Alert.alert(t('account:review.published'));
      }
      onClose();
    } catch (err) {
      setError(errorMessage(err, t('account:review.submitError')));
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <Pressable className="flex-1" onPress={onClose} />
        <View className="rounded-t-sheet bg-surface" style={{ maxHeight: '92%' }}>
          <View className="flex-row items-center justify-between border-b border-hairline/30 px-5 pb-3 pt-4">
            <Heading size="lg" className="font-bevi-bold text-on-surface">
              {isEdit ? t('account:review.editTitle') : t('account:review.writeTitle')}
            </Heading>
            <Pressable onPress={onClose} hitSlop={8} className="h-9 w-9 items-center justify-center">
              <Ionicons name="close" size={22} color={GUEST_COLORS.onSurface} />
            </Pressable>
          </View>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              // Padding đặt ở contentContainerStyle, KHÔNG phải style của ScrollView:
              // style là khung cuộn, padding dọc ở đó sẽ cắt nội dung khi cuộn.
              contentContainerStyle={{
                paddingHorizontal: 20,
                // `insets.bottom` = 0 trên đa số máy Android (điều hướng bằng nút) nên
                // không thể dựa vào nó để lấy khoảng thở — phải có mức sàn, nếu không
                // nút Lưu dính sát mép dưới sheet.
                paddingBottom: Math.max(insets.bottom, 12) + 28,
              }}
            >
              <View className="mt-4 rounded-card border border-hairline/30 bg-surface-low p-3.5">
                <Text className="font-bevi-bold text-on-surface" size="sm">
                  {hotelName}
                </Text>
                <Text className="mt-0.5 font-bevi text-muted" size="xs">
                  #{bookingCode}
                </Text>
              </View>

              {/* Điểm tổng: chỉ đọc, suy từ 4 tiêu chí — thang /10 giống hệt client. */}
              <View className="mt-5 items-center rounded-card border border-hairline/30 bg-surface-low py-4">
                <Text className="font-bevi-bold uppercase tracking-[1px] text-on-surface-variant" size="xs">
                  {t('account:review.overall')}
                </Text>
                <View className="my-1.5 flex-row items-baseline gap-0.5">
                  <Text className="font-bevi-bold text-on-surface" size="3xl">
                    {avg.toFixed(1)}
                  </Text>
                  <Text className="font-bevi-bold text-muted" size="sm">
                    /{REVIEW_SCORE_MAX}
                  </Text>
                </View>
                <Text className="font-bevi text-muted" size="xs">
                  {t('account:review.overallHint')}
                </Text>
              </View>

              {SUBSCORES.map(s => (
                <View key={s.key} className="mt-4 rounded-card border border-hairline/30 bg-surface-low px-3.5 py-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="font-bevi-medium text-on-surface" size="sm">
                      {t(`account:review.${s.labelKey}`)}
                    </Text>
                    <Text className="font-bevi-bold text-on-surface" size="sm">
                      {form[s.key]}/{REVIEW_SCORE_MAX}
                    </Text>
                  </View>
                  <View className="mt-2">
                    <StarRating
                      count={form[s.key]}
                      total={REVIEW_SCORE_MAX}
                      size={22}
                      onRate={v => setForm(f => ({ ...f, [s.key]: v }))}
                      accessibilityLabel={t(`account:review.${s.labelKey}`)}
                    />
                  </View>
                </View>
              ))}

              <Text className="mb-2 mt-6 font-bevi-bold uppercase tracking-[1.2px] text-on-surface-variant" size="xs">
                {t('account:review.titleLabel')}
              </Text>
              <TextInput
                value={form.title}
                onChangeText={v => setForm(f => ({ ...f, title: v }))}
                placeholder={t('account:review.titlePlaceholder')}
                placeholderTextColor={PLACEHOLDER}
                maxLength={200}
                className="h-12 rounded-field border border-hairline/60 bg-surface-low px-4 font-bevi text-[15px] text-on-surface"
              />

              <Text className="mb-2 mt-4 font-bevi-bold uppercase tracking-[1.2px] text-on-surface-variant" size="xs">
                {t('account:review.content')}
              </Text>
              <TextInput
                value={form.content}
                onChangeText={v => setForm(f => ({ ...f, content: v }))}
                placeholder={t('account:review.contentPlaceholder')}
                placeholderTextColor={PLACEHOLDER}
                maxLength={2000}
                multiline
                textAlignVertical="top"
                className="min-h-28 rounded-field border border-hairline/60 bg-surface-low p-4 font-bevi text-[15px] text-on-surface"
              />

              <Text className="mb-2 mt-4 font-bevi-bold uppercase tracking-[1.2px] text-on-surface-variant" size="xs">
                {t('account:review.photos')}
              </Text>
              <View className="flex-row gap-2">
                <TextInput
                  value={imageDraft}
                  onChangeText={setImageDraft}
                  placeholder={t('account:review.photoPlaceholder')}
                  placeholderTextColor={PLACEHOLDER}
                  autoCapitalize="none"
                  keyboardType="url"
                  onSubmitEditing={addImage}
                  className="h-12 flex-1 rounded-field border border-hairline/60 bg-surface-low px-4 font-bevi text-[15px] text-on-surface"
                />
                <Pressable
                  onPress={addImage}
                  className="h-12 justify-center rounded-field bg-on-surface px-4"
                >
                  <Text className="font-bevi-bold uppercase tracking-[1px] text-white" size="xs">
                    {t('account:review.add')}
                  </Text>
                </Pressable>
              </View>

              {form.images.length > 0 && (
                <View className="mt-3 flex-row flex-wrap gap-2">
                  {form.images.map((url, i) => (
                    <View key={`${url}-${i}`} className="overflow-hidden rounded-field">
                      <Image source={{ uri: url }} style={{ width: 72, height: 72 }} contentFit="cover" />
                      <Pressable
                        onPress={() => setForm(f => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))}
                        hitSlop={6}
                        className="absolute right-1 top-1 h-6 w-6 items-center justify-center rounded-full bg-on-surface/80"
                      >
                        <Ionicons name="close" size={13} color={GUEST_COLORS.white} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}

              {error && (
                <Text className="mt-3 font-bevi-semibold text-danger" size="xs">
                  {error}
                </Text>
              )}

              {/* Khoảng thở dưới nút do `contentContainerStyle.paddingBottom` lo — để ở
                  một chỗ, tránh hai nguồn margin cộng dồn khó chỉnh. */}
              <View className="mt-6">
                <LuxButton
                  label={
                    isPending
                      ? isEdit
                        ? t('account:review.saving')
                        : t('account:review.publishing')
                      : isEdit
                        ? t('account:review.saveChanges')
                        : t('account:review.publish')
                  }
                  onPress={handleSubmit}
                  loading={isPending}
                  disabled={!form.content.trim()}
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );
}
