import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { Bot, Building2, Loader2, MessageSquare, Send, Sparkles, X } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useSendChatMessage, useSendChatMessageStream } from '@/hooks/chat';
import { useSearchHotels } from '@/hooks/hotels';
import { cn } from '@/lib/cn';
import { chatService } from '@/services/chat.service';
import { useAuthStore } from '@/stores/authStore';
import type { Message } from '@/types/chat.types';
import { errorMessage } from '@/utils/errorMessage';
import { formatCurrency } from '@/utils/formatCurrency';
import { chatSchema, type ChatFormValues } from '@/validations/chat.validation';

const initialQuickReplies = [
  'Stays in Da Nang',
  'Weekend deals',
  'My loyalty points',
];
const hotelQuickReplies = [
  'Check room availability',
  'Hotel amenities',
  'Booking status',
];

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

const greetingMessage = (): Message => ({
  id: 'greeting',
  sender: 'ai',
  text: "Good evening. I'm your SmartStay AI concierge. Pick a hotel below or tell me a destination and I'll help you.",
  time: now(),
  quickReplies: initialQuickReplies,
});

export function FloatingChatWidget() {
  const { hotelId: routeHotelId } = useParams<{ hotelId?: string }>();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const sendChatMessage = useSendChatMessage();
  const sendChatMessageStream = useSendChatMessageStream();
  const { data: hotelsData } = useSearchHotels({ limit: 50 });
  const hotels = hotelsData?.results ?? [];
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHotelId, setSelectedHotelId] = useState<string>();
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
  const [messages, setMessages] = useState<Message[]>([greetingMessage()]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const idCounter = useRef(0);
  const makeId = useCallback(() => `m-${(idCounter.current += 1)}`, []);

  // Chatbot gắn theo từng khách sạn (backend yêu cầu hotelId). Ưu tiên hotel chọn
  // từ thanh chip, rồi tới hotel trên URL (trang chi tiết), cuối cùng là hotel đầu tiên.
  const activeHotelId = selectedHotelId ?? routeHotelId ?? hotels[0]?.id;
  const activeHotel = hotels.find(hotel => hotel.id === activeHotelId);

  const toggleOpen = useCallback(() => setIsOpen(prev => !prev), []);

  // Đổi khách sạn → reset hội thoại + lời chào (giống "clearChat" bên mobile).
  useEffect(() => {
    setConversationId(undefined);
    setMessages([greetingMessage()]);
  }, [activeHotelId]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages, isTyping]);

  const handleSelectHotel = (hotelId: string) => {
    if (hotelId === activeHotelId || isTyping) return;
    setSelectedHotelId(hotelId);
  };

  const sendText = async (raw: string) => {
    const text = raw.trim();
    if (!text || isTyping) return;

    setMessages(prev => [
      ...prev,
      { id: makeId(), sender: 'user', text, time: now() },
    ]);
    setIsTyping(true);

    try {
      if (activeHotelId) {
        if (!isAuthenticated) {
          setMessages(prev => [
            ...prev,
            {
              id: makeId(),
              sender: 'ai',
              text: 'Please sign in to chat with this hotel concierge. After signing in, I can help with rooms, amenities, and booking status.',
              time: now(),
              quickReplies: initialQuickReplies,
            },
          ]);
          return;
        }

        // Một id ổn định cho bong bóng AI. Updater dưới đây thuần (quyết định
        // append/update từ chính `prev`), nên React gọi 2 lần (StrictMode) vẫn đúng
        // và không bao giờ ghi đè tin nhắn của user.
        const aiId = makeId();
        const aiTime = now();
        const updateAi = (fullText: string, isComplete = false) => {
          setMessages(prev => {
            const exists = prev.some(item => item.id === aiId);
            if (!exists) {
              return [
                ...prev,
                {
                  id: aiId,
                  sender: 'ai',
                  text: fullText,
                  time: aiTime,
                  quickReplies: isComplete ? hotelQuickReplies : undefined,
                },
              ];
            }
            return prev.map(item =>
              item.id === aiId
                ? {
                    ...item,
                    text: fullText,
                    quickReplies: isComplete ? hotelQuickReplies : undefined,
                  }
                : item
            );
          });
        };

        try {
          const result = await sendChatMessageStream.mutateAsync({
            payload: {
              hotelId: activeHotelId,
              conversationId,
              message: text,
            },
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
                  ? { ...item, quickReplies: hotelQuickReplies }
                  : item
              )
            );
          }
          return;
        } catch (streamErr) {
          // Stream lỗi → thử endpoint không stream, tái dùng đúng bong bóng AI.
          try {
            const fallback = await sendChatMessage.mutateAsync({
              hotelId: activeHotelId,
              conversationId,
              message: text,
            });
            setConversationId(fallback.conversationId);
            updateAi(fallback.reply, true);
            return;
          } catch {
            throw streamErr;
          }
        }
      }

      const reply = await chatService.reply(text);
      setMessages(prev => [
        ...prev,
        {
          id: makeId(),
          sender: 'ai',
          text: reply.text,
          time: now(),
          recommendations: reply.recommendations,
          quickReplies: reply.quickReplies,
        },
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: makeId(),
          sender: 'ai',
          text: errorMessage(
            err,
            'Sorry, I could not reach the concierge right now. Please try again.'
          ),
          time: now(),
          quickReplies: activeHotelId ? hotelQuickReplies : initialQuickReplies,
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

  const onSubmit = (values: ChatFormValues) => {
    void sendText(values.message);
    reset();
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
            className="w-[min(calc(100vw-2rem),380px)] overflow-hidden rounded-2xl border border-border/50 bg-background/85 shadow-2xl backdrop-blur-xl ring-1 ring-white/20"
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
                      {activeHotel
                        ? activeHotel.name
                        : 'Digital concierge online'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-full hover:bg-background/60"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close chat"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {hotels.length > 0 && (
              <div className="border-b border-border/40 bg-background/70 px-3 py-2">
                <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                  {hotels.map(hotel => {
                    const isActiveHotel = hotel.id === activeHotelId;
                    return (
                      <button
                        key={hotel.id}
                        type="button"
                        onClick={() => handleSelectHotel(hotel.id)}
                        disabled={isTyping}
                        title={hotel.name}
                        className={cn(
                          'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-60',
                          isActiveHotel
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border/50 bg-background/80 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                        )}
                      >
                        <Building2 className="h-3 w-3 shrink-0" />
                        <span className="max-w-32 truncate">{hotel.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex h-90 flex-col gap-4 overflow-y-auto bg-background/55 p-4">
              {messages.map((item, index) => {
                const isAi = item.sender === 'ai';

                return (
                  <motion.div
                    key={item.id ?? `${item.sender}-${index}-${item.time}`}
                    variants={messageVariants}
                    className={cn(
                      'flex gap-3',
                      !isAi && 'flex-row-reverse self-end'
                    )}
                  >
                    {isAi && (
                      <Avatar className="h-8 w-8 shrink-0 border border-border/40 shadow-sm">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <Sparkles className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        'flex max-w-[85%] flex-col gap-1',
                        !isAi && 'items-end'
                      )}
                    >
                      {isAi && (
                        <span className="text-xs font-medium text-muted-foreground">
                          SmartStay AI
                        </span>
                      )}
                      <div
                        className={cn(
                          'rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm',
                          isAi
                            ? 'rounded-tl-none border border-border/30 bg-muted/60 text-foreground'
                            : 'rounded-tr-none bg-primary text-primary-foreground'
                        )}
                      >
                        <p>{item.text}</p>

                        {item.recommendations &&
                          item.recommendations.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {item.recommendations.map(recommendation => (
                                <Link
                                  key={recommendation.id}
                                  to={`/hotels/${recommendation.id}`}
                                  onClick={() => setIsOpen(false)}
                                  className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/80 p-2 text-foreground transition-colors hover:border-primary/40 hover:bg-background"
                                >
                                  {recommendation.imageUrl ? (
                                    <img
                                      src={recommendation.imageUrl}
                                      alt={recommendation.name}
                                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                      <Bot className="h-4 w-4" />
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-semibold">
                                      {recommendation.name}
                                    </p>
                                    <p className="truncate text-[11px] text-muted-foreground">
                                      {recommendation.city}
                                    </p>
                                    {recommendation.minPrice && (
                                      <p className="text-[11px] font-semibold text-primary">
                                        from{' '}
                                        {formatCurrency(
                                          recommendation.minPrice
                                        )}
                                      </p>
                                    )}
                                  </div>
                                </Link>
                              ))}
                            </div>
                          )}
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
                                onClick={() => sendText(quickReply)}
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
              <div ref={messagesEndRef} />
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
                    placeholder="Ask for stays, deals, or loyalty..."
                    aria-invalid={Boolean(errors.message)}
                    onChange={event => {
                      void messageField.onChange(event);
                      resizeTextarea();
                    }}
                    onKeyDown={event => {
                      // Enter để gửi, Shift+Enter để xuống dòng (giống Messenger).
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        void handleSubmit(onSubmit)();
                      }
                    }}
                    className="min-w-0 max-h-30 flex-1 resize-none rounded-2xl border border-border/50 bg-background/70 px-4 py-2.5 text-sm leading-relaxed outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-primary/10 aria-invalid:border-destructive/60"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="h-10 w-10 shrink-0 rounded-full shadow-lg transition-transform hover:scale-105"
                    disabled={isSendDisabled}
                    aria-label="Send message"
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
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
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
