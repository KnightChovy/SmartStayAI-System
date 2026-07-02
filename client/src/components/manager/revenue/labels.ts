import type { PartnerStatus } from '@/types/revenue.types';

/** Cấu hình badge trạng thái đối tác trong bảng ranking. */
export const PARTNER_STATUS_CONFIG: Record<
  PartnerStatus,
  { label: string; class: string }
> = {
  active: { label: 'Active', class: 'bg-emerald-100 text-emerald-700' },
  inactive: { label: 'Inactive', class: 'bg-slate-100 text-slate-600' },
  suspended: { label: 'Suspended', class: 'bg-red-100 text-red-700' },
};

export const PARTNER_STATUS_OPTIONS: { value: PartnerStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
];
