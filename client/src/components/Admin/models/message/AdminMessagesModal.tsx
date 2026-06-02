import { useEffect } from 'react';
import { MoreHorizontal, Paperclip, Search, Send, Smile, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { formatDate, formatTime } from '@/utils/formatDate';

interface AdminMessagesModalProps {
  currentTime: Date;
  onClose: () => void;
}

const conversations = [
  {
    id: 'sarah',
    initials: 'S',
    name: 'Sarah H.',
    preview: 'RE: Occupancy forecast question',
    time: '8:30 AM',
    unread: true,
  },
  {
    id: 'alex',
    initials: 'A',
    name: 'Alex M.',
    preview: 'Generated notes exported',
    time: '7:31 AM',
    unread: false,
  },
  {
    id: 'maria',
    initials: 'M',
    name: 'Maria L.',
    preview: 'Can you review the VIP room setup?',
    time: 'Yesterday',
    unread: false,
  },
];

const messages = [
  {
    id: 'incoming-1',
    body: 'Hi Donovan, how soon can we export the increased API error rate?',
    direction: 'incoming',
    time: '8:32 AM',
  },
  {
    id: 'outgoing-1',
    body: 'Yes, I am looking at it now. Serena fills the chart and traffic from the alert region.',
    direction: 'outgoing',
    time: '8:34 AM',
  },
];

export function AdminMessagesModal({
  currentTime,
  onClose,
}: AdminMessagesModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
    >
      <button
        aria-label="Close messages"
        className="absolute inset-0 h-full w-full"
        onClick={onClose}
        type="button"
      />

      <section className="relative z-10 grid h-[min(82vh,640px)] w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-2xl lg:grid-cols-[290px_1fr]">
        <aside className="hidden border-r border-outline-variant/40 bg-slate-50/80 p-4 lg:block">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Messages</h2>
              <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">
                Live {formatDate(currentTime)} | {formatTime(currentTime)}
              </p>
            </div>
            <button
              aria-label="Close messages"
              className="inline-flex size-8 items-center justify-center rounded-full border border-outline-variant/50 text-slate-700 hover:bg-white"
              onClick={onClose}
              type="button"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-9 rounded-full bg-white pl-9 text-xs"
              placeholder="Search..."
            />
          </div>

          <div className="mt-4 space-y-2">
            {conversations.map((conversation, index) => (
              <button
                className={cn(
                  'flex w-full items-start gap-3 rounded-2xl p-3 text-left transition-colors',
                  index === 0 ? 'bg-white shadow-sm' : 'hover:bg-white'
                )}
                key={conversation.id}
                type="button"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700">
                  {conversation.initials}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-bold text-slate-950">
                      {conversation.name}
                    </span>
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      {index === 0 ? formatTime(currentTime) : conversation.time}
                    </span>
                  </span>
                  <span className="mt-1 block truncate text-xs text-muted-foreground">
                    {conversation.preview}
                  </span>
                </span>
                {conversation.unread ? (
                  <span className="mt-1 size-2 rounded-full bg-blue-600" />
                ) : null}
              </button>
            ))}
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="flex items-center justify-between gap-3 border-b border-outline-variant/40 px-4 py-3 sm:px-5">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700">
                S
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-950">Sarah H.</h3>
                <p className="text-xs text-emerald-600">Online</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                aria-label="More message actions"
                className="inline-flex size-8 items-center justify-center rounded-full border border-outline-variant/50 text-slate-700 hover:bg-slate-50"
                type="button"
              >
                <MoreHorizontal className="size-4" />
              </button>
              <button
                aria-label="Close messages"
                className="inline-flex size-8 items-center justify-center rounded-full border border-outline-variant/50 text-slate-700 hover:bg-slate-50 lg:hidden"
                onClick={onClose}
                type="button"
              >
                <X className="size-4" />
              </button>
            </div>
          </header>

          <div className="flex-1 space-y-5 overflow-y-auto bg-white px-4 py-5 sm:px-6">
            {messages.map(message => {
              const isOutgoing = message.direction === 'outgoing';

              return (
                <div
                  className={cn(
                    'flex flex-col',
                    isOutgoing ? 'items-end' : 'items-start'
                  )}
                  key={message.id}
                >
                  <div
                    className={cn(
                      'max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-6 shadow-sm',
                      isOutgoing
                        ? 'rounded-br-sm bg-blue-600 text-white'
                        : 'rounded-bl-sm border border-outline-variant/40 bg-slate-50 text-slate-800'
                    )}
                  >
                    {message.body}
                  </div>
                  <span className="mt-1 text-[11px] font-medium text-muted-foreground">
                    {isOutgoing ? formatTime(currentTime) : message.time}
                  </span>
                </div>
              );
            })}

            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <MoreHorizontal className="size-4" />
              Sarah is typing...
            </div>
          </div>

          <form className="border-t border-outline-variant/40 bg-slate-50 px-3 py-3 sm:px-5">
            <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm">
              <button
                aria-label="Attach file"
                className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-slate-100"
                type="button"
              >
                <Paperclip className="size-4" />
              </button>
              <Input
                className="h-8 flex-1 border-0 bg-transparent px-1 text-xs shadow-none focus-visible:ring-0"
                placeholder="Type your message here..."
              />
              <button
                aria-label="Add emoji"
                className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-slate-100"
                type="button"
              >
                <Smile className="size-4" />
              </button>
              <button
                aria-label="Send message"
                className="inline-flex size-8 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700"
                type="button"
              >
                <Send className="size-4" />
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
