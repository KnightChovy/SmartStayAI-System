import type { RouteObject } from 'react-router';
import { guestRoutes } from './guestRoutes';
import { authRoutes } from './authRoutes';
import { partnerRoutes } from './partnerRoutes';
import { adminRoutes } from './adminRoutes';

/** Toàn bộ route của ứng dụng, gom theo từng cổng/role. */
export const appRoutes: RouteObject[] = [
  ...guestRoutes,
  ...authRoutes,
  ...partnerRoutes,
  ...adminRoutes,
];
