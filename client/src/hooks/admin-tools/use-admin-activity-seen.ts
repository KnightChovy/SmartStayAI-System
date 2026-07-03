import { useLocalStorageValue } from '@/hooks/admin-tools/use-local-storage-value';

const STORAGE_KEY = 'admin.activityLastSeenAt';

/** Mốc "đã xem" hoạt động gần đây (audit log) — chỉ để tính số chưa đọc, không phải data thật. */
export function useAdminActivitySeen() {
  const { value, setValue } = useLocalStorageValue<string>(STORAGE_KEY);

  const markSeenNow = () => setValue(new Date().toISOString());

  return { lastSeenAt: value, markSeenNow };
}
