import { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, Modal, Pressable, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { GUEST_COLORS } from '@/constants/guestTheme';
import type { ChatSession } from '@/types/chatbot.type';
import { ChatSessionRow } from './ChatSessionRow';

const DRAWER_WIDTH = Math.min(320, Dimensions.get('window').width * 0.84);
const DURATION = 220;

export interface ChatHistoryDrawerProps {
  visible: boolean;
  sessions: ChatSession[];
  activeSessionId: string | null;
  /** Khoá chọn/tạo đoạn khi AI đang trả lời. */
  disabled?: boolean;
  onClose: () => void;
  onSelect: (sessionId: string) => void;
  onNewChat: () => void;
  onRequestRename: (session: ChatSession) => void;
  onRequestDelete: (session: ChatSession) => void;
}

/**
 * Ngăn kéo lịch sử trò chuyện trượt từ trái (kiểu ChatGPT).
 *
 * Dùng `Modal` chứ không phải overlay absolute trong màn chat: drawer phải phủ cả **tab bar**
 * ở `(tabs)/_layout.tsx` và không được để `KeyboardAvoidingView` của màn chat cắt mất.
 * Animation dùng reanimated v4 — đã chạy production ngay trong thư mục này (`TypingDots`),
 * và AGENTS §5.8 chỉ định reanimated, nên không kéo thêm `Animated` của RN vào cùng một chỗ.
 */
export function ChatHistoryDrawer({
  visible,
  sessions,
  activeSessionId,
  disabled = false,
  onClose,
  onSelect,
  onNewChat,
  onRequestRename,
  onRequestDelete,
}: ChatHistoryDrawerProps) {
  const { t } = useTranslation('chat');
  const insets = useSafeAreaInsets();
  const progress = useSharedValue(0);
  // Giữ Modal sống thêm một nhịp để animation ĐÓNG chạy hết, thay vì biến mất tức thì.
  const [mounted, setMounted] = useState(visible);
  const mountedRef = useRef(visible);

  // Chạy animation MỞ trong `onShow`, không phải trong effect theo `visible`: view của Modal
  // nằm ở cây native riêng, khởi động sớm hơn thì panel dễ đứng im ở vị trí ban đầu.
  const handleShow = useCallback(() => {
    progress.value = withTiming(1, { duration: DURATION, easing: Easing.out(Easing.cubic) });
  }, [progress]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      // Mở lại khi animation ĐÓNG chưa chạy xong: Modal vẫn đang mount nên `onShow` không bắn
      // lần nữa — phải tự đảo chiều, không thì drawer cứ thế đóng dù người dùng vừa mở.
      if (mountedRef.current) handleShow();
      mountedRef.current = true;
      return;
    }
    progress.value = withTiming(
      0,
      { duration: DURATION, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(setMounted)(false);
      },
    );
  }, [visible, progress, handleShow]);

  useEffect(() => {
    mountedRef.current = mounted;
  }, [mounted]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -DRAWER_WIDTH * (1 - progress.value) }],
  }));

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onShow={handleShow}
      onRequestClose={onClose}
    >
      <Animated.View className="flex-1 bg-black/40" style={backdropStyle}>
        <Pressable
          className="flex-1"
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('history.close')}
        />
      </Animated.View>

      {/* Bo góc PHẢI (mép trong) — mép trái dính cạnh máy nên để vuông. `overflow-hidden`
          là bắt buộc: không có nó thì viền của header và nền dòng đang chọn vẫn vẽ vuông
          tràn ra ngoài bán kính. */}
      <Animated.View
        className="absolute bottom-0 left-0 top-0 overflow-hidden rounded-r-panel bg-surface"
        style={[{ width: DRAWER_WIDTH }, panelStyle]}
      >
        {/* Mức SÀN cho inset, không phải `insets.bottom + n`: máy Android điều hướng bằng nút
            và iPhone SE trả về 0 nên nút sẽ dính sát mép (lỗi đã sửa ở StayPickerSheet). */}
        <View
          className="flex-row items-center justify-between border-b border-hairline/30 px-4 pb-3"
          style={{ paddingTop: Math.max(insets.top, 12) + 4 }}
        >
          <Text bold className="font-bevi-bold text-base text-on-surface">
            {t('history.title')}
          </Text>
          <Pressable
            onPress={onClose}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t('history.close')}
          >
            <Ionicons name="close" size={22} color={GUEST_COLORS.muted} />
          </Pressable>
        </View>

        <FlatList
          className="flex-1"
          data={sessions}
          keyExtractor={(session) => session.id}
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 8, paddingVertical: 8 }}
          renderItem={({ item }) => (
            <ChatSessionRow
              session={item}
              isActive={item.id === activeSessionId}
              disabled={disabled}
              onSelect={onSelect}
              onRequestRename={onRequestRename}
              onRequestDelete={onRequestDelete}
            />
          )}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center gap-2 px-6">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-surface-container">
                <Ionicons name="chatbubbles-outline" size={24} color={GUEST_COLORS.muted} />
              </View>
              <Text bold className="font-bevi-bold text-sm text-on-surface">
                {t('history.empty')}
              </Text>
              <Text size="xs" className="text-center font-bevi text-muted">
                {t('history.emptyHint')}
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />

        <View
          className="border-t border-hairline/30 px-4 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 12) + 4 }}
        >
          <Pressable
            onPress={onNewChat}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={t('history.newChat')}
            className={`min-h-11 flex-row items-center justify-center gap-2 rounded-field border border-hairline/40 bg-surface-low px-4 py-3 ${
              disabled ? 'opacity-40' : ''
            }`}
          >
            <Ionicons name="add" size={18} color={GUEST_COLORS.onSurface} />
            <Text bold className="font-bevi-bold text-sm text-on-surface">
              {t('history.newChat')}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}
