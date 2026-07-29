import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { GUEST_COLORS } from '@/constants/guestTheme';

const MAX_TITLE_LENGTH = 60;

export interface RenameSessionDialogProps {
  visible: boolean;
  initialTitle: string;
  onCancel: () => void;
  onSubmit: (title: string) => void;
}

/**
 * Hộp thoại đổi tên đoạn chat.
 *
 * KHÔNG dùng `Alert.prompt`: hàm đó **chỉ có trên iOS**, trên Android là no-op nên nút "Đổi tên"
 * sẽ im lặng không làm gì. Phải render ở màn chat chứ không lồng trong `Modal` của drawer —
 * hai `Modal` của RN chồng nhau từ cùng một parent không đáng tin trên iOS.
 */
export function RenameSessionDialog({
  visible,
  initialTitle,
  onCancel,
  onSubmit,
}: RenameSessionDialogProps) {
  const { t } = useTranslation(['chat', 'common']);
  const [value, setValue] = useState(initialTitle);

  // Mỗi lần mở lại phải nạp đúng tên của đoạn vừa chọn, không giữ chữ của lần trước.
  useEffect(() => {
    if (visible) setValue(initialTitle);
  }, [visible, initialTitle]);

  function handleSubmit() {
    onSubmit(value.trim());
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        className="flex-1"
        // Android tự co window theo bàn phím (`windowSoftInputMode` mặc định `resize`) —
        // thêm behavior là co hai lần. Cùng luật đã ghi ở `(tabs)/chatbot.tsx`.
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable className="flex-1 items-center justify-center bg-black/40 px-6" onPress={onCancel}>
          {/* Chặn sự kiện chạm lọt xuống backdrop khi bấm vào trong thẻ. */}
          <Pressable
            className="w-full max-w-[420px] gap-3 rounded-panel bg-surface p-5"
            onPress={(event) => event.stopPropagation()}
          >
            <Text bold className="font-bevi-bold text-base text-on-surface">
              {t('chat:history.renameTitle')}
            </Text>

            <TextInput
              className="min-h-11 rounded-field border border-hairline/40 bg-surface-low px-4 py-3 font-bevi text-sm text-on-surface"
              value={value}
              onChangeText={setValue}
              placeholder={t('chat:history.renamePlaceholder')}
              placeholderTextColor={GUEST_COLORS.muted}
              maxLength={MAX_TITLE_LENGTH}
              autoFocus
              selectTextOnFocus
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />

            <View className="flex-row justify-end gap-2">
              <Pressable
                onPress={onCancel}
                accessibilityRole="button"
                className="min-h-11 justify-center rounded-field px-4"
              >
                <Text bold className="font-bevi-bold text-sm text-muted">
                  {t('common:cancel')}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleSubmit}
                accessibilityRole="button"
                className="min-h-11 justify-center rounded-field bg-on-surface px-5"
              >
                <Text bold className="font-bevi-bold text-sm text-white">
                  {t('common:save')}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
