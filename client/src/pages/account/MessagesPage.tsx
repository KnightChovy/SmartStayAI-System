import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNowStrict } from 'date-fns';
import { Bot, Headset, Loader2, MessageSquare, Plus, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { HotelPickerPanel } from '@/components/account/HotelPickerPanel';
import { ConversationModeToggle } from '@/components/chat';
import { LinkifiedText } from '@/components/shared/LinkifiedText';
import { Button } from '@/components/ui/button';
import {
  useConversationSocket,
  useMyConversation,
  useMyConversations,
  useSendChatMessage,
  useSetConversationMode,
} from '@/hooks/chat';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/authStore';
import type {
  ConversationMode,
  ConversationSocketMessage,
  HotelConversationListItem,
  MyConversationListItem,
  MyConversationResponse,
} from '@/types/chat.types';
import { errorMessage } from '@/utils/errorMessage';
import { hotelInitials } from '@/utils/hotelInitials';
import { CHAT_MESSAGE_MAX, chatSchema } from '@/validations/chat.validation';

/**
 * Dòng hội thoại có gắn khách sạn. Hội thoại TOÀN SÀN (khung chat nổi) cũng về đây nhưng với
 * `hotel: null` — trang này chỉ nhắn với lễ tân từng khách sạn nên phải lọc bỏ, nếu không
 * `item.hotel.name` sẽ ném lỗi và làm trắng cả trang.
 */
const isHotelConversation = (
  item: MyConversationListItem
): item is HotelConversationListItem => item.hotel !== null;

const clockTime = (iso: string): string => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const relativeTime = (iso: string | null): string => {
  if (!iso) return '';
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ''
    : formatDistanceToNowStrict(date, { addSuffix: true });
};

/**
 * Trang chat đầy đủ của khách (`/account/messages`) — nhắn RIÊNG với **lễ tân từng khách sạn**.
 * Thanh bên liệt kê các KS đã nhắn kiểu Messenger; nút + mở bộ chọn để nhắn với một khách sạn mới
 * bất kỳ trên sàn.
 *
 * Khác khung chat nổi ở góc màn hình: chỗ đó là trợ lý AI **toàn sàn** (chỉ tìm/gợi ý khách sạn,
 * không gắn KS nào nên không có lễ tân). Ở trang này khách chọn đúng khách sạn mình muốn rồi gạt
 * sang "Lễ tân" để nói chuyện với người thật.
 */
export default function MessagesPage() {
  // 2 namespace: nhãn chat dùng chung với widget ở `common`, chữ riêng của khu account ở `account`.
  const { t } = useTranslation('common');
  const { t: tAccount } = useTranslation('account');
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const queryClient = useQueryClient();

  const { data: listData, isLoading } = useMyConversations(isAuthenticated);
  const conversations = useMemo(
    () => (listData ?? []).filter(isHotelConversation),
    [listData]
  );

  // Hội thoại đang mở nằm trên URL để F5 / chia sẻ link giữ đúng khách sạn.
  const [params, setParams] = useSearchParams();
  const hotelIdParam = params.get('hotel') ?? undefined;
  const activeHotelId = hotelIdParam ?? conversations[0]?.hotelId;
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const { data: conversation, isLoading: isLoadingThread } = useMyConversation(
    activeHotelId,
    { enabled: isAuthenticated && Boolean(activeHotelId) }
  );

  const sendMessage = useSendChatMessage();
  const setMode = useSetConversationMode();
  const [draft, setDraft] = useState('');
  const threadRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);

  const selectHotel = useCallback(
    (hotelId: string) => {
      setParams(
        prev => {
          const next = new URLSearchParams(prev);
          next.set('hotel', hotelId);
          return next;
        },
        { replace: true }
      );
    },
    [setParams]
  );

  // Tên KS đang mở. KS vừa chọn từ bộ chọn thì chưa có hội thoại nên chưa có dòng ở thanh bên ⇒
  // undefined, lúc đó chỉ hiện lời mời gửi tin đầu tiên.
  const activeHotel = useMemo(
    () => conversations.find(item => item.hotelId === activeHotelId)?.hotel,
    [conversations, activeHotelId]
  );

  const messages = useMemo(() => conversation?.messages ?? [], [conversation]);

  // Cuộn TRỰC TIẾP khung tin nhắn, không dùng scrollIntoView: hàm đó cuộn mọi khung cuộn tổ tiên,
  // KỂ CẢ cả trang — nên mỗi lần có tin mới là window bị kéo xuống, header chào mừng trôi mất và
  // người dùng có cảm giác trang cứ tự tụt xuống.
  useEffect(() => {
    const thread = threadRef.current;
    if (thread) thread.scrollTop = thread.scrollHeight;
  }, [messages.length, activeHotelId]);

  // Tin đẩy về real-time (câu trả lời của lễ tân). Ghi thẳng vào cache của hội thoại đang mở.
  const handleSocketMessage = useCallback(
    (message: ConversationSocketMessage) => {
      // Không dùng `?? null`: khoá `null` là của hội thoại TOÀN SÀN (khung chat nổi) — ghi nhầm vào
      // đó là đổ tin của khách sạn này sang luồng khác. Ở đây socket chỉ chạy khi đã có hội thoại,
      // tức `activeHotelId` chắc chắn có giá trị.
      if (!activeHotelId) return;
      queryClient.setQueryData<MyConversationResponse | null>(
        ['chat', 'my-conversation', activeHotelId],
        old => {
          if (!old) return old;
          // Hợp nhất theo id: tin của chính khách cũng được BE dội về room này.
          if (old.messages.some(item => item.id === message.id)) return old;
          return { ...old, messages: [...old.messages, message] };
        }
      );
      // Preview + thứ tự ở thanh bên đổi theo tin mới.
      queryClient.invalidateQueries({ queryKey: ['chat', 'my-conversations'] });
    },
    [queryClient, activeHotelId]
  );

  useConversationSocket({
    conversationId: conversation?.id,
    onMessage: handleSocketMessage,
  });

  const isHandoff = conversation?.handoff ?? false;

  const handleSend = async () => {
    // Dùng chính `chatSchema` mà widget chat nổi và ChatComposer của staff đang dùng — trần 2000
    // khớp Joi `sendMessage` ở BE. Trước đây ô này chỉ chặn rỗng nên tin dài hơn là 400.
    const parsed = chatSchema.safeParse({ message: draft });
    if (!parsed.success || !activeHotelId || sendingRef.current) return;
    const text = parsed.data.message;
    sendingRef.current = true;
    setDraft('');
    try {
      await sendMessage.mutateAsync({
        hotelId: activeHotelId,
        conversationId: conversation?.id,
        message: text,
      });
      // Bot/lễ tân trả lời xong thì đọc lại hội thoại để lấy đủ tin mới.
      await queryClient.invalidateQueries({
        queryKey: ['chat', 'my-conversation', activeHotelId],
      });
      await queryClient.invalidateQueries({
        queryKey: ['chat', 'my-conversations'],
      });
    } catch (err) {
      // Trả chữ về ô nhập để khách không phải gõ lại.
      setDraft(text);
      toast.error(errorMessage(err, t('chat.error')));
    } finally {
      sendingRef.current = false;
    }
  };

  const handleSetMode = async (mode: ConversationMode) => {
    if (!conversation || setMode.isPending) return;
    if (mode === (isHandoff ? 'human' : 'ai')) return;
    try {
      await setMode.mutateAsync({
        conversationId: conversation.id,
        mode,
        reason: mode === 'human' ? 'Khách yêu cầu gặp nhân viên' : undefined,
      });
      await queryClient.invalidateQueries({
        queryKey: ['chat', 'my-conversation', activeHotelId],
      });
      await queryClient.invalidateQueries({
        queryKey: ['chat', 'my-conversations'],
      });
    } catch (err) {
      toast.error(errorMessage(err, t('chat.switchError')));
    }
  };

  const picker = isPickerOpen ? (
    <HotelPickerPanel
      onClose={() => setIsPickerOpen(false)}
      onSelect={hotelId => {
        setIsPickerOpen(false);
        selectHotel(hotelId);
      }}
    />
  ) : null;

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="size-5 animate-spin text-on-surface-variant" />
      </div>
    );
  }

  // Chưa nhắn với KS nào VÀ cũng chưa chọn KS nào ⇒ mời chọn khách sạn. Đây là đường DUY NHẤT để
  // bắt đầu, vì khung chat nổi đã chuyển thành trợ lý toàn sàn (không còn gắn khách sạn).
  if (conversations.length === 0 && !activeHotelId) {
    return (
      <>
        <div className="flex h-96 flex-col items-center justify-center gap-3 text-center">
          <MessageSquare className="size-9 text-on-surface-variant/40" />
          <p className="max-w-sm text-sm text-on-surface-variant">
            {tAccount('messages.empty')}
          </p>
          <Button
            type="button"
            className="rounded-full"
            onClick={() => setIsPickerOpen(true)}
          >
            <Plus className="mr-1.5 size-4" />
            {tAccount('messages.newChat')}
          </Button>
        </div>
        {picker}
      </>
    );
  }

  return (
    // Bỏ tiêu đề "Tin nhắn" ở đây: sidebar đã sáng mục đó rồi, mà AccountLayout phía trên đã ngốn
    // ~208px (navbar + py-10 + header chào mừng) — thêm tiêu đề nữa là khung chat bị dìm xuống và lùn đi.
    // Chiều cao trừ 14rem (224px) ≈ đúng phần bị chiếm, nên khung chat ăn gần hết chiều cao còn lại
    // mà không tràn xuống dưới nếp gấp; min-h giữ cho màn hình thấp vẫn dùng được.
    <>
      <div className="flex h-[calc(100vh-14rem)] min-h-120 overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface">
        {/* Thanh bên: các khách sạn đã nhắn. Trên mobile ẩn khi đang mở một hội thoại. */}
        <aside
          className={cn(
            'w-full shrink-0 overflow-y-auto border-r border-outline-variant/40 sm:flex sm:w-64 sm:flex-col',
            activeHotelId ? 'hidden sm:block' : 'block'
          )}
        >
          <div className="flex items-center justify-between gap-2 border-b border-outline-variant/30 px-3 py-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
              {tAccount('nav.messages')}
            </span>
            <button
              type="button"
              onClick={() => setIsPickerOpen(true)}
              aria-label={tAccount('messages.newChat')}
              title={tAccount('messages.newChat')}
              className="rounded-full p-1 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
            >
              <Plus className="size-4" />
            </button>
          </div>

          {conversations.map(item => {
            const isActive = item.hotelId === activeHotelId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectHotel(item.hotelId)}
                className={cn(
                  'flex w-full items-start gap-3 border-b border-outline-variant/30 px-3 py-3 text-left transition-colors',
                  isActive ? 'bg-primary/5' : 'hover:bg-surface-container-low'
                )}
              >
                <span className="relative shrink-0">
                  {item.hotel.imageUrl ? (
                    <img
                      src={item.hotel.imageUrl}
                      alt={item.hotel.name}
                      className="size-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {hotelInitials(item.hotel.name)}
                    </span>
                  )}
                  {/* Chấm xanh = đang nói chuyện với lễ tân người thật. */}
                  {item.handoff && (
                    <span className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full border-2 border-surface bg-emerald-500">
                      <Headset className="size-2 text-white" />
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        'truncate text-sm',
                        isActive
                          ? 'font-semibold text-on-surface'
                          : 'font-medium text-on-surface'
                      )}
                    >
                      {item.hotel.name}
                    </span>
                    <span className="shrink-0 text-[10px] text-on-surface-variant">
                      {relativeTime(item.lastMessageAt)}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-on-surface-variant">
                    {item.lastMessage ?? '—'}
                  </span>
                </span>
              </button>
            );
          })}
        </aside>

        {/* Khung hội thoại */}
        <div
          className={cn(
            'flex min-w-0 flex-1 flex-col',
            activeHotelId ? 'flex' : 'hidden sm:flex'
          )}
        >
          {!activeHotelId ? (
            <div className="flex flex-1 items-center justify-center px-6 text-center">
              <p className="text-sm text-on-surface-variant">
                {tAccount('messages.selectPrompt')}
              </p>
            </div>
          ) : isLoadingThread ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="size-5 animate-spin text-on-surface-variant" />
            </div>
          ) : (
            <>
              <div
                ref={threadRef}
                className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-surface-container-lowest/40 p-4"
              >
                {/* KS vừa chọn từ bộ chọn: chưa có hội thoại nào ⇒ mời gửi tin đầu tiên. Nhánh này
                    trước đây rơi vào spinner vĩnh viễn vì `!conversation` bị coi là đang tải. */}
                {!conversation && (
                  <p className="py-8 text-center text-sm text-on-surface-variant">
                    {tAccount('messages.startHint', {
                      hotel: activeHotel?.name ?? '',
                    })}
                  </p>
                )}

                {messages.map(message => {
                  const isGuest = message.senderType === 'user';
                  const isStaff = message.senderType === 'staff';
                  return (
                    <div
                      key={message.id}
                      className={cn(
                        'flex',
                        isGuest ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          'flex max-w-[75%] flex-col gap-1',
                          isGuest && 'items-end'
                        )}
                      >
                        {!isGuest && (
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 text-[11px] font-medium',
                              isStaff
                                ? 'text-emerald-600'
                                : 'text-on-surface-variant'
                            )}
                          >
                            {isStaff ? (
                              <Headset className="size-3" />
                            ) : (
                              <Bot className="size-3" />
                            )}
                            {isStaff ? t('chat.frontDesk') : t('chat.ai')}
                          </span>
                        )}
                        <div
                          className={cn(
                            'rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                            isGuest &&
                              'rounded-br-sm bg-primary text-on-primary',
                            isStaff &&
                              'rounded-bl-sm border border-emerald-500/25 bg-emerald-500/10 text-on-surface',
                            !isGuest &&
                              !isStaff &&
                              'rounded-bl-sm border border-outline-variant/40 bg-surface text-on-surface'
                          )}
                        >
                          {message.content}
                        </div>
                        <span className="text-[10px] text-on-surface-variant/70">
                          {clockTime(message.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-outline-variant/40 p-3">
                {/* Công tắc: khách tự chọn nói chuyện với AI hay lễ tân. Cần có hội thoại rồi mới
                    đổi được chế độ nên chỉ hiện sau khi đã gửi tin đầu tiên. */}
                {conversation && (
                  <ConversationModeToggle
                    isHandoff={isHandoff}
                    onChange={mode => void handleSetMode(mode)}
                    disabled={setMode.isPending}
                    className="mb-2"
                  />
                )}

                <div className="flex items-end gap-2">
                  <textarea
                    rows={1}
                    value={draft}
                    maxLength={CHAT_MESSAGE_MAX}
                    onChange={event => setDraft(event.target.value)}
                    onKeyDown={event => {
                      // Bộ gõ tiếng Việt: Enter khi đang ghép chữ là để chốt chữ, không phải để gửi.
                      if (
                        event.nativeEvent.isComposing ||
                        event.keyCode === 229
                      )
                        return;
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        void handleSend();
                      }
                    }}
                    placeholder={t('chat.placeholder')}
                    aria-label={t('chat.placeholder')}
                    className="max-h-30 min-w-0 flex-1 resize-none rounded-2xl border border-outline-variant/50 bg-surface px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-on-surface-variant focus:border-primary/50"
                  />
                  <Button
                    type="button"
                    size="icon"
                    className="size-10 shrink-0 rounded-full"
                    onClick={() => void handleSend()}
                    disabled={!draft.trim() || sendMessage.isPending}
                    aria-label={t('chat.send')}
                  >
                    {sendMessage.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Send className="size-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {picker}
    </>
  );
}
