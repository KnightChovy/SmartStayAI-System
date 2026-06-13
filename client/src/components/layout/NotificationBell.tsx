import { Link } from 'react-router';
import { Bell, CheckCheck } from 'lucide-react';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/hooks/account/use-account';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { formatDateShort } from '@/utils/formatDate';
import { cn } from '@/lib/cn';

/** Chuông thông báo ở Navbar: badge số chưa đọc + dropdown xem nhanh 5 mục gần nhất. */
export default function NotificationBell() {
  const { data } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const list = data ?? [];
  const unread = list.filter(n => !n.readAt).length;
  const recent = list.slice(0, 5);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative flex size-9 items-center justify-center rounded-full text-on-surface-variant outline-none transition-colors hover:bg-surface-container-low data-[state=open]:bg-surface-container-low">
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold leading-4 text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2.5">
          <span className="text-sm font-semibold text-on-surface">Notifications</span>
          {unread > 0 && (
            <button
              onClick={() => markAll.mutate()}
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <CheckCheck className="size-3.5" /> Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator className="my-0" />

        {recent.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-on-surface-variant">No notifications yet.</p>
        ) : (
          <ul className="max-h-80 overflow-y-auto py-1">
            {recent.map(n => {
              const isUnread = !n.readAt;
              return (
                <li key={n.id}>
                  <button
                    onClick={() => isUnread && markRead.mutate(n.id)}
                    className={cn(
                      'flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-surface-container-low',
                      isUnread && 'bg-primary/5'
                    )}
                  >
                    <span
                      className={cn(
                        'mt-1.5 size-2 shrink-0 rounded-full',
                        isUnread ? 'bg-primary' : 'bg-transparent'
                      )}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-on-surface">{n.title}</span>
                      <span className="block truncate text-xs text-on-surface-variant">{n.body}</span>
                      <span className="block text-[11px] text-on-surface-variant/70">
                        {formatDateShort(n.createdAt)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <DropdownMenuSeparator className="my-0" />
        <Link
          to="/account/notifications"
          className="block px-3 py-2.5 text-center text-sm font-semibold text-primary hover:bg-surface-container-low"
        >
          View all notifications
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
