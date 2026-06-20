import type { HousekeepingTaskStatus } from '@prisma/client';

/** Bộ lọc khi liệt kê task dọn phòng của khách sạn. */
export interface HousekeepingFilter {
  status?: HousekeepingTaskStatus;
}
