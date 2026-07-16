import { Bell, BellRing, CheckCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/hooks/account';
import EmptyState from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { formatDateShort } from '@/utils/formatDate';
import { cn } from '@/lib/cn';

export default function NotificationsPage() {
  const { t } = useTranslation('account');
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const unread = data?.filter(n => !n.readAt).length ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-be-vietnam text-2xl font-bold text-on-surface">
          {t('notifications.title')} {unread > 0 && <span className="text-primary">({unread})</span>}
        </h2>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAll.mutate()}>
            <CheckCheck className="size-4" /> {t('notifications.markAllRead')}
          </Button>
        )}
      </div>

      <div className="mt-5 space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
        ) : !data || data.length === 0 ? (
          <EmptyState icon={Bell} title={t('notifications.emptyTitle')} description={t('notifications.emptyDesc')} />
        ) : (
          data.map(n => {
            const isUnread = !n.readAt;
            return (
              <button
                key={n.id}
                onClick={() => isUnread && markRead.mutate(n.id)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors',
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
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-on-surface">{n.title}</p>
                    {isUnread && <span className="size-2 shrink-0 rounded-full bg-primary" />}
                  </div>
                  <p className="mt-0.5 text-sm text-on-surface-variant">{n.body}</p>
                  <p className="mt-1 text-xs text-on-surface-variant/70">{formatDateShort(n.createdAt)}</p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
