import type { PillTone } from '@/components/hotel-partner/shared/Pill';
import type { HotelReviewStatus } from '@/types/hotel-review.types';

/** Nhãn + tone cho từng trạng thái review. */
export const REVIEW_STATUS_CONFIG: Record<
  HotelReviewStatus,
  { label: string; tone: PillTone }
> = {
  published: { label: 'Published', tone: 'emerald' },
  pending: { label: 'Pending', tone: 'amber' },
  hidden: { label: 'Hidden', tone: 'slate' },
};

export const REVIEW_STATUS_OPTIONS: { value: HotelReviewStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'published', label: 'Published' },
  { value: 'pending', label: 'Pending' },
  { value: 'hidden', label: 'Hidden' },
];
