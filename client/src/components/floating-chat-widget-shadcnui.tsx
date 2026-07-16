import { useCallback, useEffect, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import type { TFunction } from 'i18next';
import { Bot, Loader2, MessageSquare, Send, Sparkles, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  useMyConversation,
  useSendChatMessage,
  useSendChatMessageStream,
} from '@/hooks/chat';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/authStore';
import type { Message } from '@/types/chat.types';
import { errorMessage } from '@/utils/errorMessage';
import { chatSchema, type ChatFormValues } from '@/validations/chat.validation';

const now = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const containerVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.96,
    transformOrigin: 'bottom right',
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      damping: 24,
      stiffness: 300,
      staggerChildren: 0.04,
    },
  },
  exit: {
    opacity: 0,
    y: 20,
    scale: 0.96,
    transition: {
      duration: 0.18,
    },
  },
};

const messageVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 480, damping: 32 },
  },
};

/**
 * Lời chào + quick reply đều theo ngôn ngữ đang chọn nên phải nhận `t` thay vì hardcode.
 * Quick reply chỉ gợi ý việc trợ lý toàn sàn LÀM ĐƯỢC (tìm khách sạn) — hỏi ngoài phạm vi thì BE
 * được chỉ thị từ chối, mời sẵn câu hỏi như thế chỉ dẫn khách vào ngõ cụt.
 */
const greetingMessage = (t: TFunction<'common'>): Message => ({
  id: 'greeting',
  sender: 'ai',
  text: t('chat.greeting'),
  time: now(),
  quickReplies: [
    t('chat.quick.stays'),
    t('chat.quick.hanoi'),
    t('chat.quick.suggest'),
  ],
});

/**
 * Khung chat nổi ở mọi trang khách — trợ lý **TOÀN SÀN**: tư vấn & tìm/gợi ý khách sạn trên sàn
 * (`POST /conversations/messages` KHÔNG kèm `hotelId`).
 *
 * Cố ý KHÔNG gắn khách sạn nào: nhắn riêng với lễ tân từng khách sạn là việc của
 * `/account/messages`. Trước đây widget tự lấy `hotels[0]` khi khách chưa chọn gì, nên khách hỏi
 * "tìm khách sạn ở Đà Nẵng" lại đang nói chuyện với concierge của một khách sạn ngẫu nhiên.
 *
 * Không có công tắc AI ⇄ Lễ tân ở đây: hội thoại toàn sàn không gắn KS nên không có lễ tân nào để
 * nhận (BE trả 400 nếu cố chuyển). Vì vậy cũng không cần socket — không ai ngoài bot trả lời.
 */
export function FloatingChatWidget() {
  const { t } = useTranslation('common');
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const sendChatMessage = useSendChatMessage();
  const sendChatMessageStream = useSendChatMessageStream();
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string>();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ChatFormValues>({
    resolver: zodResolver(chatSchema),
    defaultValues: { message: '' },
  });
  // `t` đổi mỗi khi người dùng đổi ngôn ngữ. Giữ nó trong ref để effect nạp lại hội thoại KHÔNG
  // phải khai `t` làm dependency — nếu khai, chỉ cần bấm VI⇄EN là hội thoại đang chat bị reset sạch.
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  const [messages, setMessages] = useState<Message[]>([greetingMessage(t)]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const idCounter = useRef(0);
  const makeId = useCallback(() => `m-${(idCounter.current += 1)}`, []);

  const toggleOpen = useCallback(() => setIsOpen(prev => !prev), []);

  // KHÔI PHỤC hội thoại toàn sàn cũ. `conversationId` chỉ nằm trong state nên F5 là mất lịch sử.
  // Khách vãng lai vẫn chat được nhưng BE không định danh được nên không có gì để khôi phục.
  const { data: existingConversation } = useMyConversation(undefined, {
    enabled: isAuthenticated,
  });
  // Chỉ nạp MỘT LẦN, nếu không mỗi lần query refetch (vd focus lại tab) sẽ ghi đè lên các tin vừa nhắn.
  const hydrated = useRef(false);

  useEffect(() => {
    if (!existingConversation || hydrated.current) return;
    hydrated.current = true;

    setConversationId(existingConversation.id);
    setMessages([
      greetingMessage(tRef.current),
      ...existingConversation.messages.map<Message>(item => ({
        id: item.id,
        sender: item.senderType === 'user' ? 'user' : 'ai',
        text: item.content,
        time: new Date(item.createdAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      })),
    ]);
  }, [existingConversation]);

  // Cuộn TRỰC TIẾP khung tin nhắn thay vì scrollIntoView: hàm đó cuộn mọi khung cuộn tổ tiên, kể cả
  // cả TRANG — widget nổi ở góc màn hình mà lại kéo trang phía sau tụt xuống mỗi lần có tin mới.
  useEffect(() => {
    const thread = messagesEndRef.current;
    if (isOpen && thread) {
      thread.scrollTo({ top: thread.scrollHeight, behavior: 'smooth' });
    }
  }, [isOpen, messages, isTyping]);

  const sendText = async (raw: string) => {
    const text = raw.trim();
    if (!text || isTyping) return;

    setMessages(prev => [
      ...prev,
      { id: makeId(), sender: 'user', text, time: now() },
    ]);
    setIsTyping(true);

    const aiId = makeId();
    const aiTime = now();
    // Cập nhật bong bóng AI theo `aiId`, KHÔNG theo vị trí cuối mảng: updater của setState có thể
    // chạy 2 lần (StrictMode) và nhánh "sửa tin cuối" từng ghi đè nhầm lên chính tin của khách.
    const updateAi = (fullText: string, isComplete = false) => {
      setMessages(prev => {
        if (!prev.some(item => item.id === aiId)) {
          return [
            ...prev,
            {
              id: aiId,
              sender: 'ai',
              text: fullText,
              time: aiTime,
              quickReplies: isComplete
                ? greetingMessage(t).quickReplies
                : undefined,
            },
          ];
        }
        return prev.map(item =>
          item.id === aiId
            ? {
                ...item,
                text: fullText,
                quickReplies: isComplete
                  ? greetingMessage(t).quickReplies
                  : undefined,
              }
            : item
        );
      });
    };

    try {
      try {
        // `hotelId` bỏ trống = trợ lý toàn sàn.
        const result = await sendChatMessageStream.mutateAsync({
          payload: { conversationId, message: text },
          handlers: {
            onConversationId: setConversationId,
            onChunk: (_chunk, fullText) => updateAi(fullText),
          },
        });
        if (result.conversationId) {
          setConversationId(result.conversationId);
        }
        if (result.reply.trim()) {
          updateAi(result.reply, true);
        } else {
          // Stream xong nhưng không có reply tổng hợp — gắn quick replies vào tin đã stream.
          setMessages(prev =>
            prev.map(item =>
              item.id === aiId
                ? { ...item, quickReplies: greetingMessage(t).quickReplies }
                : item
            )
          );
        }
      } catch (streamErr) {
        // Stream lỗi → thử endpoint không stream, tái dùng đúng bong bóng AI.
        try {
          const fallback = await sendChatMessage.mutateAsync({
            conversationId,
            message: text,
          });
          setConversationId(fallback.conversationId);
          updateAi(fallback.reply, true);
        } catch {
          throw streamErr;
        }
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: makeId(),
          sender: 'ai',
          text: errorMessage(err, t('chat.error')),
          time: now(),
          quickReplies: greetingMessage(t).quickReplies,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const latestMessageIndex = messages.length - 1;
  const messageValue = watch('message');
  const isSendDisabled = !messageValue.trim() || isTyping;

  const messageField = register('message');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Tự giãn chiều cao theo nội dung (như ô nhập Messenger), giới hạn ~5 dòng rồi scroll.
  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  // Đồng bộ chiều cao khi giá trị đổi (gõ, dán, hoặc reset sau khi gửi).
  useEffect(() => {
    resizeTextarea();
  }, [messageValue, resizeTextarea]);

  // Khoá ĐỒNG BỘ chống gửi 2 lần: hai lời gọi submit có thể rơi vào CÙNG một tick nên cờ `isTyping`
  // (state React) chưa kịp cập nhật để chặn.
  const sendingRef = useRef(false);

  // Handler này phải ĐỒNG BỘ. Nếu để `async` và await sendText, react-hook-form sẽ giữ trạng thái
  // submit suốt cả lượt stream (vài giây) rồi cập nhật lại formState khi xong, làm mất tác dụng của
  // `reset()` gọi giữa chừng ⇒ chữ đã gửi vẫn nằm lại trong ô nhập. Reset trước, thả sendText chạy nền.
  const onSubmit = (values: ChatFormValues) => {
    if (sendingRef.current) return;
    sendingRef.current = true;
    reset();
    void sendText(values.message).finally(() => {
      sendingRef.current = false;
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-window"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-[min(calc(100vw-2rem),400px)] overflow-hidden rounded-2xl border border-border/50 bg-background/85 shadow-2xl backdrop-blur-xl ring-1 ring-white/20"
          >
            <div className="relative overflow-hidden border-b border-border/40 bg-muted/40 p-4">
              <div className="absolute inset-0 bg-linear-to-br from-primary/12 via-ai-glow/15 to-premium-gold/10" />
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-emerald-500" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-foreground">
                      SmartStay AI
                    </h3>
                    <p className="truncate text-xs text-muted-foreground">
                      {t('chat.subtitle')}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-full hover:bg-background/60"
                  onClick={() => setIsOpen(false)}
                  aria-label={t('chat.close')}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
              <div
                ref={messagesEndRef}
                className="flex h-90 flex-col gap-4 overflow-y-auto bg-background/55 p-4"
              >
                {messages.map((item, index) => {
                  const isAi = item.sender === 'ai';
                  const isGuest = item.sender === 'user';

                  return (
                    <motion.div
                      key={item.id ?? `${item.sender}-${index}-${item.time}`}
                      variants={messageVariants}
                      className={cn(
                        'flex gap-3',
                        isGuest && 'flex-row-reverse self-end'
                      )}
                    >
                      {!isGuest && (
                        <Avatar className="h-8 w-8 shrink-0 border border-border/40 shadow-sm">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            <Sparkles className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={cn(
                          'flex max-w-[85%] flex-col gap-1',
                          isGuest && 'items-end'
                        )}
                      >
                        {!isGuest && (
                          <span className="text-xs font-medium text-muted-foreground">
                            SmartStay AI
                          </span>
                        )}
                        <div
                          className={cn(
                            'rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm',
                            isGuest &&
                              'rounded-tr-none bg-primary text-primary-foreground',
                            isAi &&
                              'rounded-tl-none border border-border/30 bg-muted/60 text-foreground'
                          )}
                        >
                          <p className="whitespace-pre-wrap wrap-break-word">
                            {item.text}
                          </p>
                        </div>

                        {isAi &&
                          index === latestMessageIndex &&
                          item.quickReplies &&
                          item.quickReplies.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {item.quickReplies.map(quickReply => (
                                <button
                                  key={quickReply}
                                  type="button"
                                  onClick={() => void sendText(quickReply)}
                                  className="rounded-full border border-primary/25 bg-primary/5 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                                >
                                  {quickReply}
                                </button>
                              ))}
                            </div>
                          )}

                        <span className="text-[10px] text-muted-foreground/70">
                          {item.time}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}

                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3"
                  >
                    <Avatar className="h-8 w-8 shrink-0 border border-border/40 shadow-sm">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <Sparkles className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex w-16 items-center justify-center gap-1 rounded-2xl rounded-tl-none border border-border/30 bg-muted/60 px-4 py-3 shadow-sm">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/50 [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/50 [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/50" />
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="border-t border-border/40 bg-background/80 p-3 backdrop-blur-md">
                <form className="space-y-1.5" onSubmit={handleSubmit(onSubmit)}>
                  <div className="relative flex items-end gap-2">
                    <textarea
                      {...messageField}
                      ref={el => {
                        messageField.ref(el);
                        textareaRef.current = el;
                      }}
                      rows={1}
                      placeholder={t('chat.placeholder')}
                      aria-invalid={Boolean(errors.message)}
                      onChange={event => {
                        void messageField.onChange(event);
                        resizeTextarea();
                      }}
                      onKeyDown={event => {
                        // Bộ gõ tiếng Việt (Telex/VNI): Enter khi đang GHÉP CHỮ là để chốt chữ, không
                        // phải để gửi. Không chặn thì gõ "xin chào bạn" sẽ gửi rồi reset ô, xong IME
                        // mới chốt và nhét lại "bạn" vào ô vừa trống; IME còn bắn 2 keydown
                        // (keyCode 229 + Enter thật) nên tin bị gửi 2 lần cách nhau ~1ms.
                        if (
                          event.nativeEvent.isComposing ||
                          event.keyCode === 229
                        ) {
                          return;
                        }
                        // Enter để gửi, Shift+Enter để xuống dòng (giống Messenger).
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault();
                          // requestSubmit() để mọi lần gửi đi qua ĐÚNG MỘT lối (onSubmit của form).
                          event.currentTarget.form?.requestSubmit();
                        }
                      }}
                      className="min-w-0 max-h-30 flex-1 resize-none rounded-2xl border border-border/50 bg-background/70 px-4 py-2.5 text-sm leading-relaxed outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-primary/10 aria-invalid:border-destructive/60"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className="h-10 w-10 shrink-0 rounded-full shadow-lg transition-transform hover:scale-105"
                      disabled={isSendDisabled}
                      aria-label={t('chat.send')}
                    >
                      {isTyping ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {errors.message && (
                    <p className="px-4 text-xs font-medium text-destructive">
                      {errors.message.message}
                    </p>
                  )}
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleOpen}
        className={cn(
          'group relative flex h-14 w-14 cursor-pointer items-center justify-center rounded-full shadow-2xl transition-all duration-300',
          isOpen
            ? 'rotate-90 bg-destructive text-destructive-foreground'
            : 'bg-primary text-primary-foreground hover:shadow-primary/25'
        )}
        aria-label={isOpen ? t('chat.close') : t('chat.open')}
      >
        <span className="absolute inset-0 -z-10 rounded-full bg-inherit opacity-20 blur-xl transition-opacity duration-300 group-hover:opacity-40" />
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <MessageSquare className="h-6 w-6" />
        )}
      </motion.button>
    </div>
  );
}

export default FloatingChatWidget;
