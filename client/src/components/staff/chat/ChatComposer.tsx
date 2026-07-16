import { useEffect, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { Loader2, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  staffReplySchema,
  type StaffReplyFormValues,
} from '@/validations/staff-conversation.validation';

interface ChatComposerProps {
  onSend: (message: string) => Promise<void>;
  isSending: boolean;
  /** Chặn soạn tin khi hội thoại đã đóng (BE từ chối reply hội thoại 'closed'). */
  disabled?: boolean;
  disabledHint?: string;
}

/** Ô soạn trả lời: Enter để gửi, Shift+Enter xuống dòng — giống khung chat của khách. */
export function ChatComposer({
  onSend,
  isSending,
  disabled = false,
  disabledHint,
}: ChatComposerProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<StaffReplyFormValues>({
    resolver: zodResolver(staffReplySchema),
    defaultValues: { message: '' },
  });

  const messageField = register('message');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // `useWatch` (subscription) thay vì `watch()` — bản `watch()` không memoize được nên eslint cảnh báo.
  const value = useWatch({ control, name: 'message' }) ?? '';

  // Tự giãn theo nội dung, tối đa ~5 dòng rồi mới cuộn.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [value]);

  // Khoá ĐỒNG BỘ chống gửi 2 lần. Không dùng được `isSending` (state React) vì hai lời gọi submit rơi
  // vào CÙNG một tick — đã đo thực tế: 2 dòng trong DB cách nhau 1ms — nên state chưa kịp cập nhật.
  const sendingRef = useRef(false);

  const onSubmit = async (values: StaffReplyFormValues) => {
    if (sendingRef.current) return;
    sendingRef.current = true;
    try {
      await onSend(values.message.trim());
      reset();
    } finally {
      sendingRef.current = false;
    }
  };

  if (disabled) {
    return (
      <div className="border-t border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
        {disabledHint ?? 'This conversation is closed.'}
      </div>
    );
  }

  return (
    <div className="border-t border-slate-200 bg-white p-3">
      {/* Tạo handler NGAY LÚC submit (không phải lúc render) để không đọc ref trong render. */}
      <form
        className="space-y-1.5"
        onSubmit={event => void handleSubmit(onSubmit)(event)}
      >
        <div className="flex items-end gap-2">
          <textarea
            {...messageField}
            ref={el => {
              messageField.ref(el);
              textareaRef.current = el;
            }}
            rows={1}
            placeholder="Write a reply to the guest…"
            aria-label="Reply to guest"
            aria-invalid={Boolean(errors.message)}
            onKeyDown={event => {
              // Bộ gõ tiếng Việt (Telex/VNI): Enter khi đang GHÉP CHỮ là để chốt chữ, không phải để
              // gửi. Không chặn thì gõ "xin chào bạn" sẽ gửi rồi reset ô, xong IME mới chốt và nhét
              // lại "bạn" vào ô vừa trống; IME còn bắn 2 keydown (keyCode 229 + Enter thật) nên tin
              // bị gửi 2 lần cách nhau ~1ms — đúng thứ đã đo được trong DB.
              if (event.nativeEvent.isComposing || event.keyCode === 229) {
                return;
              }
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                // requestSubmit() để mọi lần gửi đi qua ĐÚNG MỘT lối là onSubmit của form.
                event.currentTarget.form?.requestSubmit();
              }
            }}
            className="max-h-30 min-w-0 flex-1 resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 aria-invalid:border-rose-400"
          />
          <Button
            type="submit"
            size="icon"
            className="size-10 shrink-0 rounded-full"
            disabled={!value.trim() || isSending}
            aria-label="Send reply"
          >
            {isSending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
        {errors.message && (
          <p className="px-1 text-xs font-medium text-rose-600">
            {errors.message.message}
          </p>
        )}
        <p className="px-1 text-[11px] text-slate-400">
          Enter to send · Shift+Enter for a new line
        </p>
      </form>
    </div>
  );
}
