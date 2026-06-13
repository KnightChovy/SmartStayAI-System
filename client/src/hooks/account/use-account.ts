import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileService } from '@/services/profile.service';
import { loyaltyService } from '@/services/loyalty.service';
import { notificationService } from '@/services/notification.service';
import { reviewService } from '@/services/review.service';
import { promotionService } from '@/services/promotion.service';
import { queryKeys } from '@/constants/queryKeys';
import type { CreateReviewInput, UserProfile } from '@/types/account.types';

// ----- Profile -----
export function useProfile(seed: Partial<UserProfile>) {
  return useQuery({
    queryKey: queryKeys.profile.me,
    queryFn: () => profileService.get(seed),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<UserProfile>) => profileService.update(patch),
    onSuccess: data => qc.setQueryData(queryKeys.profile.me, data),
  });
}

// ----- Loyalty -----
export function useLoyalty() {
  return useQuery({ queryKey: queryKeys.loyalty.account, queryFn: () => loyaltyService.get() });
}

// ----- Notifications -----
export function useNotifications() {
  return useQuery({ queryKey: queryKeys.notifications.all, queryFn: () => notificationService.list() });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: data => qc.setQueryData(queryKeys.notifications.all, data),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: data => qc.setQueryData(queryKeys.notifications.all, data),
  });
}

// ----- Reviews -----
export function useMyReviews() {
  return useQuery({ queryKey: queryKeys.reviews.mine, queryFn: () => reviewService.listMine() });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReviewInput) => reviewService.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.reviews.mine }),
  });
}

// ----- Promotions -----
export function useAvailablePromotions() {
  return useQuery({ queryKey: queryKeys.vouchers.available, queryFn: () => promotionService.listAvailable() });
}
