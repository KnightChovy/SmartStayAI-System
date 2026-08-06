import { Headset, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';
import type { ConversationMode } from '@/types/chat.types';

interface ConversationModeToggleProps {
  /** Chế độ đang chạy — suy từ cờ `handoff` của BE, KHÔNG suy từ `status` (xem `ConversationHandoffState`). */
  isHandoff: boolean;
  onChange: (mode: ConversationMode) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Công tắc "khách muốn ai trả lời mình": trợ lý AI hay lễ tân người thật
 * (`PATCH /conversations/:id/mode`). Dùng chung cho khung chat nổi và `/account/messages` để hai
 * nơi không trôi lệch nhau về nhãn lẫn trạng thái.
 *
 * CHỈ dùng được cho hội thoại gắn khách sạn: hội thoại toàn sàn không có lễ tân nào phụ trách nên
 * BE trả 400 (`Cuộc trò chuyện này không gắn khách sạn nào…`).
 */
export function ConversationModeToggle({
  isHandoff,
  onChange,
  disabled = false,
  className,
}: ConversationModeToggleProps) {
  const { t } = useTranslation('common');
  const current: ConversationMode = isHandoff ? 'human' : 'ai';

  const options = [
    { mode: 'ai', label: t('chat.ai'), Icon: Sparkles },
    { mode: 'human', label: t('chat.frontDesk'), Icon: Headset },
  ] as const;

  return (
    <div
      className={cn(
        'flex rounded-full border border-outline-variant/40 bg-surface-container-low p-0.5',
        className
      )}
    >
      {options.map(({ mode, label, Icon }) => {
        const isActive = current === mode;
        return (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            disabled={disabled}
            aria-pressed={isActive}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60',
              isActive
                ? mode === 'human'
                  ? 'bg-emerald-500/15 text-emerald-700'
                  : 'bg-surface text-on-surface shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            )}
          >
            <Icon className="size-3" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
