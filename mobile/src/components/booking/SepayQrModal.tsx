import { useEffect } from 'react';
import { Modal, View, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { bookingsService } from '@/services/bookings.service';
import { queryKeys } from '@/constants/queryKeys';
import { formatVnd } from '@/utils/formatCurrency';
import { GUEST_COLORS } from '@/constants/guestTheme';
import type { SepayPaymentInfo } from '@/types/payments.type';

/** Nhịp hỏi lại trạng thái booking (SePay xác nhận qua webhook, không redirect). */
const POLL_MS = 4000;

interface SepayQrModalProps {
  visible: boolean;
  onClose: () => void;
  bookingId: string;
  info: SepayPaymentInfo | null;
  /** Booking đã được webhook xác nhận → nơi gọi tự quyết định điều hướng. */
  onConfirmed: () => void;
}

/**
 * Màn QR chuyển khoản SePay. Khác VNPay ở chỗ KHÔNG redirect: khách quét QR, SePay
 * gọi webhook về BE, BE confirm booking → app poll `GET /bookings/:id` cho tới khi
 * `status !== 'pending'` rồi tự đóng — mirror `SepayQrModal` bên client.
 */
export function SepayQrModal({ visible, onClose, bookingId, info, onConfirmed }: SepayQrModalProps) {
  const { t } = useTranslation('booking');
  const insets = useSafeAreaInsets();

  // Gọi thẳng service (không qua `useGetBooking`) vì đây là poll riêng của modal này
  // — cần `refetchInterval`, thứ hook dùng chung không expose.
  const { data: booking } = useQuery({
    queryKey: queryKeys.bookings.detail(bookingId),
    queryFn: () => bookingsService.getById(bookingId),
    enabled: visible && !!bookingId,
    refetchInterval: visible ? POLL_MS : false,
  });

  // Webhook đã xác nhận (hoặc huỷ) → thoát khỏi màn QR.
  useEffect(() => {
    if (visible && booking && booking.status !== 'pending') onConfirmed();
  }, [visible, booking, onConfirmed]);

  if (!info) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <Pressable className="flex-1" onPress={onClose} />
        <View className="bg-surface rounded-t-3xl" style={{ maxHeight: '90%' }}>
          <View className="flex-row items-start justify-between gap-4 px-5 pt-4 pb-3 border-b border-hairline/30">
            <View>
              <Heading size="lg" className="font-bevi-bold text-on-surface">{t('sepay.title')}</Heading>
              <Text size="xs" className="font-bevi text-muted mt-0.5">{t('sepay.subtitle')}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8} className="w-9 h-9 items-center justify-center">
              <Ionicons name="close" size={22} color={GUEST_COLORS.onSurface} />
            </Pressable>
          </View>

          <View className="px-5 py-5 gap-4">
            <Image
              source={{ uri: info.qrUrl }}
              style={{ width: 224, height: 224, alignSelf: 'center', borderRadius: 16 }}
              contentFit="contain"
            />

            <View className="bg-surface-container rounded-2xl p-3.5 gap-3">
              <SepayRow label={t('sepay.amount')} value={formatVnd(info.amount)} />
              <SepayRow label={t('sepay.bank')} value={info.bankCode} />
              <SepayRow label={t('sepay.account')} value={info.accountNumber} mono stacked />
              <SepayRow label={t('sepay.content')} value={info.transferContent} mono stacked />
            </View>

            <View className="bg-amber-50 rounded-2xl p-3.5">
              <Text size="xs" className="font-bevi text-amber-800">{t('sepay.keepContent')}</Text>
            </View>

            <View className="flex-row items-center justify-center gap-2 py-1">
              <ActivityIndicator size="small" color={GUEST_COLORS.bronze} />
              <Text size="sm" className="font-bevi text-on-surface-variant">{t('sepay.waiting')}</Text>
            </View>
          </View>

          <View
            className="px-5 pt-1 border-t border-hairline/30"
            style={{ paddingBottom: Math.max(insets.bottom, 12) + 12 }}
          >
            <Pressable onPress={onClose} className="border border-hairline/50 rounded-card py-3.5 items-center mt-3">
              <Text bold className="font-bevi-bold text-on-surface text-base">{t('sepay.payLater')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/**
 * `stacked` (nhãn xếp TRÊN giá trị, thay vì cùng một hàng): bắt buộc cho số tài khoản
 * và nội dung chuyển khoản — 2 chuỗi này dài, không có khoảng trắng để ngắt dòng, nên
 * nếu để chung một hàng với `flex-1` sẽ tràn khỏi khung thẻ (đã xảy ra trên thiết bị
 * thật). Xếp dọc thì luôn đủ bề rộng để wrap, không phụ thuộc độ dài chuỗi.
 */
function SepayRow({
  label,
  value,
  mono,
  stacked,
}: {
  label: string;
  value: string;
  mono?: boolean;
  stacked?: boolean;
}) {
  if (stacked) {
    return (
      <View>
        <Text size="sm" className="font-bevi text-on-surface-variant mb-1">{label}</Text>
        <Text
          size="sm"
          bold
          selectable
          className={`font-bevi-bold text-on-surface ${mono ? 'font-mono' : ''}`}
        >
          {value}
        </Text>
      </View>
    );
  }
  return (
    <View className="flex-row items-center justify-between gap-3">
      <Text size="sm" className="font-bevi text-on-surface-variant">{label}</Text>
      <Text
        size="sm"
        bold
        selectable
        className={`font-bevi-bold text-on-surface text-right shrink ${mono ? 'font-mono' : ''}`}
      >
        {value}
      </Text>
    </View>
  );
}
