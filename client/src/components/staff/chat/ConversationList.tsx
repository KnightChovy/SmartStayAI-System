import { formatDistanceToNowStrict } from 'date-fns';
import { MessageSquare, Search, UserCheck } from 'lucide-react';

import { cn } from '@/lib/cn';
import type { StaffConversationListItem } from '@/types/staff-conversation.types';
import {
  CONVERSATION_STATUS_META,
  customerInitials,
  customerName,
} from './labels';

interface ConversationListProps {
  conversations: StaffConversationListItem[];
  selectedId?: string;
  onSelect: (conversationId: string) => void;
  /** Id nhân viên đang đăng nhập — để đánh dấu hội thoại "Assigned to you". */
  currentUserId?: string;
  search: string;
  onSearchChange: (value: string) => void;
  /** Câu hiển thị khi tab đang chọn không có hội thoại nào. */
  emptyHint: string;
  className?: string;
}

const relativeTime = (iso: string | null): string => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return formatDistanceToNowStrict(date, { addSuffix: true });
};

/**
 * Cột trái: danh sách hội thoại để nhân viên chuyển qua lại giữa các khách (kiểu hộp thư
 * Booking.com Extranet). Mỗi dòng là một khách; dòng đang mở được tô nền + viền trái.
 */
export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  currentUserId,
  search,
  onSearchChange,
  emptyHint,
  className,
}: ConversationListProps) {
  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      <div className="border-b border-slate-200 p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={event => onSearchChange(event.target.value)}
            placeholder="Search guest or message"
            aria-label="Search conversations"
            className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-8.5 pr-3 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5"
          />
        </div>
      </div>

      {conversations.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
          <MessageSquare className="size-8 text-slate-300" />
          <p className="text-sm text-slate-500">{emptyHint}</p>
        </div>
      ) : (
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {conversations.map(conversation => {
            const isSelected = conversation.id === selectedId;
            const meta = CONVERSATION_STATUS_META[conversation.status];
            const isMine =
              Boolean(currentUserId) &&
              conversation.assignedTo === currentUserId;

            return (
              <li key={conversation.id}>
                <button
                  type="button"
                  onClick={() => onSelect(conversation.id)}
                  aria-current={isSelected}
                  className={cn(
                    'flex w-full items-start gap-3 border-l-2 border-b border-b-slate-100 px-3 py-3 text-left transition-colors',
                    isSelected
                      ? 'border-l-slate-900 bg-slate-50'
                      : 'border-l-transparent hover:bg-slate-50/70'
                  )}
                >
                  <span
                    className={cn(
                      'flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                      isSelected
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600'
                    )}
                  >
                    {customerInitials(conversation.customer)}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-slate-900">
                        {customerName(conversation.customer)}
                      </span>
                      <span className="shrink-0 text-[11px] text-slate-400">
                        {relativeTime(conversation.lastMessageAt)}
                      </span>
                    </span>

                    <span className="mt-0.5 block truncate text-xs text-slate-500">
                      {conversation.lastMessage ?? 'No messages yet'}
                    </span>

                    <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold',
                          meta.className
                        )}
                      >
                        {meta.label}
                      </span>
                      {isMine && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                          <UserCheck className="size-3" />
                          You
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
