import { Bell, BellRing, CheckCheck, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/hooks/account';
import EmptyState from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { formatDateShort } from '@/utils/formatDate';
import { errorMessage } from '@/utils/errorMessage';
import { cn } from '@/lib/cn';

export default function NotificationsPage() {
  const { t } = useTranslation('account');
  const { data, isLoading } = useNotifications({ limit: 50 });
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const removeNotification = useDeleteNotification();

  const items = data?.results ?? [];
  // Badge lấy số của server, không đếm trên trang hiện tại (danh sách có phân trang).
  const unread = data?.unreadCount ?? 0;

  const handleDelete = (id: string) =>
    removeNotification.mutate(id, {
      onError: err => toast.error(errorMessage(err, t('notifications.actionError'))),
    });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-be-vietnam text-2xl font-bold text-on-surface">
          {t('notifications.title')} {unread > 0 && <span className="text-primary">({unread})</span>}
        </h2>
        {unread > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              markAll.mutate(undefined, {
                onError: err => toast.error(errorMessage(err, t('notifications.actionError'))),
              })
            }
          >
            <CheckCheck className="size-4" /> {t('notifications.markAllRead')}
          </Button>
        )}
      </div>

      <ul className="mt-5 space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <li key={i}>
              <Skeleton className="h-20 w-full rounded-2xl" />
            </li>
          ))
        ) : items.length === 0 ? (
          <li>
            <EmptyState
              icon={Bell}
              title={t('notifications.emptyTitle')}
              description={t('notifications.emptyDesc')}
            />
          </li>
        ) : (
          items.map(n => {
            const isUnread = !n.readAt;
            return (
              <li
                key={n.id}
                className={cn(
                  'flex items-start gap-3 rounded-2xl border p-4 transition-colors',
                  isUnread
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-outline-variant/30 bg-surface hover:bg-surface-container-low'
                )}
              >
                <div
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-full',
                    isUnread ? 'bg-primary/15 text-primary' : 'bg-surface-container-low text-on-surface-variant'
                  )}
                >
                  {isUnread ? <BellRing className="size-4" /> : <Bell className="size-4" />}
                </div>

                {/* Nút bọc riêng phần nội dung — không bọc cả dòng, vì nút Xoá bên dưới
                    sẽ thành <button> lồng trong <button> (HTML không hợp lệ). */}
                <button
                  type="button"
                  onClick={() => markRead.mutate(n.id)}
                  disabled={!isUnread}
                  className="min-w-0 flex-1 text-left disabled:cursor-default"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-medium text-on-surface">{n.title}</span>
                    {isUnread && <span className="size-2 shrink-0 rounded-full bg-primary" />}
                  </span>
                  <span className="mt-0.5 block text-sm text-on-surface-variant">{n.body}</span>
                  <span className="mt-1 block text-xs text-on-surface-variant/70">
                    {formatDateShort(n.createdAt)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(n.id)}
                  aria-label={t('notifications.delete')}
                  title={t('notifications.delete')}
                  className="flex size-9 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-error/10 hover:text-error"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
