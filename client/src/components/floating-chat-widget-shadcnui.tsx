import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import type { TFunction } from 'i18next';
import {
  Bot,
  Building2,
  Headset,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useMatch } from 'react-router';
import { toast } from 'sonner';

import { ConversationModeToggle } from '@/components/chat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  useConversationSocket,
  useMyConversation,
  useSendChatMessage,
  useSendChatMessageStream,
  useSetConversationMode,
} from '@/hooks/chat';
import { useHotel } from '@/hooks/hotels';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/authStore';
import type {
  ChatSender,
  ConversationMode,
  ConversationSocketMessage,
  Message,
  MyConversationResponse,
} from '@/types/chat.types';
import { errorMessage } from '@/utils/errorMessage';
import { chatSchema, type ChatFormValues } from '@/validations/chat.validation';

const now = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const clockTime = (iso: string) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? now() : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/** Khoá thread của trợ lý toàn sàn. Thread của khách sạn dùng chính `hotelId` làm khoá. */
const PLATFORM_KEY = 'platform';

/** Khách đang nói chuyện với ai: trợ lý toàn sàn hay concierge/lễ tân của khách sạn đang xem. */
type ChatScope = 'platform' | 'hotel';

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
const platformGreeting = (t: TFunction<'common'>): Message => ({
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
 * Lời chào của concierge MỘT khách sạn — quick reply đổi theo: ở scope này bot có tool tra phòng
 * trống / tiện nghi / chính sách của đúng khách sạn đó (`buildTools(hotel.id, …)` ở BE).
 */
const hotelGreeting = (t: TFunction<'common'>, hotelName: string): Message => ({
  id: 'greeting',
  sender: 'ai',
  text: t('chat.hotelGreeting', { hotel: hotelName }),
  time: now(),
  quickReplies: [
    t('chat.quick.availability'),
    t('chat.quick.amenities'),
    t('chat.quick.policies'),
  ],
});

/** `senderType` của BE → sender của khung chat. 'system' là ghi chú `[Hệ thống]` khi gạt AI ⇄ Lễ tân. */
const senderOf = (senderType: ConversationSocketMessage['senderType']): ChatSender => {
  if (senderType === 'user') return 'user';
  if (senderType === 'staff') return 'staff';
  if (senderType === 'system') return 'system';
  return 'ai';
};

const toMessage = (item: ConversationSocketMessage): Message => ({
  id: item.id,
  sender: senderOf(item.senderType),
  text: item.content,
  time: clockTime(item.createdAt),
});

/**
 * Khung chat nổi ở mọi trang khách. Có **hai luồng tách biệt**, khách tự chọn bằng tab trên header:
 *
 * - **Toàn sàn** (mặc định): `POST /conversations/messages` KHÔNG kèm `hotelId` — tư vấn & tìm/gợi ý
 *   khách sạn trên sàn. Không có lễ tân (BE trả 400 nếu cố chuyển) nên không có công tắc AI ⇄ Lễ tân.
 * - **Khách sạn đang xem** (chỉ hiện khi đang ở `/hotels/:hotelId…`): gửi kèm `hotelId` ⇒ concierge của
 *   đúng khách sạn đó (tra phòng/giá/chính sách), và **gạt được sang lễ tân người thật**.
 *
 * Hai luồng có `conversationId` + lịch sử **riêng** (BE cũng lưu tách theo `hotelId`), nên đổi tab
 * không trộn tin của hội thoại này sang hội thoại kia. Cố ý KHÔNG tự đoán khách sạn: trước đây widget
 * lấy đại `hotels[0]` nên khách hỏi "tìm khách sạn ở Đà Nẵng" lại đang nói với concierge của một
 * khách sạn ngẫu nhiên — giờ chỉ gắn đúng khách sạn khách đang mở, và phải tự bấm chọn.
 */
export function FloatingChatWidget() {
  const { t } = useTranslation('common');
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const queryClient = useQueryClient();
  const sendChatMessage = useSendChatMessage();
  const sendChatMessageStream = useSendChatMessageStream();
  const setConversationMode = useSetConversationMode();
  const [isOpen, setIsOpen] = useState(false);

  // Khách sạn đang xem. `end: false` để khớp cả trang chi tiết phòng (`/hotels/:id/rooms/:roomTypeId`).
  // Đọc từ route chứ không từ props: widget mount ở `Layout` (ngoài route con) nên không có params.
  const hotelRoute = useMatch({ path: '/hotels/:hotelId', end: false });
  const routeHotelId = hotelRoute?.params.hotelId;
  // Cùng query key với trang chi tiết KS ⇒ đang ở trang đó thì lấy thẳng từ cache, không tốn request.
  const { data: hotel } = useHotel(routeHotelId ?? '');
  const hotelName = hotel?.name ?? '';

  // Scope người dùng CHỌN. Rời trang khách sạn thì tự về toàn sàn — tính khi render thay vì dùng
  // effect để không có một nhịp render trung gian trỏ vào khách sạn đã rời khỏi.
  const [requestedScope, setRequestedScope] = useState<ChatScope>('platform');
  const scope: ChatScope = routeHotelId ? requestedScope : 'platform';
  const activeHotelId = scope === 'hotel' ? routeHotelId : undefined;
  const scopeKey = activeHotelId ?? PLATFORM_KEY;

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

  // Lịch sử + hội thoại + cờ bàn giao, TÁCH theo scope (khoá 'platform' hoặc hotelId).
  const [threads, setThreads] = useState<Record<string, Message[]>>({});
  const [conversationIds, setConversationIds] = useState<Record<string, string | undefined>>({});
  const [handoffMap, setHandoffMap] = useState<Record<string, boolean>>({});
  const [typingScope, setTypingScope] = useState<string>();

  const greeting = useMemo(
    () =>
      scope === 'hotel' && hotelName
        ? hotelGreeting(t, hotelName)
        : platformGreeting(t),
    [scope, hotelName, t]
  );

  // useMemo để mảng lời chào không đổi tham chiếu mỗi render — nếu không, effect cuộn xuống cuối
  // (deps có `messages`) sẽ chạy ở MỌI render.
  const messages = useMemo(
    () => threads[scopeKey] ?? [greeting],
    [threads, scopeKey, greeting]
  );
  const conversationId = conversationIds[scopeKey];
  const isHandoff = handoffMap[scopeKey] ?? false;
  const isTyping = typingScope === scopeKey;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const idCounter = useRef(0);
  const makeId = useCallback(() => `m-${(idCounter.current += 1)}`, []);

  const toggleOpen = useCallback(() => setIsOpen(prev => !prev), []);

  /** Ghi vào đúng thread của scope. `fallback` là lời chào — thread chưa tồn tại thì dựng từ nó. */
  const updateThread = useCallback(
    (key: string, fallback: Message[], updater: (prev: Message[]) => Message[]) => {
      setThreads(prev => ({ ...prev, [key]: updater(prev[key] ?? fallback) }));
    },
    []
  );

  // KHÔI PHỤC hội thoại cũ. `conversationId` chỉ nằm trong state nên F5 là mất lịch sử.
  // Khách vãng lai vẫn chat được nhưng BE không định danh được nên không có gì để khôi phục.
  const { data: platformConversation } = useMyConversation(undefined, {
    enabled: isAuthenticated,
  });
  // Chỉ gọi khi khách thực sự mở tab khách sạn — không thì mỗi lần ghé một trang KS lại bắn thêm
  // một request mà phần lớn khách không mở khung chat.
  const { data: hotelConversation } = useMyConversation(routeHotelId, {
    enabled: isAuthenticated && Boolean(routeHotelId) && isOpen && scope === 'hotel',
  });

  // Chỉ nạp MỘT LẦN cho mỗi scope, nếu không mỗi lần query refetch (vd focus lại tab, hoặc chính ta
  // invalidate sau khi gửi) sẽ ghi đè lên các tin vừa nhắn.
  const hydratedRef = useRef<Set<string>>(new Set());
  const hydrate = useCallback(
    (key: string, data: MyConversationResponse, fallback: Message[]) => {
      if (hydratedRef.current.has(key)) return;
      hydratedRef.current.add(key);
      setConversationIds(prev => ({ ...prev, [key]: data.id }));
      setHandoffMap(prev => ({ ...prev, [key]: data.handoff }));
      setThreads(prev => ({
        ...prev,
        [key]: [...fallback, ...data.messages.map(toMessage)],
      }));
    },
    []
  );

  useEffect(() => {
    if (!platformConversation) return;
    hydrate(PLATFORM_KEY, platformConversation, [platformGreeting(tRef.current)]);
  }, [platformConversation, hydrate]);

  useEffect(() => {
    // Chốt `hotelId` của response khớp KS đang xem: đổi trang nhanh thì dữ liệu của KS trước có thể
    // về muộn và rơi nhầm vào thread của KS sau.
    if (!hotelConversation || !routeHotelId || hotelConversation.hotelId !== routeHotelId) return;
    hydrate(routeHotelId, hotelConversation, [
      hotelGreeting(tRef.current, hotel?.name ?? ''),
    ]);
  }, [hotelConversation, routeHotelId, hotel?.name, hydrate]);

  // Câu trả lời của lễ tân về qua socket (bot im khi đang bàn giao nên không có đường HTTP nào khác).
  const handleSocketMessage = useCallback(
    (message: ConversationSocketMessage) => {
      // BE dội lại cả tin của chính khách cho nhân viên thấy ⇒ bỏ qua, ta đã render lạc quan rồi.
      if (message.senderType === 'user') return;
      const key = message.conversationId;
      setThreads(prev => {
        const target = Object.keys(prev).find(scopeId => conversationIds[scopeId] === key);
        if (!target) return prev;
        const thread = prev[target];
        if (thread.some(item => item.id === message.id)) return prev;
        return { ...prev, [target]: [...thread, toMessage(message)] };
      });
      if (message.senderType === 'staff' && routeHotelId) {
        setHandoffMap(prev => ({ ...prev, [routeHotelId]: true }));
      }
    },
    [conversationIds, routeHotelId]
  );

  // Chỉ hội thoại gắn KS mới có lễ tân trả lời ⇒ chỉ scope khách sạn cần socket.
  useConversationSocket({
    conversationId: activeHotelId ? conversationId : undefined,
    onMessage: handleSocketMessage,
  });

  // Cuộn TRỰC TIẾP khung tin nhắn thay vì scrollIntoView: hàm đó cuộn mọi khung cuộn tổ tiên, kể cả
  // cả TRANG — widget nổi ở góc màn hình mà lại kéo trang phía sau tụt xuống mỗi lần có tin mới.
  useEffect(() => {
    const thread = messagesEndRef.current;
    if (isOpen && thread) {
      thread.scrollTo({ top: thread.scrollHeight, behavior: 'smooth' });
    }
  }, [isOpen, messages, isTyping, scopeKey]);

  const sendText = async (raw: string) => {
    const text = raw.trim();
    if (!text || isTyping) return;

    // Chốt scope tại thời điểm gửi: khách có thể đổi tab giữa lúc chờ trả lời.
    const key = scopeKey;
    const hotelIdForTurn = activeHotelId;
    const fallback = [greeting];
    const handoffAtSend = isHandoff;

    updateThread(key, fallback, prev => [
      ...prev,
      { id: makeId(), sender: 'user', text, time: now() },
    ]);
    setTypingScope(key);

    const aiId = makeId();
    const aiTime = now();
    // Cập nhật bong bóng AI theo `aiId`, KHÔNG theo vị trí cuối mảng: updater của setState có thể
    // chạy 2 lần (StrictMode) và nhánh "sửa tin cuối" từng ghi đè nhầm lên chính tin của khách.
    const updateAi = (fullText: string) => {
      updateThread(key, fallback, prev => {
        if (!prev.some(item => item.id === aiId)) {
          return [...prev, { id: aiId, sender: 'ai', text: fullText, time: aiTime }];
        }
        return prev.map(item => (item.id === aiId ? { ...item, text: fullText } : item));
      });
    };

    const rememberConversation = (id: string) => {
      if (!id) return;
      setConversationIds(prev => (prev[key] === id ? prev : { ...prev, [key]: id }));
    };

    try {
      if (handoffAtSend) {
        // Lễ tân đang cầm hội thoại: BE **không** gọi bot, chỉ lưu tin và đẩy cho nhân viên, rồi trả
        // về một câu báo chờ soạn sẵn. Không render câu đó (banner đã nói rồi, hiện nữa là lặp) —
        // trừ khi `handoff` về false, nghĩa là nhân viên vừa resolve nên đây là câu THẬT của bot.
        const result = await sendChatMessage.mutateAsync({
          hotelId: hotelIdForTurn,
          conversationId: conversationIds[key],
          message: text,
        });
        rememberConversation(result.conversationId);
        setHandoffMap(prev => ({ ...prev, [key]: result.handoff }));
        if (!result.handoff && result.reply.trim()) {
          updateAi(result.reply);
        }
        return;
      }

      try {
        const result = await sendChatMessageStream.mutateAsync({
          // `hotelId` bỏ trống = trợ lý toàn sàn.
          payload: { hotelId: hotelIdForTurn, conversationId: conversationIds[key], message: text },
          handlers: {
            onConversationId: rememberConversation,
            onChunk: (_chunk, fullText) => updateAi(fullText),
            // Bot có thể tự bàn giao cho lễ tân GIỮA lượt này; chỉ giá trị ở event 'done' mới chốt.
            onHandoffState: state =>
              setHandoffMap(prev => ({ ...prev, [key]: state.handoff })),
          },
        });
        rememberConversation(result.conversationId);
        setHandoffMap(prev => ({ ...prev, [key]: result.handoff }));
        if (result.reply.trim()) {
          updateAi(result.reply);
        }
      } catch (streamErr) {
        // Stream lỗi → thử endpoint không stream, tái dùng đúng bong bóng AI.
        try {
          const fallbackResult = await sendChatMessage.mutateAsync({
            hotelId: hotelIdForTurn,
            conversationId: conversationIds[key],
            message: text,
          });
          rememberConversation(fallbackResult.conversationId);
          setHandoffMap(prev => ({ ...prev, [key]: fallbackResult.handoff }));
          updateAi(fallbackResult.reply);
        } catch {
          throw streamErr;
        }
      }
    } catch (err) {
      updateThread(key, fallback, prev => [
        ...prev,
        {
          id: makeId(),
          sender: 'ai',
          text: errorMessage(err, t('chat.error')),
          time: now(),
        },
      ]);
    } finally {
      setTypingScope(current => (current === key ? undefined : current));
      // Trang `/account/messages` đọc cùng hội thoại này ⇒ cho nó thấy tin vừa nhắn.
      if (hotelIdForTurn) {
        void queryClient.invalidateQueries({ queryKey: ['chat', 'my-conversations'] });
      }
    }
  };

  const handleSetMode = async (mode: ConversationMode) => {
    // Đổi chế độ cần có hội thoại rồi (BE khoá theo conversationId), và chỉ áp cho scope khách sạn.
    if (!activeHotelId || !conversationId || setConversationMode.isPending) return;
    if (mode === (isHandoff ? 'human' : 'ai')) return;
    try {
      const result = await setConversationMode.mutateAsync({
        conversationId,
        mode,
        reason: mode === 'human' ? 'Khách yêu cầu gặp nhân viên' : undefined,
      });
      setHandoffMap(prev => ({ ...prev, [activeHotelId]: result.handoff }));
      void queryClient.invalidateQueries({ queryKey: ['chat', 'my-conversations'] });
    } catch (err) {
      toast.error(errorMessage(err, t('chat.switchError')));
    }
  };

  const selectScope = (next: ChatScope) => {
    setRequestedScope(next);
    reset();
  };

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

  const isHotelScope = scope === 'hotel';
  const headerTitle = isHotelScope && hotelName ? hotelName : 'StayHub';
  const headerSubtitle = isHotelScope ? t('chat.hotelSubtitle') : t('chat.subtitle');
  const aiLabel = isHotelScope && hotelName ? hotelName : 'StayHub';
  const hotelImage = hotel?.images?.find(image => image.isPrimary)?.url ?? hotel?.images?.[0]?.url;

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
                      {isHotelScope && hotelImage && (
                        <AvatarImage src={hotelImage} alt={hotelName} />
                      )}
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {isHotelScope ? (
                          <Building2 className="h-5 w-5" />
                        ) : (
                          <Bot className="h-5 w-5" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-emerald-500" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-foreground">
                      {headerTitle}
                    </h3>
                    <p className="truncate text-xs text-muted-foreground">
                      {headerSubtitle}
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

              {/* Chọn người nói chuyện — chỉ hiện khi đang mở một khách sạn cụ thể, vì ngoài trang đó
                  không có khách sạn nào để gắn hội thoại vào. */}
              {routeHotelId && (
                <div className="relative z-10 mt-3 flex rounded-full border border-border/40 bg-background/70 p-0.5">
                  {(
                    [
                      { value: 'platform', label: t('chat.scope.platform'), Icon: Bot },
                      { value: 'hotel', label: t('chat.scope.hotel'), Icon: Building2 },
                    ] as const
                  ).map(({ value, label, Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => selectScope(value)}
                      aria-pressed={scope === value}
                      className={cn(
                        'flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                        scope === value
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      <span className="truncate">{label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
              <div
                ref={messagesEndRef}
                className="flex h-90 flex-col gap-4 overflow-y-auto bg-background/55 p-4"
              >
                {messages.map((item, index) => {
                  const isAi = item.sender === 'ai';
                  const isGuest = item.sender === 'user';
                  const isStaff = item.sender === 'staff';

                  // Ghi chú `[Hệ thống]` (khách gạt AI ⇄ Lễ tân): là mốc trạng thái, không phải ai đó
                  // đang nói — hiện thành một dòng nhỏ giữa khung như Messenger.
                  if (item.sender === 'system') {
                    return (
                      <motion.p
                        key={item.id ?? `system-${index}`}
                        variants={messageVariants}
                        className="self-center text-center text-[11px] text-muted-foreground"
                      >
                        {item.text}
                      </motion.p>
                    );
                  }

                  return (
                    <motion.div
                      key={item.id ?? `${item.sender}-${index}-${item.time}`}
                      variants={messageVariants}
                      // KHÔNG dùng `self-end` cho tin của khách: `align-self: flex-end` làm hàng co
                      // lại vừa nội dung (shrink-to-fit), rồi `max-w-[85%]` bên trong lại lấy 85% của
                      // chính bề rộng đã co đó ⇒ bóp bong bóng xuống dưới bề rộng tự nhiên và **ép
                      // xuống dòng giữa câu** ("xin chào" → "xin / chào"). Đo trên Chrome: 2 dòng khi
                      // có `self-end`, 1 dòng khi bỏ. `flex-row-reverse` trên hàng full-width đã tự
                      // dồn bong bóng sang phải nên không cần căn lề gì thêm.
                      className={cn('flex gap-3', isGuest && 'flex-row-reverse')}
                    >
                      {!isGuest && (
                        <Avatar className="h-8 w-8 shrink-0 border border-border/40 shadow-sm">
                          <AvatarFallback
                            className={cn(
                              'bg-primary/10 text-primary',
                              isStaff && 'bg-emerald-500/15 text-emerald-600'
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
                              'truncate text-xs font-medium text-muted-foreground',
                              isStaff && 'text-emerald-600'
                            )}
                          >
                            {isStaff ? t('chat.frontDesk') : aiLabel}
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
                          <p className="whitespace-pre-wrap wrap-break-word">
                            {item.text}
                          </p>
                        </div>

                        {isAi &&
                          item.id === 'greeting' &&
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
                {/* Chỉ scope khách sạn mới có lễ tân. Phải có hội thoại rồi mới đổi chế độ được
                    (BE khoá theo conversationId), nên công tắc xuất hiện sau tin đầu tiên. */}
                {isHotelScope && conversationId && isAuthenticated && (
                  <ConversationModeToggle
                    isHandoff={isHandoff}
                    onChange={mode => void handleSetMode(mode)}
                    disabled={setConversationMode.isPending}
                    className="mb-2"
                  />
                )}

                {isHotelScope && !isAuthenticated && (
                  <p className="mb-2 rounded-xl bg-muted/50 px-3 py-2 text-[11px] text-muted-foreground">
                    {t('chat.signInForStaff')}
                  </p>
                )}

                {isHandoff && (
                  <p className="mb-2 flex items-center gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-[11px] font-medium text-emerald-700">
                    <Headset className="size-3 shrink-0" />
                    {t('chat.handoffNotice')}
                  </p>
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
