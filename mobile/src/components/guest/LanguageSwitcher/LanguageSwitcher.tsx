import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { changeLanguage, SUPPORTED_LANGUAGES, type AppLanguage } from '@/i18n';

const LABELS: Record<AppLanguage, string> = { en: 'EN', vi: 'VI' };

interface LanguageSwitcherProps {
  /** `light` cho nền tối (ảnh hero), `dark` cho nền sáng. */
  tone?: 'light' | 'dark';
  className?: string;
}

/**
 * Nút chuyển EN/VI dạng segmented — cùng vai trò `LanguageSwitcher` bên client.
 * Lựa chọn được ghi nhớ qua AsyncStorage nên mở lại app vẫn đúng ngôn ngữ.
 */
export function LanguageSwitcher({ tone = 'dark', className }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const current = i18n.resolvedLanguage;

  return (
    <View
      className={cn(
        'flex-row items-center rounded-full p-0.5',
        tone === 'light' ? 'border border-white/25 bg-white/15' : 'border border-hairline/50 bg-surface-low',
        className
      )}
    >
      {SUPPORTED_LANGUAGES.map(lang => {
        const active = current === lang;
        return (
          <Pressable
            key={lang}
            onPress={() => changeLanguage(lang)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            // Chiều cao 32 + hitSlop cho đủ vùng chạm mà không làm nút phình to.
            hitSlop={6}
            className={cn(
              'h-8 min-w-[38px] items-center justify-center rounded-full px-2.5',
              active && (tone === 'light' ? 'bg-white' : 'bg-on-surface')
            )}
          >
            <Text
              className={cn(
                'font-bevi-bold tracking-[1px]',
                active
                  ? tone === 'light'
                    ? 'text-on-surface'
                    : 'text-white'
                  : tone === 'light'
                    ? 'text-white'
                    : 'text-on-surface-variant'
              )}
              size="xs"
            >
              {LABELS[lang]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
