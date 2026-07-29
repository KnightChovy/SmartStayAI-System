import { Alert, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { GUEST_COLORS } from '@/constants/guestTheme';
import { formatDate, relativeTimeParts } from '@/utils/formatDate';
import type { ChatSession } from '@/types/chatbot.type';

export interface ChatSessionRowProps {
  session: ChatSession;
  isActive: boolean;
  /** AI đang trả lời thì không cho đổi đoạn — chunk sẽ đổ vào tin đã biến mất khỏi màn hình. */
  disabled?: boolean;
  onSelect: (sessionId: string) => void;
  onRequestRename: (session: ChatSession) => void;
  onRequestDelete: (session: ChatSession) => void;
}

/** Một dòng trong danh sách lịch sử: tiêu đề + thời gian tương đối + số tin, kèm menu ⋯. */
export function ChatSessionRow({
  session,
  isActive,
  disabled = false,
  onSelect,
  onRequestRename,
  onRequestDelete,
}: ChatSessionRowProps) {
  const { t } = useTranslation(['chat', 'common']);
  const title = session.title || t('chat:history.untitled');

  const { unit, count } = relativeTimeParts(session.updatedAt);
  const time =
    unit === 'date'
      ? formatDate(new Date(session.updatedAt))
      : t(`chat:history.time.${unit}`, { count });

  /** Một `Alert` thay cho 2 nút phụ trên dòng: cross-platform, không thêm component,
   *  và giữ vùng chạm của dòng đủ 44pt thay vì nhét ba nút cạnh nhau. */
  function openActions() {
    Alert.alert(title, undefined, [
      { text: t('chat:history.rename'), onPress: () => onRequestRename(session) },
      {
        text: t('chat:history.delete'),
        style: 'destructive',
        onPress: () => onRequestDelete(session),
      },
      { text: t('common:cancel'), style: 'cancel' },
    ]);
  }

  return (
    <View
      className={`mb-1 flex-row items-center gap-1 overflow-hidden rounded-field ${
        isActive ? 'bg-surface-container' : ''
      }`}
    >
      {isActive && <View className="h-9 w-[3px] rounded-r bg-bronze" />}

      <Pressable
        onPress={() => onSelect(session.id)}
        onLongPress={openActions}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ selected: isActive, disabled }}
        className={`min-h-11 flex-1 justify-center py-2.5 ${isActive ? 'pl-2' : 'pl-3'} ${
          disabled ? 'opacity-40' : ''
        }`}
      >
        <Text
          size="sm"
          bold={isActive}
          className={`${isActive ? 'font-bevi-bold' : 'font-bevi'} text-on-surface`}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text size="2xs" className="font-bevi text-muted" numberOfLines={1}>
          {time} · {t('chat:history.messages', { count: session.messages.length })}
        </Text>
      </Pressable>

      <Pressable
        onPress={openActions}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={t('chat:history.actions')}
        className="h-11 w-9 items-center justify-center"
      >
        <Ionicons name="ellipsis-horizontal" size={18} color={GUEST_COLORS.muted} />
      </Pressable>
    </View>
  );
}
