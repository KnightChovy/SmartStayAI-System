import { useEffect, useRef } from 'react';
import { ArrowLeft, Bot, Check, Loader2, Mail, Phone } from 'lucide-react';

import { LinkifiedText } from '@/components/shared/LinkifiedText';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import type {
  StaffConversationDetail,
  StaffConversationMessage,
} from '@/types/staff-conversation.types';
import {
  CONVERSATION_STATUS_META,
  customerInitials,
  customerName,
} from './labels';

interface ConversationThreadProps {
  conversation: StaffConversationDetail;
  onResolve: () => void;
  isResolving: boolean;
  /** Chỉ hiện trên mobile để quay lại danh sách (2 cột gộp thành 1). */
  onBack?: () => void;
  children?: React.ReactNode;
}

const messageTime = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const dayLabel = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  if (isToday) return 'Today';
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

function MessageBubble({ message }: { message: StaffConversationMessage }) {
  // Góc nhìn NHÂN VIÊN: tin của mình (staff) nằm phải; khách và bot nằm trái — ngược với khung
  // chat của khách, nơi staff nằm trái.
  const isStaff = message.senderType === 'staff';
  const isBot = message.senderType === 'ai_bot';
  const isSystem = message.senderType === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-500">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={cn('flex', isStaff ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'flex max-w-[78%] flex-col gap-1',
          isStaff && 'items-end'
        )}
      >
        {isBot && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
            <Bot className="size-3" />
            AI assistant
          </span>
        )}
        <div
          className={cn(
            'rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
            isStaff && 'rounded-br-sm bg-slate-900 text-white',
            isBot &&
              'rounded-bl-sm border border-slate-200 bg-slate-50 text-slate-600',
            !isStaff &&
              !isBot &&
              'rounded-bl-sm border border-slate-200 bg-white text-slate-900'
          )}
        >
          {message.content}
        </div>
        <span className="text-[10px] text-slate-400">
          {messageTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
}

/**
 * Cột phải: toàn bộ hội thoại với một khách + hành động của nhân viên.
 * `children` là ô soạn tin (ChatComposer) — để trang chủ động khoá/mở theo trạng thái.
 */
export function ConversationThread({
  conversation,
  onResolve,
  isResolving,
  onBack,
  children,
}: ConversationThreadProps) {
  const meta = CONVERSATION_STATUS_META[conversation.status];
  const { customer, messages } = conversation;
  const threadRef = useRef<HTMLDivElement>(null);

  // Luôn cuộn xuống tin mới nhất — kể cả tin đẩy về real-time khi đang mở hội thoại.
  // Cuộn TRỰC TIẾP khung tin nhắn thay vì scrollIntoView: hàm đó cuộn mọi khung cuộn tổ tiên, kể cả
  // cả trang, làm cả layout bị kéo tụt xuống mỗi khi có tin mới.
  useEffect(() => {
    const thread = threadRef.current;
    if (thread) thread.scrollTop = thread.scrollHeight;
  }, [messages.length, conversation.id]);

  const canResolve =
    conversation.status !== 'resolved' && conversation.status !== 'closed';

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-slate-50">
      <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 lg:hidden"
            onClick={onBack}
            aria-label="Back to conversations"
          >
            <ArrowLeft className="size-4" />
          </Button>
        )}

        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
          {customerInitials(customer)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-sm font-semibold text-slate-900">
              {customerName(customer)}
            </h2>
            <span
              className={cn(
                'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold',
                meta.className
              )}
            >
              {meta.label}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
            {customer?.email && (
              <span className="inline-flex items-center gap-1">
                <Mail className="size-3" />
                <span className="truncate">{customer.email}</span>
              </span>
            )}
            {customer?.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="size-3" />
                {customer.phone}
              </span>
            )}
            {!customer && <span>Not signed in — no contact details</span>}
          </div>
        </div>

        {canResolve && (
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={onResolve}
            disabled={isResolving}
            // Giải thích hệ quả: đây là điểm duy nhất trả khách về cho bot.
            title="Mark as resolved — the AI assistant will start answering this guest again"
          >
            {isResolving ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Check className="size-3.5" />
            )}
            Resolve
          </Button>
        )}
      </header>

      <div
        ref={threadRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4"
      >
        {messages.length === 0 ? (
          <p className="pt-8 text-center text-sm text-slate-400">
            No messages in this conversation yet.
          </p>
        ) : (
          messages.map((message, index) => {
            const previous = messages[index - 1];
            const showDay =
              !previous ||
              new Date(previous.createdAt).toDateString() !==
                new Date(message.createdAt).toDateString();

            return (
              <div key={message.id} className="space-y-3">
                {showDay && (
                  <div className="flex justify-center">
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-medium text-slate-400 ring-1 ring-slate-200">
                      {dayLabel(message.createdAt)}
                    </span>
                  </div>
                )}
                <MessageBubble message={message} />
              </div>
            );
          })
        )}
      </div>

      {children}
    </div>
  );
}
