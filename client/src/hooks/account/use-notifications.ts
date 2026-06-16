import { useQuery } from '@tanstack/react-query';
import { notificationService } from '@/services/notification.service';
import { queryKeys } from '@/constants/queryKeys';

export function useNotifications() {
  return useQuery({ queryKey: queryKeys.notifications.all, queryFn: () => notificationService.list() });
}
