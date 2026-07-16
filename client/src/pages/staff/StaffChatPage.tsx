import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle, MessageSquare } from 'lucide-react';

import { ChatComposer } from '@/components/staff/chat/ChatComposer';
import { ConversationList } from '@/components/staff/chat/ConversationList';
import { ConversationThread } from '@/components/staff/chat/ConversationThread';
import {
  CONVERSATION_FILTERS,
  customerName,
  type ConversationFilter,
} from '@/components/staff/chat/labels';
import { ListSkeleton } from '@/components/shared/skeletons';
import { Button } from '@/components/ui/button';
import { useConversationSocket } from '@/hooks/chat';
import {
  staffConversationKeys,
  useHotelConversation,
  useHotelConversations,
  useHotelInboxSocket,
  useReplyConversation,
  useResolveConversation,
} from '@/hooks/staff-conversations';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/authStore';
import { useStaffHotelStore } from '@/stores/staffHotelStore';
import type { ConversationSocketMessage } from '@/types/chat.types';
import type {
  ConversationEscalatedEvent,
  StaffConversationDetail,
} from '@/types/staff-conversation.types';
import { errorMessage } from '@/utils/errorMessage';

// Kéo một trang đủ lớn rồi lọc ở client để mỗi tab có số đếm riêng (cùng cách HousekeepingPage làm).
// Vượt trần này thì báo cho nhân viên biết thay vì im lặng cắt bớt.
const PAGE_SIZE = 100;

export default function StaffChatPage() {
  const hotel = useStaffHotelStore(state => state.hotel);
  const currentUserId = useAuthStore(state => state.user?.id);
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<ConversationFilter>('escalated');
  const [search, setSearch] = useState('');
  // Hội thoại đang mở nằm trên URL để F5 / chia sẻ link vẫn giữ đúng khách.
  const [params, setParams] = useSearchParams();
  const selectedId = params.get('c') ?? undefined;

  const { data, isLoading, isError, error } = useHotelConversations(hotel?.id, {
    limit: PAGE_SIZE,
  });
  const conversations = useMemo(() => data?.results ?? [], [data]);

  const counts = useMemo(
    () => ({
      all: conversations.length,
      escalated: conversations.filter(c => c.status === 'escalated').length,
      active: conversations.filter(c => c.status === 'active').length,
      resolved: conversations.filter(c => c.status === 'resolved').length,
      closed: conversations.filter(c => c.status === 'closed').length,
    }),
    [conversations]
  );

  const visible = useMemo(() => {
    const byStatus =
      filter === 'all'
        ? conversations
        : conversations.filter(c => c.status === filter);
    const term = search.trim().toLowerCase();
    if (!term) return byStatus;
    return byStatus.filter(c =>
      [customerName(c.customer), c.customer?.email, c.lastMessage]
        .filter(Boolean)
        .some(field => String(field).toLowerCase().includes(term))
    );
  }, [conversations, filter, search]);

  const {
    data: conversation,
    isLoading: isLoadingThread,
    isError: isThreadError,
    error: threadError,
  } = useHotelConversation(hotel?.id, selectedId);

  const reply = useReplyConversation(hotel?.id);
  const resolve = useResolveConversation(hotel?.id);

  const selectConversation = useCallback(
    (conversationId?: string) => {
      setParams(
        prev => {
          const next = new URLSearchParams(prev);
          if (conversationId) next.set('c', conversationId);
          else next.delete('c');
          return next;
        },
        { replace: true }
      );
    },
    [setParams]
  );

  // Việc mới bị chuyển lên → nổi ngay trong danh sách, không cần refresh.
  const handleEscalated = useCallback(
    (event: ConversationEscalatedEvent) => {
      queryClient.invalidateQueries({
        queryKey: staffConversationKeys.lists(hotel?.id ?? ''),
      });
      toast.info('A guest is asking for a person', {
        description: event.reason,
        action: {
          label: 'Open',
          onClick: () => selectConversation(event.conversationId),
        },
      });
    },
    [queryClient, hotel?.id, selectConversation]
  );

  useHotelInboxSocket({ hotelId: hotel?.id, onEscalated: handleEscalated });

  // Tin khách gửi trong lúc nhân viên đang mở hội thoại — bot im nên tin này CHỈ về qua socket.
  const handleSocketMessage = useCallback(
    (message: ConversationSocketMessage) => {
      queryClient.setQueryData<StaffConversationDetail>(
        staffConversationKeys.detail(hotel?.id ?? '', message.conversationId),
        old => {
          if (!old) return old;
          // Chống trùng: tin của chính nhân viên cũng được BE đẩy vào room, mà mutation reply đã
          // invalidate chi tiết ⇒ hai đường có thể cùng mang về một tin.
          if (old.messages.some(item => item.id === message.id)) return old;
          return {
            ...old,
            messages: [...old.messages, message],
            lastMessageAt: message.createdAt,
          };
        }
      );
      // Preview + thứ tự ở cột trái cũng đổi theo tin mới.
      queryClient.invalidateQueries({
        queryKey: staffConversationKeys.lists(hotel?.id ?? ''),
      });
    },
    [queryClient, hotel?.id]
  );

  useConversationSocket({
    conversationId: selectedId,
    onMessage: handleSocketMessage,
  });

  const handleSend = async (message: string) => {
    if (!selectedId) return;
    try {
      await reply.mutateAsync({ conversationId: selectedId, message });
    } catch (err) {
      toast.error(errorMessage(err, 'Could not send your reply.'));
    }
  };

  const handleResolve = async () => {
    if (!selectedId) return;
    try {
      await resolve.mutateAsync(selectedId);
      toast.success('Conversation resolved', {
        description: 'The AI assistant will answer this guest again.',
      });
    } catch (err) {
      toast.error(errorMessage(err, 'Could not resolve this conversation.'));
    }
  };

  const activeFilter = CONVERSATION_FILTERS.find(f => f.value === filter);
  const isTruncated = (data?.totalResults ?? 0) > conversations.length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Chat</h1>
        <p className="text-sm text-slate-500">
          Reply to guests of {hotel?.name ?? 'your hotel'}. While you are
          handling a chat, the AI assistant stays quiet.
        </p>
      </div>

      {isError && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>{errorMessage(error, 'Could not load conversations.')}</span>
        </div>
      )}

      {/* Tabs theo việc cần làm, mỗi tab kèm số đếm (kiểu Booking.com Extranet). */}
      <div className="flex flex-wrap gap-1.5">
        {CONVERSATION_FILTERS.map(item => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
              filter === item.value
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            )}
          >
            {item.label}
            <span
              className={cn(
                'ml-1.5 text-xs',
                filter === item.value ? 'text-white/70' : 'text-slate-400'
              )}
            >
              {counts[item.value]}
            </span>
          </button>
        ))}
      </div>

      <div className="flex h-[calc(100vh-15rem)] min-h-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {/* Cột trái: chuyển giữa các khách. Trên mobile ẩn đi khi đang mở một hội thoại. */}
        <div
          className={cn(
            'w-full shrink-0 border-r border-slate-200 lg:flex lg:w-80',
            selectedId ? 'hidden lg:flex' : 'flex'
          )}
        >
          {isLoading ? (
            <ListSkeleton className="w-full p-3" />
          ) : (
            <ConversationList
              className="w-full"
              conversations={visible}
              selectedId={selectedId}
              onSelect={selectConversation}
              currentUserId={currentUserId}
              search={search}
              onSearchChange={setSearch}
              emptyHint={
                search.trim()
                  ? `No conversation matches “${search.trim()}”.`
                  : (activeFilter?.empty ?? 'No conversations.')
              }
            />
          )}
        </div>

        {/* Cột phải: hội thoại với khách đang chọn. */}
        <div
          className={cn(
            'min-w-0 flex-1',
            selectedId ? 'flex' : 'hidden lg:flex'
          )}
        >
          {!selectedId ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
              <MessageSquare className="size-8 text-slate-300" />
              <p className="text-sm text-slate-500">
                Pick a guest on the left to read and reply to their chat.
              </p>
            </div>
          ) : isLoadingThread ? (
            <ListSkeleton className="flex-1 p-4" />
          ) : isThreadError || !conversation ? (
            // `?c=` có thể trỏ tới hội thoại không còn/không thuộc KS đang trực (vd link cũ, hoặc đổi
            // backend). Không có lối thoát thì URL kẹt mãi ở ô lỗi, nên luôn cho đường quay lại danh sách.
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
              <AlertTriangle className="size-8 text-amber-400" />
              <p className="max-w-xs text-sm text-slate-600">
                {errorMessage(threadError, 'Could not load this conversation.')}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectConversation(undefined)}
              >
                Back to conversations
              </Button>
            </div>
          ) : (
            <ConversationThread
              conversation={conversation}
              onResolve={handleResolve}
              isResolving={resolve.isPending}
              onBack={() => selectConversation(undefined)}
            >
              <ChatComposer
                onSend={handleSend}
                isSending={reply.isPending}
                disabled={conversation.status === 'closed'}
                disabledHint="This conversation is closed and can no longer be replied to."
              />
            </ConversationThread>
          )}
        </div>
      </div>

      {isTruncated && (
        <p className="text-xs text-slate-400">
          Showing the {conversations.length} most recent conversations of{' '}
          {data?.totalResults}. Use the search box to find older ones.
        </p>
      )}
    </div>
  );
}
