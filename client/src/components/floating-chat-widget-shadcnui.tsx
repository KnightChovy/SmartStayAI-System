import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import type { TFunction } from 'i18next';
import {
  Bot,
  Building2,
  Headset,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  useConversationSocket,
  useMyConversation,
  useMyConversations,
  useSendChatMessage,
  useSendChatMessageStream,
  useSetConversationMode,
} from '@/hooks/chat';
import { useSearchHotels } from '@/hooks/hotels';
import { cn } from '@/lib/cn';
import { chatService } from '@/services/chat.service';
import { useAuthStore } from '@/stores/authStore';
import type {
  ConversationHandoffState,
  ConversationMode,
  ConversationSocketMessage,
  Message,
} from '@/types/chat.types';
import { errorMessage } from '@/utils/errorMessage';
import { formatCurrency } from '@/utils/formatCurrency';
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

/** Chữ cái đầu của tên khách sạn cho avatar khi KS chưa có ảnh (tối đa 2 ký tự). */
const hotelInitials = (name: string): string => {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

/** Lời chào + quick reply đều theo ngôn ngữ đang chọn nên phải nhận `t` thay vì hardcode. */
const greetingMessage = (t: TFunction<'common'>): Message => ({
  id: 'greeting',
  sender: 'ai',
  text: t('chat.greeting'),
  time: now(),
  quickReplies: [
    t('chat.quick.stays'),
    t('chat.quick.deals'),
    t('chat.quick.loyalty'),
  ],
});

export function FloatingChatWidget() {
  const { t } = useTranslation('common');
  const { hotelId: routeHotelId } = useParams<{ hotelId?: string }>();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const sendChatMessage = useSendChatMessage();
  const sendChatMessageStream = useSendChatMessageStream();
  const setConversationMode = useSetConversationMode();
  const { data: hotelsData } = useSearchHotels({ limit: 50 });
  const hotels = hotelsData?.results ?? [];
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHotelId, setSelectedHotelId] = useState<string>();
  // Danh sách "đã nhắn với khách sạn nào" cho thanh bên (chỉ khách đã đăng nhập mới có).
  const { data: myConversationsData } = useMyConversations(isAuthenticated);
  const myConversations = useMemo(
    () => myConversationsData ?? [],
    [myConversationsData]
  );
  const [showHotelPicker, setShowHotelPicker] = useState(false);
  // Quick reply gợi ý sau khi đã chọn khách sạn — dịch theo ngôn ngữ đang chọn.
  const hotelQuickReplies = useMemo(
    () => [
      t('chat.quick.availability'),
      t('chat.quick.amenities'),
      t('chat.quick.bookingStatus'),
    ],
    [t]
  );
  const [conversationId, setConversationId] = useState<string>();
  // Người thật đang cầm hội thoại? Luôn lấy từ cờ `handoff` của BE — không tự suy từ `status`, vì sau
  // khi nhân viên trả lời status quay về 'active' nhưng bot vẫn im.
  const [isHandoff, setIsHandoff] = useState(false);
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
  // `t` đổi mỗi khi người dùng đổi ngôn ngữ. Giữ nó trong ref để 2 effect bên dưới (reset khi đổi
  // khách sạn / nạp lại hội thoại) KHÔNG phải khai `t` làm dependency — nếu khai, chỉ cần bấm VI⇄EN
  // là hội thoại đang chat bị reset sạch về lời chào.
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  const [messages, setMessages] = useState<Message[]>([greetingMessage(t)]);
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
    setIsHandoff(false);
    setMessages([greetingMessage(tRef.current)]);
    // Xoá dấu đã-nạp để hội thoại của khách sạn MỚI (kể cả khi quay lại khách sạn cũ) được nạp lại.
    // Thiếu dòng này thì đi A → B → A sẽ mất hội thoại của A: ở B không có hội thoại nên hàm nạp
    // return sớm, dấu vẫn kẹt ở 'A', nên lúc quay về A nó tưởng đã nạp rồi và bỏ qua — chỉ F5 mới hiện lại.
    hydratedHotelId.current = undefined;
  }, [activeHotelId]);

  // KHÔI PHỤC hội thoại cũ. `conversationId` chỉ nằm trong state nên F5 là mất; không có bước này,
  // khách không join lại được room socket ⇒ lễ tân trả lời mà khách không bao giờ thấy.
  const { data: existingConversation } = useMyConversation(
    isAuthenticated ? activeHotelId : undefined
  );
  // Chỉ nạp MỘT LẦN cho mỗi khách sạn, nếu không mỗi lần query refetch (vd focus lại tab) sẽ ghi đè
  // lên các tin vừa nhắn trong phiên.
  const hydratedHotelId = useRef<string>(undefined);

  useEffect(() => {
    if (!activeHotelId || !existingConversation) return;
    // Chốt an toàn khi đổi KS nhanh: bỏ qua dữ liệu về muộn của khách sạn khác.
    if (existingConversation.hotelId !== activeHotelId) return;
    if (hydratedHotelId.current === activeHotelId) return;
    hydratedHotelId.current = activeHotelId;

    setConversationId(existingConversation.id);
    setIsHandoff(existingConversation.handoff);
    setMessages([
      greetingMessage(tRef.current),
      ...existingConversation.messages.map<Message>(item => ({
        id: item.id,
        sender:
          item.senderType === 'user'
            ? 'user'
            : item.senderType === 'staff'
              ? 'staff'
              : 'ai',
        text: item.content,
        time: new Date(item.createdAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      })),
    ]);
  }, [activeHotelId, existingConversation]);

  // Tin nhắn đẩy về real-time (chủ yếu là câu trả lời của lễ tân sau khi hội thoại được bàn giao).
  const handleSocketMessage = useCallback(
    (message: ConversationSocketMessage) => {
      // Tin của chính khách bị dội ngược về (BE đẩy vào room để nhân viên thấy) — bỏ qua, bong bóng
      // đã được render lạc quan ngay lúc bấm gửi.
      if (message.senderType === 'user') return;

      setMessages(prev => {
        // Chống trùng: id server là UUID, không đụng id cục bộ dạng 'm-N'.
        if (prev.some(item => item.id === message.id)) return prev;
        return [
          ...prev,
          {
            id: message.id,
            sender: message.senderType === 'staff' ? 'staff' : 'ai',
            text: message.content,
            time: new Date(message.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          },
        ];
      });
    },
    []
  );

  useConversationSocket({ conversationId, onMessage: handleSocketMessage });

  // Cuộn TRỰC TIẾP khung tin nhắn thay vì scrollIntoView: hàm đó cuộn mọi khung cuộn tổ tiên, kể cả
  // cả TRANG — widget nổi ở góc màn hình mà lại kéo trang phía sau tụt xuống mỗi lần có tin mới.
  useEffect(() => {
    const thread = messagesEndRef.current;
    if (isOpen && thread) {
      thread.scrollTo({ top: thread.scrollHeight, behavior: 'smooth' });
    }
  }, [isOpen, messages, isTyping]);

  const handleSelectHotel = (hotelId: string) => {
    if (hotelId === activeHotelId || isTyping) return;
    setSelectedHotelId(hotelId);
  };

  const applyHandoff = (state: ConversationHandoffState) =>
    setIsHandoff(state.handoff);

  // Khách gạt công tắc AI ⇄ Người thật. Cần có hội thoại rồi mới đổi được nên công tắc chỉ hiện sau
  // lượt chat đầu tiên. Hội thoại giữ nguyên ⇒ lịch sử KHÔNG mất khi gạt qua lại.
  const handleSetMode = async (mode: ConversationMode) => {
    if (!conversationId || isTyping || setConversationMode.isPending) return;
    if (mode === (isHandoff ? 'human' : 'ai')) return; // đang ở chế độ đó rồi
    try {
      const result = await setConversationMode.mutateAsync({
        conversationId,
        mode,
        reason: mode === 'human' ? 'Khách yêu cầu gặp nhân viên' : undefined,
      });
      applyHandoff(result);
      // Dòng "[Hệ thống] …" do BE tạo sẽ tự về qua socket, không cần tự chèn ở đây.
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: makeId(),
          sender: 'ai',
          text: errorMessage(err, t('chat.switchError')),
          time: now(),
        },
      ]);
    }
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
              text: t('chat.signInPrompt'),
              time: now(),
              quickReplies: greetingMessage(t).quickReplies,
            },
          ]);
          return;
        }

        // ĐANG BÀN GIAO NGƯỜI THẬT: vẫn phải POST để tin được lưu + đẩy tới lễ tân, nhưng bot chỉ
        // trả về đúng một dòng báo chờ soạn sẵn — render nó mỗi lượt là lặp vô nghĩa (banner phía
        // dưới đã nói rồi). Câu trả lời thật của nhân viên sẽ về qua socket.
        if (isHandoff) {
          const result = await sendChatMessage.mutateAsync({
            hotelId: activeHotelId,
            conversationId,
            message: text,
          });
          setConversationId(result.conversationId);
          applyHandoff(result);
          // Nhân viên vừa đóng hội thoại ⇒ bot trả lời lại: lúc này reply là câu thật, phải hiện.
          if (!result.handoff && result.reply.trim()) {
            setMessages(prev => [
              ...prev,
              {
                id: makeId(),
                sender: 'ai',
                text: result.reply,
                time: now(),
                quickReplies: hotelQuickReplies,
              },
            ]);
          }
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
              onHandoffState: applyHandoff,
            },
          });
          if (result.conversationId) {
            setConversationId(result.conversationId);
          }
          // Bot có thể đã tự bàn giao cho lễ tân ngay trong lượt này (tool escalate_to_staff).
          applyHandoff(result);
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
            applyHandoff(fallback);
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
          text: errorMessage(err, t('chat.error')),
          time: now(),
          quickReplies: activeHotelId
            ? hotelQuickReplies
            : greetingMessage(t).quickReplies,
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
            className="w-[min(calc(100vw-2rem),460px)] overflow-hidden rounded-2xl border border-border/50 bg-background/85 shadow-2xl backdrop-blur-xl ring-1 ring-white/20"
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
                        : t('chat.subtitle')}
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

            {/* Chọn khách sạn MỚI để bắt đầu chat. Ẩn mặc định cho đỡ rối — thanh bên đã lo việc quay
                lại các hội thoại cũ; chỉ bung ra khi khách bấm "+" (hoặc khi chưa nhắn với ai). */}
            {hotels.length > 0 && showHotelPicker && (
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

            <div className="flex">
              {/* THANH BÊN kiểu Messenger: các khách sạn khách đã nhắn. Chỉ hiện khi có hội thoại —
                  khách vãng lai không định danh được nên BE trả mảng rỗng và thanh này tự ẩn. */}
              {myConversations.length > 0 && (
                <aside className="flex w-26 shrink-0 flex-col border-r border-border/40 bg-background/70">
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {t('chat.chats')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowHotelPicker(prev => !prev)}
                      aria-label={t('chat.newChat')}
                      aria-expanded={showHotelPicker}
                      className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="h-90 overflow-y-auto pb-1">
                    {myConversations.map(item => {
                      const isActiveChat = item.hotelId === activeHotelId;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectHotel(item.hotelId)}
                          disabled={isTyping}
                          title={`${item.hotel.name} — ${item.lastMessage ?? ''}`}
                          className={cn(
                            'flex w-full flex-col items-center gap-1 px-1.5 py-2 text-center transition-colors disabled:opacity-60',
                            isActiveChat ? 'bg-muted/70' : 'hover:bg-muted/40'
                          )}
                        >
                          <span className="relative">
                            {item.hotel.imageUrl ? (
                              <img
                                src={item.hotel.imageUrl}
                                alt={item.hotel.name}
                                className={cn(
                                  'h-9 w-9 rounded-full object-cover',
                                  isActiveChat && 'ring-2 ring-primary'
                                )}
                              />
                            ) : (
                              <span
                                className={cn(
                                  'flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary',
                                  isActiveChat && 'ring-2 ring-primary'
                                )}
                              >
                                {hotelInitials(item.hotel.name)}
                              </span>
                            )}
                            {/* Chấm xanh = đang chờ/đang nói chuyện với lễ tân người thật. */}
                            {item.handoff && (
                              <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-background bg-emerald-500">
                                <Headset className="h-1.5 w-1.5 text-white" />
                              </span>
                            )}
                          </span>
                          <span
                            className={cn(
                              'line-clamp-2 text-[10px] leading-tight',
                              isActiveChat
                                ? 'font-semibold text-foreground'
                                : 'text-muted-foreground'
                            )}
                          >
                            {item.hotel.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </aside>
              )}

              <div className="flex min-w-0 flex-1 flex-col">
            <div
              ref={messagesEndRef}
              className="flex h-90 flex-col gap-4 overflow-y-auto bg-background/55 p-4"
            >
              {messages.map((item, index) => {
                const isAi = item.sender === 'ai';
                const isStaff = item.sender === 'staff';
                // AI và lễ tân đều đứng bên trái; chỉ tin của khách mới lật sang phải.
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
                        <AvatarFallback
                          className={cn(
                            isStaff
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : 'bg-primary/10 text-primary'
                          )}
                        >
                          {isStaff ? (
                            <Headset className="h-4 w-4" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
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
                        <span
                          className={cn(
                            'text-xs font-medium',
                            isStaff
                              ? 'text-emerald-600'
                              : 'text-muted-foreground'
                          )}
                        >
                          {isStaff
                            ? (activeHotel?.name ?? 'Hotel staff')
                            : 'SmartStay AI'}
                        </span>
                      )}
                      <div
                        className={cn(
                          'rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm',
                          isGuest &&
                            'rounded-tr-none bg-primary text-primary-foreground',
                          isAi &&
                            'rounded-tl-none border border-border/30 bg-muted/60 text-foreground',
                          isStaff &&
                            'rounded-tl-none border border-emerald-500/25 bg-emerald-500/10 text-foreground'
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
                                        {t('chat.from')}{' '}
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
            </div>

            <div className="border-t border-border/40 bg-background/80 p-3 backdrop-blur-md">
              {/* Công tắc chọn người trả lời. Chỉ hiện khi đã có hội thoại (cần conversationId để đổi
                  chế độ) — cũng đúng lúc khách đã thử hỏi AI và biết mình cần gì. */}
              {conversationId && (
                <div className="mb-2 flex rounded-full border border-border/50 bg-muted/40 p-0.5">
                  {(
                    [
                      { mode: 'ai', label: t('chat.ai'), Icon: Sparkles },
                      { mode: 'human', label: t('chat.frontDesk'), Icon: Headset },
                    ] as const
                  ).map(({ mode, label, Icon }) => {
                    const isActive = (isHandoff ? 'human' : 'ai') === mode;
                    const isSwitching =
                      setConversationMode.isPending &&
                      setConversationMode.variables?.mode === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => void handleSetMode(mode)}
                        disabled={isTyping || setConversationMode.isPending}
                        aria-pressed={isActive}
                        className={cn(
                          'flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60',
                          isActive
                            ? mode === 'human'
                              ? 'bg-emerald-500/15 text-emerald-700 shadow-sm'
                              : 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {isSwitching ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Icon className="h-3 w-3" />
                        )}
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}

              {isHandoff && (
                <div className="mb-2 flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-700">
                  <Headset className="h-3.5 w-3.5 shrink-0" />
                  <span>
{t('chat.connected')}
                  </span>
                </div>
              )}
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
