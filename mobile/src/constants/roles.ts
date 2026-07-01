import type { UserRole } from '@/types/auth.type';
import type { Href } from 'expo-router';

export const STAFF_HOME: Href = '/(staff)/bookings';
export const CUSTOMER_HOME: Href = '/(tabs)';

export function isStaff(role: UserRole | undefined | null): boolean {
  return role === 'staff';
}

export function homeRouteForRole(role: UserRole | undefined | null): Href {
  return isStaff(role) ? STAFF_HOME : CUSTOMER_HOME;
}
