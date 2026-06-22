import type { StaffRole, UserStatus } from '@/types/hotel-staff.types';

/** Display config cho role nhân viên (label + tone của Pill). */
export const STAFF_ROLE_CONFIG: Record<StaffRole, { label: string; class: string }> = {
  staff: { label: 'Staff', class: 'bg-blue-100 text-blue-700' },
  marketer: { label: 'Marketer', class: 'bg-violet-100 text-violet-700' },
};

export const STAFF_ROLE_OPTIONS: { value: StaffRole; label: string }[] = [
  { value: 'staff', label: 'Staff' },
  { value: 'marketer', label: 'Marketer' },
];

/** Display config cho trạng thái tài khoản nhân viên. */
export const USER_STATUS_CONFIG: Record<UserStatus, { label: string; class: string }> = {
  active: { label: 'Active', class: 'bg-emerald-100 text-emerald-700' },
  inactive: { label: 'Inactive', class: 'bg-slate-100 text-slate-600' },
  suspended: { label: 'Suspended', class: 'bg-red-100 text-red-700' },
};
